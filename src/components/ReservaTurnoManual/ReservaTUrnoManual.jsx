import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, query, where, doc, getDoc, setDoc, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { RxCalendar } from "react-icons/rx";
import Swal from 'sweetalert2';
import './ReservaTurnoManual.css'

const ReservaTurnoManual = () => {
    const [telefono, setTelefono] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [dni, setDni] = useState(''); // Estado para el DNI
    const [servicio, setServicio] = useState('');
    const [profesional, setProfesional] = useState('');
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [costoServicio, setCostoServicio] = useState(0); // Para almacenar el costo del servicio
    const [duracionServicio, setDuracionServicio] = useState(30); // Duración del servicio seleccionado
    const [servicios, setServicios] = useState([]);
    const [peluqueros, setPeluqueros] = useState([]);
    const [horariosDisponibles, setHorariosDisponibles] = useState([]);
    const intervaloTurnos = horariosDisponibles.intervalo || 30;
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

        // Nuevos estados para recurrencia
        const [esRecurrente, setEsRecurrente] = useState(false);
        const [intervaloRecurrencia, setIntervaloRecurrencia] = useState(7);
        
        const location = useLocation();
        const prefilledOnceRef = useRef(false);

        useEffect(() => {
        if (prefilledOnceRef.current) return; // evita ejecutar dos veces en StrictMode
        prefilledOnceRef.current = true;

        let payload = location?.state?.prefillCliente
            ? { prefillCliente: location.state.prefillCliente }
            : null;

        if (!payload) {
            try {
            const raw = sessionStorage.getItem("prefillClienteReservaManual");
            if (raw) payload = JSON.parse(raw);
            } catch (_) {}
        }

        if (payload?.prefillCliente) {
            const { dni: dniVal, nombre: nomVal, apellido: apeVal, telefono: telVal } = payload.prefillCliente;

            // Prefill (si preferís pisar siempre, quitá los === "")
            if (typeof dniVal !== "undefined" && dni === "") setDni(dniVal || "");
            if (nomVal && nombre === "") setNombre(nomVal);
            if (apeVal && apellido === "") setApellido(apeVal);
            if (telVal && telefono === "") setTelefono(telVal);

            // 🔴 Limpieza inmediata para que NO se re-aplique al refrescar
            sessionStorage.removeItem("prefillClienteReservaManual");

            // 🔴 Limpia el state de la ruta (así no queda en el history)
            // Usa la misma ruta, replace, y state vacío
            navigate(location.pathname, { replace: true, state: null });
        }

        // Cleanup adicional por si el componente se desmonta
        return () => {
            sessionStorage.removeItem("prefillClienteReservaManual");
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);


    // Obtener peluqueros al montar el componente
    useEffect(() => {
        const fetchPeluqueros = async () => {
            try {
                const peluquerosRef = collection(db, 'peluqueros');
                const querySnapshot = await getDocs(peluquerosRef);
                const peluquerosList = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    nombre: data.nombre,
                    fotoPerfil: data.fotoPerfil || "/vanesamonteros.jpg"  // usa imagen por defecto si no hay
                };
                });

                setPeluqueros(peluquerosList);
                if (peluquerosList.length > 0) {
                    setProfesional(peluquerosList[0].id); // Seleccionar el primer peluquero por defecto
                }
            } catch (error) {
                console.error('Error obteniendo peluqueros:', error);
            }
        };

        fetchPeluqueros();
    }, []);

    // Obtener servicios del profesional seleccionado
            useEffect(() => {
            const fetchServicios = async () => {
                if (!profesional) return; // Si no hay un profesional seleccionado, no hacer nada
    
                try {
                    // 🔹 Creamos una consulta ordenada por el campo "orden"
                    const serviciosRef = collection(db, 'profesionales', profesional, 'servicios');
                    const q = query(serviciosRef, orderBy('orden', 'asc')); // 👈 Aquí el cambio
                    const querySnapshot = await getDocs(q);
    
                    const serviciosList = [];
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        serviciosList.push({
                            id: doc.id,
                            nombre: data.nombre,
                            duracion: data.duracion,
                            precio: data.precio,
                            orden: data.orden ?? 0, // Por si algunos no tienen el campo todavía
                        });
                    });
    
                    // 🔹 Por seguridad, ordenamos también localmente (aunque ya viene ordenado)
                    serviciosList.sort((a, b) => a.orden - b.orden);
    
                    setServicios(serviciosList);
    
                    if (serviciosList.length > 0) {
                        setServicio(serviciosList[0].nombre);
                        setDuracionServicio(serviciosList[0].duracion);
                        setCostoServicio(serviciosList[0].precio);
                    }
                } catch (error) {
                    console.error('Error obteniendo servicios:', error);
                }
            };
    
            fetchServicios();
        }, [profesional]);

    const obtenerFechaActual = () => {
        const hoy = new Date();
        return hoy.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    };
    const obtenerFechaMaxima = () => {
        const hoy = new Date();
        const fechaMaxima = new Date(hoy);
        fechaMaxima.setDate(hoy.getDate() + 120); // Sumar 60 días
        return fechaMaxima.toISOString().split('T')[0];
    };
    const filtrarHorariosDelDia = (fechaSeleccionada) => {
        const ahora = new Date();
        const fechaSeleccionadaObj = new Date(`${fechaSeleccionada}T00:00:00`);
        
        return horariosDisponibles.filter(horario => {
            const [horas, minutos] = horario.split(':').map(Number);
            const horaTurno = new Date(fechaSeleccionadaObj.getFullYear(), fechaSeleccionadaObj.getMonth(), fechaSeleccionadaObj.getDate(), horas, minutos);
    
            // Si es el día actual, solo mostrar horarios futuros
            if (fechaSeleccionadaObj.toDateString() === ahora.toDateString()) {
                return horaTurno > ahora;
            }
    
            // Si no es el día actual, mostrar todos los horarios
            return true;
        });
    };
    
    

    useEffect(() => {
        if (fecha) {
            const horariosFiltrados = filtrarHorariosDelDia(fecha);
            setHorariosDisponibles(horariosFiltrados);
        }
    }, [fecha]); // Solo ejecuta el efecto cuando cambia `fecha`

    const guardarClienteVerificadoSiNoExiste = async () => {
        try {
            const clienteRef = doc(db, 'clientes', telefono);
            const clienteSnap = await getDoc(clienteRef);
    
            if (!clienteSnap.exists() || !clienteSnap.data().verificado) {
                await setDoc(clienteRef, {
                    dni,
                    telefono,
                    nombre,
                    apellido,
                    verificado: true,
                });
            }
        } catch (error) {
            console.error('Error al guardar el cliente como verificado:', error);
        }
    };
    


