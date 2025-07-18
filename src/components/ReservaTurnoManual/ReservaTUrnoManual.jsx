import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
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
                const serviciosRef = collection(db, 'profesionales', profesional, 'servicios');
                const querySnapshot = await getDocs(serviciosRef);
                const serviciosList = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    serviciosList.push({
                        id: doc.id,
                        nombre: data.nombre,
                        duracion: data.duracion,
                        precio: data.precio, // Asegúrate de que el campo precio exista en los documentos
                    });
                });

                setServicios(serviciosList);
                if (serviciosList.length > 0) {
                    setServicio(serviciosList[0].nombre); // Seleccionar el primer servicio por defecto
                    setDuracionServicio(serviciosList[0].duracion); // Guardar la duración del primer servicio
                    setCostoServicio(serviciosList[0].precio); // Guardar el costo del primer servicio
                }
            } catch (error) {
                console.error('Error obteniendo servicios:', error);
            }
        };

        fetchServicios();
    }, [profesional]); // Este efecto se ejecuta cada vez que cambia el valor de 'profesional'

    const obtenerFechaActual = () => {
        const hoy = new Date();
        return hoy.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    };
    const obtenerFechaMaxima = () => {
        const hoy = new Date();
        const fechaMaxima = new Date(hoy);
        fechaMaxima.setDate(hoy.getDate() + 60); // Sumar 60 días
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
        const telefonoNormalizado = "+549" + telefono.replace(/\D/g, "").replace(/^549/, "").replace(/^9/, "");

        for (let i = 0; i < (esRecurrente ? 10 : 1); i++) {
            reservas.push({
                nombre,
                apellido,
                dni: dni || null,
                telefono: telefonoNormalizado,
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
                        placeholder='Ingresa numero de telefono incluyendo caracteristica'
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