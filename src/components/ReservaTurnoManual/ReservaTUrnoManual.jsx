import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, query, where, doc, getDoc } from 'firebase/firestore';
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

    // Obtener peluqueros al montar el componente
    useEffect(() => {
        const fetchPeluqueros = async () => {
            try {
                const peluquerosRef = collection(db, 'peluqueros');
                const querySnapshot = await getDocs(peluquerosRef);
                const peluquerosList = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    peluquerosList.push({ id: doc.id, nombre: data.nombre });
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
                            title: 'DIA NO LABORAL',
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
        // Guardar la reserva en Firestore
        const reservasRef = collection(db, 'reservas');
        await addDoc(reservasRef, {
            nombre,
            apellido,
            dni: dni || null, // Guardar el DNI solo si se proporcionó
            telefono,
            servicio,
            fecha,
            hora, // Se guarda en formato 24 horas
            duracion: duracionServicio,
            uidPeluquero: profesional,
            costoServicio,
            status: 'Pendiente' // Establecer el estado de la reserva
        });

        Swal.fire({
            title: 'Reserva registrada',
            html: 'Tu reserva ha sido creada exitosamente, muchas gracias. <br><br> <strong>IMPORTANTE:</strong> El turno puede verse modificado en +/- 15 minutos, en caso de serlo seras notificado. <br><br>Gracias por su comprensión',
            icon: 'success',
            background: 'black', 
            color: 'white', 
            confirmButtonText: 'Ok'
        });
        navigate('/agenda'); // Redirigir al inicio o a otra página después de crear la reserva
    } catch (error) {
        console.error('Error al crear la reserva:', error);
    } finally{
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
                        placeholder='Telefono'
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        required
                    />
                    </div>
                
                {/*</div>*/}
                <div className='div-date'>
                    <label className='titulo-servicio' >Profesional:</label>

                    <select
                        className='select-seccion'
                        value={profesional}
                        onChange={(e) => setProfesional(e.target.value)}
                    >
                        {peluqueros.map((p) => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>

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

                </div>
                <div className='div-button'>
                <button className='button-turno' type="submit"><RxCalendar />Agendar Turno</button>
                </div>            
            
        </form>
    );
};

export default ReservaTurnoManual;