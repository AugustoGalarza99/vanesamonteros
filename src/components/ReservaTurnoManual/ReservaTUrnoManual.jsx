import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, query, where, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './ReservaTurnoManual.css'

const ReservaTurnoManual = () => {
    const [telefono, setTelefono] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [servicio, setServicio] = useState('');
    const [profesional, setProfesional] = useState('');
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [duracionServicio, setDuracionServicio] = useState(0); // Duración del servicio seleccionado
    const [servicios, setServicios] = useState([]);
    const [peluqueros, setPeluqueros] = useState([]);
    const [horariosDisponibles, setHorariosDisponibles] = useState([]);
    const navigate = useNavigate();

    // Obtener servicios al montar el componente
    useEffect(() => {
        const fetchServicios = async () => {
            try {
                const serviciosRef = collection(db, 'servicios');
                const querySnapshot = await getDocs(serviciosRef);
                const serviciosList = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    serviciosList.push({ nombre: data.nombre, duracion: data.duracion });
                });

                setServicios(serviciosList);
                if (serviciosList.length > 0) {
                    setServicio(serviciosList[0].nombre); // Seleccionar el primer servicio por defecto
                    setDuracionServicio(serviciosList[0].duracion); // Guardar la duración del primer servicio
                }
            } catch (error) {
                console.error('Error obteniendo servicios:', error);
            }
        };

        fetchServicios();
    }, []);

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
                        const dia = new Date(fecha).toLocaleString('es-ES', { weekday: 'long' }).toLowerCase();
                        const horariosDelDia = horariosData[dia];

                        if (horariosDelDia && horariosDelDia.isWorking) {
                            const availableSlots = [];

                            // Horarios de la mañana
                            const startHour1 = horariosDelDia.start1;
                            const endHour1 = horariosDelDia.end1;
                            let startTime = new Date(`1970-01-01T${startHour1}:00`);
                            let endTime = new Date(`1970-01-01T${endHour1}:00`);

                            while (startTime < endTime) {
                                const slotTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                availableSlots.push(slotTime);
                                startTime.setMinutes(startTime.getMinutes() + 30); // Incrementar 30 minutos
                            }

                            // Horarios de la tarde
                            const startHour2 = horariosDelDia.start2;
                            const endHour2 = horariosDelDia.end2;
                            startTime = new Date(`1970-01-01T${startHour2}:00`);
                            endTime = new Date(`1970-01-01T${endHour2}:00`);

                            while (startTime < endTime) {
                                const slotTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                availableSlots.push(slotTime);
                                startTime.setMinutes(startTime.getMinutes() + 30); // Incrementar 30 minutos
                            }

                            // Filtrar horarios ocupados
                            const reservasRef = collection(db, 'reservas');
                            const queryReservas = query(reservasRef, where('fecha', '==', fecha), where('uidPeluquero', '==', uidPeluquero));
                            const querySnapshot = await getDocs(queryReservas);
                            const ocupados = querySnapshot.docs.map(doc => ({
                                hora: doc.data().hora,
                                duracion: doc.data().duracion || duracionServicio // Asegurarse de tener la duración del servicio ya reservado
                            }));

                            const horariosFiltrados = availableSlots.filter(slot => {
                                const slotStartTime = new Date(`${fecha}T${slot}`);
                                const slotEndTime = new Date(slotStartTime.getTime() + duracionServicio * 60000);

                                return !ocupados.some(ocupado => {
                                    const ocupadoStartTime = new Date(`${fecha}T${ocupado.hora}`);
                                    const ocupadoEndTime = new Date(ocupadoStartTime.getTime() + ocupado.duracion * 60000);

                                    // Verificar solapamiento
                                    return (
                                        (ocupadoStartTime < slotEndTime && ocupadoEndTime > slotStartTime) // Solapamiento
                                    );
                                });
                            });

                            setHorariosDisponibles(horariosFiltrados);
                        } else {
                            console.log('El peluquero no trabaja este día.');
                            setHorariosDisponibles([]); // Sin horarios disponibles
                        }
                    } else {
                        console.log('No se encontró horario para el peluquero seleccionado.');
                    }
                } else {
                    console.log('No se encontró el peluquero seleccionado.');
                }
            } catch (error) {
                console.error('Error obteniendo horarios:', error);
            }
        }
    };

    // Actualizar horarios cuando cambian el servicio, profesional o fecha
    useEffect(() => {
        fetchHorariosDisponibles();
    }, [profesional, fecha, duracionServicio]); // Agregar duracionServicio como dependencia

    const handleAgendar = async (e) => {
        e.preventDefault(); // Evitar el comportamiento predeterminado del formulario

        // Calcular el tiempo de fin
        const startTime = new Date(`${fecha}T${hora}`);
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
            alert('El turno se solapa con otro ya existente. Por favor, elige otro horario.');
            return; // No continuar si hay solapamiento
        }

        try {
            // Guardar la reserva en Firestore
            const reservasRef = collection(db, 'reservas');
            await addDoc(reservasRef, {
                nombre,
                apellido,
                telefono,
                servicio,
                fecha,
                hora,
                duracion: duracionServicio,
                uidPeluquero: profesional,
                status: 'Pendiente' // Establecer el estado de la reserva
            });

            alert('Reserva creada con éxito');
            navigate('/'); // Redirigir al inicio o a otra página después de crear la reserva
        } catch (error) {
            console.error('Error al crear la reserva:', error);
        }
    };

    return (
        <div className="reserva-form-container">
            <h1>Reservar turno</h1>
            <form onSubmit={handleAgendar}>
                <div className='div-carga'>
                <div className='div-contenedor'>
                    <input
                        className='input-carga'
                        placeholder='Nombre'
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                    />
                </div>
                <div className='div-contenedor'>
                    <input
                        className='input-carga'
                        placeholder='Apellido'
                        type="text"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        required
                    />
                </div>
                <div className='div-contenedor'>
                    <input
                        className='input-carga'
                        placeholder='Telefono'
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        required
                    />
                </div>
                </div>
                <div className='div-servicios'>
                    <label>Servicio:</label>
                    <div className='div-select'>
                    <select className='select-servicio' value={servicio} onChange={(e) => {
                        const selectedService = servicios.find(s => s.nombre === e.target.value);
                        setServicio(selectedService.nombre);
                        setDuracionServicio(selectedService.duracion); // Actualiza la duración del servicio
                    }}>                        
                        {servicios.map((s) => (
                            <option key={s.nombre} value={s.nombre}>{`${s.nombre} (${s.duracion} minutos)`}</option>
                        ))}
                    </select>
                    </div>
                </div>
                <div className='div-servicios'>
                    <label>Peluquero:</label>
                    <div className='div-select'>
                    <select
                        className='select-servicio'
                        value={profesional}
                        onChange={(e) => setProfesional(e.target.value)}
                    >
                        {peluqueros.map((p) => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>
                    </div>
                </div>
                <div className='div-servicios'>
                    <label>Fecha:</label>
                    <div className='div-select'>
                    <input
                        className='select-servicio'
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        required
                    />
                    </div>
                </div>
                <div className='div-servicios'>
                    <label>Hora:</label>
                    <div className='div-select'>
                    <select
                        className='select-servicio'
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
                </div>
                <div className='div-button'>
                <button className='button-turno' type="submit">Agendar Turno</button>
                </div>
            </form>
        </div>
    );
};

export default ReservaTurnoManual;