// Obtener horarios disponibles del peluquero seleccionado y la fecha
const fetchHorariosDisponibles = async () => {
    if (profesional && fecha) {
        try {
            const peluqueroRef = doc(db, 'peluqueros', profesional);
            const peluqueroDoc = await getDoc(peluqueroRef);

            if (peluqueroDoc.exists()) {
                const peluqueroData = peluqueroDoc.data();
                const uidPeluquero = peluqueroData.uid;

                const horariosRef = doc(db, 'horarios', uidPeluquero);
                const horariosDoc = await getDoc(horariosRef);

                if (horariosDoc.exists()) {
                    const horariosData = horariosDoc.data();

                    // Formato de fecha
                    const selectedDate = new Date(`${fecha}T00:00:00Z`);
                    const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                    const diaSeleccionado = selectedDate.getUTCDay();
                    const dia = diasSemana[diaSeleccionado];

                    const horariosDelDia = horariosData[dia];

                    if (horariosDelDia && horariosDelDia.isWorking) {
                        const intervaloTurnos = horariosDelDia.intervalo || 30;
                        const availableSlots = [];

                        // Generar horarios de la mañana
                        const startHour1 = horariosDelDia.start1;
                        const endHour1 = horariosDelDia.end1;
                        let startTime = new Date(`1970-01-01T${startHour1}:00`);
                        let endTime = new Date(`1970-01-01T${endHour1}:00`);

                        while (startTime < endTime) {
                            const slotTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                            const slotEnd = new Date(startTime.getTime() + duracionServicio * 60000);

                            // Excluir turnos que excedan el horario de cierre
                            if (slotEnd <= endTime) {
                                availableSlots.push(slotTime);
                            }
                            startTime.setMinutes(startTime.getMinutes() + intervaloTurnos);
                        }

                        // Generar horarios de la tarde
                        const startHour2 = horariosDelDia.start2;
                        const endHour2 = horariosDelDia.end2;
                        startTime = new Date(`1970-01-01T${startHour2}:00`);
                        endTime = new Date(`1970-01-01T${endHour2}:00`);

                        while (startTime < endTime) {
                            const slotTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                            const slotEnd = new Date(startTime.getTime() + duracionServicio * 60000);

                            // Excluir turnos que excedan el horario de cierre
                            if (slotEnd <= endTime) {
                                availableSlots.push(slotTime);
                            }
                            startTime.setMinutes(startTime.getMinutes() + intervaloTurnos);
                        }

                        // Obtener turnos ocupados para la fecha y profesional
                        const reservasRef = collection(db, 'reservas');
                        const queryReservas = query(reservasRef, where('fecha', '==', fecha), where('uidPeluquero', '==', uidPeluquero));
                        const querySnapshot = await getDocs(queryReservas);
                        const ocupados = querySnapshot.docs.map(doc => {
                            const data = doc.data();
                            return {
                                start: new Date(`${fecha}T${data.hora}`),
                                end: new Date(new Date(`${fecha}T${data.hora}`).getTime() + data.duracion * 60000),
                            };
                        });

                        // Filtrar horarios disponibles sin solapamientos
                        const horariosFiltrados = availableSlots.filter(slot => {
                            const slotStartTime = new Date(`${fecha}T${slot}`);
                            const slotEndTime = new Date(slotStartTime.getTime() + duracionServicio * 60000);

                            return !ocupados.some(({ start, end }) => (
                                start < slotEndTime && end > slotStartTime
                            ));
                        });

                        setHorariosDisponibles(horariosFiltrados);
                    } else {
                        // Mostrar días laborales en orden
                        const diasSemanaOrdenados = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
                        const diasLaborales = diasSemanaOrdenados.filter(
                            key => horariosData[key]?.isWorking
                        );

                        Swal.fire({
                            title: ' ',
                            text: `ESTA PROFESIONAL ATIENDE LOS DIAS: ${diasLaborales.map(d => d.toUpperCase()).join(', ')}.`,
                            icon: 'error',
                            background: 'black',
                            color: 'white',
                            confirmButtonText: 'Ok',
                        });

                        setHorariosDisponibles([]);
                    }
                }
            }
        } catch (error) {
            console.error('Error obteniendo horarios:', error);
        }
    }
};


useEffect(() => {
    fetchHorariosDisponibles();
}, [profesional, fecha, duracionServicio]); // Asegúrate de que estas dependencias estén incluidas


// En la función handleAgendar
const handleAgendar = async (e) => {
    e.preventDefault(); // Evitar el comportamiento predeterminado del formulario
    if (loading) return;
    setLoading(true);

    // Calcular el tiempo de fin
    const startTime = new Date(`${fecha}T${hora}`); // Esto ya está en formato 24 horas
    const endTime = new Date(startTime.getTime() + duracionServicio * 60000); // Añade la duración

    // Verificar si ya existe una reserva para ese horario
    const reservasRef = collection(db, 'reservas');
    const q = query(reservasRef, where('fecha', '==', fecha), where('uidPeluquero', '==', profesional));
    const querySnapshot = await getDocs(q);

    const solapamiento = querySnapshot.docs.some(doc => {
        const data = doc.data();
        const turnoStart = new Date(`${data.fecha}T${data.hora}`);
        const turnoEnd = new Date(turnoStart.getTime() + (data.duracion || duracionServicio) * 60000); // Usa la duración del turno existente o la predeterminada

        const nuevoTurnoStart = new Date(`${fecha}T${hora}`);
        const nuevoTurnoEnd = new Date(nuevoTurnoStart.getTime() + duracionServicio * 60000); // Duración del nuevo servicio

        // Verificar si hay solapamiento
        return (
            (turnoStart < nuevoTurnoEnd && turnoEnd > nuevoTurnoStart) // Solapamiento
        );
    });

    if (solapamiento) {
        Swal.fire({
            title: 'Error de solapamiento',
            text: 'El turno se solapa con otro ya existente. Por favor, elige otro horario.',
            icon: 'error',
            background: 'black',
            color: 'white',
            confirmButtonText: 'Ok'
        });
        setLoading(false);
        return; // No continuar si hay solapamiento
    }

    try {
        const reservas = [];
        let currentFecha = new Date(`${fecha}T${hora}`);
        // Normalizar teléfono: eliminar símbolos y forzar +549
        const telefonoNormalizado = (input) => {
        if (!input) return null;

        // 1️⃣ quitar todo lo que no sea número
        let s = input.replace(/\D/g, "");

        // 2️⃣ quitar prefijos internacionales redundantes
        if (s.startsWith("00")) s = s.slice(2);
        if (s.startsWith("54")) s = s.slice(2);

        // 3️⃣ casos comunes mal escritos
        if (s.startsWith("9") && s.length > 0) s = s.slice(1);
        if (s.startsWith("0")) s = s.slice(1);

        // --- 🔹 CASO ESPECIAL: Buenos Aires (código 11)
        if (s.startsWith("11")) {
            // eliminar el "15" si aparece justo después de 11
            s = s.replace(/^11\s*15/, "11");
            // asegurarse de tener los últimos 8 dígitos de número
            if (s.length > 10) s = s.slice(0, 10);
            return "+549" + s;
        }

        // --- 🔹 CASOS GENERALES (códigos de 3 a 4 dígitos)
        // 4️⃣ Si hay EXACTAMENTE area(3-4) + 15 + subscriber(6-8) -> quitar el 15
        let m = s.match(/^(\d{3,4})15(\d{6,8})$/);
        if (m) {
            const area = m[1];
            const subscriber = m[2];
            return "+549" + area + subscriber;
        }

        // 5️⃣ Si no hay match estricto, intentamos elegir área 3–4 y suscribirse 6–8
        for (let areaLen = 3; areaLen <= 4; areaLen++) {
            if (s.length - areaLen >= 6 && s.length - areaLen <= 8) {
            const area = s.slice(0, areaLen);
            let subscriber = s.slice(areaLen);

            // si subscriber comienza con "15" lo quitamos
            if (subscriber.startsWith("15") && subscriber.length - 2 >= 6) {
                subscriber = subscriber.slice(2);
            }

            return "+549" + area + subscriber;
            }
        }

        // 6️⃣ Intentar detectar patrón laxo area+15+rest
        m = s.match(/^(\d{3,4})15(\d+)$/);
        if (m) {
            const area = m[1];
            let subscriber = m[2];
            if (subscriber.length > 8) subscriber = subscriber.slice(-8);
            return "+549" + area + subscriber;
        }

        // 7️⃣ Fallback final
        let area = s.length >= 11 ? s.slice(0, 3) : s.slice(0, Math.min(3, s.length - 6));
        if (!area || area.length < 2) area = s.slice(0, 2);
        let subscriber = s.slice(area.length);
        if (subscriber.length > 8) subscriber = subscriber.slice(-8);

        if (subscriber.length < 6) return null;

        return "+549" + area + subscriber;
        };

        for (let i = 0; i < (esRecurrente ? 10 : 1); i++) {
            reservas.push({
                nombre,
                apellido,
                dni: dni || null,
                telefono: telefonoNormalizado(telefono),
                servicio,
                fecha: currentFecha.toISOString().split('T')[0],
                hora: currentFecha.toTimeString().split(' ')[0].slice(0, 5),
                duracion: duracionServicio,
                uidPeluquero: profesional,
                costoServicio,
                status: 'Sin realizar',
                recurrente: esRecurrente,
                intervaloRecurrencia: esRecurrente ? intervaloRecurrencia : null,
            });

            if (esRecurrente) {
                currentFecha.setDate(currentFecha.getDate() + intervaloRecurrencia);
            }
        }

        await guardarClienteVerificadoSiNoExiste();


        for (const reserva of reservas) {
            await addDoc(collection(db, 'reservas'), reserva);
        }

        Swal.fire({
            title: 'Reserva registrada',
            text: esRecurrente
                ? 'Tus reservas recurrentes han sido creadas exitosamente.'
                : 'Tu reserva ha sido creada exitosamente.',
            icon: 'success',
            background: 'black',
            color: 'white',
            showCancelButton: true,
            confirmButtonText: 'Agregar otro turno',
            cancelButtonText: 'Listo',
            customClass: {
                popup: 'glass-popup',
                confirmButton: 'glass-button',
                cancelButton: 'glass-button',
            }
            }).then((result) => {
            if (result.isConfirmed) {
                // 🧠 Conserva datos del cliente, limpia fecha y hora
                setFecha('');
                setHora('');
            } else {
                navigate('/estado'); // Redirigir al inicio o a otra página después de crear la reserva
            }
            });
        } catch (error) {
        console.error('Error al crear la reserva:', error);
    } finally {
        setLoading(false);
    }
};


    return (
            <form className='form-reserva' onSubmit={handleAgendar}>
                <div className="titulo">
                    <h1 className='titulo'> <RxCalendar /> Reservar turno</h1>
                </div>  
                <h3 className='h3'>Completa el siguiente formulario para reservar tu cita</h3>             
                {/*<div className='div-tel'>*/}
                <div className='div-tel'>

                <input
                    className='input-gral2'
                    placeholder='DNI (opcional)'
                    type="text"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                />

                    <input className='input-gral2' placeholder='Nombre' type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required/>
                
                    <input
                        className='input-gral2'
                        placeholder='Apellido'
                        type="text"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        required
                    />
                
                
                    <input
                        className='input-gral2'
                        placeholder='Ingresa telefono (caracteristica + numero)'
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        required
                    />
                    </div>
                
                <div className="profesionales-selector">
                {peluqueros.map((prof) => (
                    <div
                    key={prof.id}
                    className={`prof-card ${prof.id === profesional ? 'selected' : ''}`}
                    onClick={() => setProfesional(prof.id)}
                    >
                    <img
                        src={prof.fotoPerfil}
                        alt={prof.nombre}
                        className="prof-card-img"
                    />
                    <p>{prof.nombre}</p>
                    </div>
                ))}
                </div>
                <div className='seccion-2'>
                    <div className='div-serv' >
                    <label className='titulo-servicio'>Servicio:</label>
                    
                    <select className='select-servicio' value={servicio} onChange={(e) => {
                        const selectedService = servicios.find(s => s.nombre === e.target.value);
                        setServicio(selectedService.nombre);
                        setDuracionServicio(selectedService.duracion); // Actualiza la duración del servicio
                        setCostoServicio(selectedService.precio); // Actualiza el costo del servicio
                    }}>                        
                        {servicios.map((s) => (
                            <option key={s.nombre} value={s.nombre}> {`${s.nombre} - $${s.precio} - (${s.duracion} min)`}</option>
                        ))}
                    </select>
                    </div>
                </div>
                <div className='div-date'>
                    <label className='titulo-servicio' >Fecha:</label>

                    <input
                        className='select-seccion2'
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        min={obtenerFechaActual()}
                        max={obtenerFechaMaxima()}
                        required
                    />
                </div>
                <div className='div-date'>
                    <label className='titulo-servicio' >Hora:</label>

                    <select
                        className='select-seccion2'
                        value={hora}
                        onChange={(e) => setHora(e.target.value)}
                        required
                    >
                        <option value="">Selecciona una hora</option>
                        {horariosDisponibles.map((h) => (
                            <option key={h} value={h}>{h}</option>
                        ))}
                    </select>
                    <div className='div-recurrencia'>
                <label>
                    <input
                        type="checkbox"
                        className="cyberpunk-checkbox2"
                        checked={esRecurrente}
                        onChange={(e) => setEsRecurrente(e.target.checked)}
                    />
                    Turno recurrente
                </label>

                {esRecurrente && (
                    <div>
                        <label>Repetir cada:</label>
                        <select
                        className='select-seccion2'
                            value={intervaloRecurrencia}
                            onChange={(e) => setIntervaloRecurrencia(Number(e.target.value))}
                        >
                            <option value={7}>7 días</option>
                            <option value={14}>14 días</option>
                            <option value={21}>21 días</option>
                        </select>
                    </div>
                )}
            </div>

                </div>
                <div className='div-button'>
                <button className='button-turno' type="submit"><RxCalendar />Agendar Turno</button>
                </div>            
            
        </form>
    );
};

export default ReservaTurnoManual;