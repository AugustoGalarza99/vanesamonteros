import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import './ReservaForm.css';

const ReservasForm = () => {
    const [dni, setDni] = useState('');
    const [telefono, setTelefono] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [servicio, setServicio] = useState('');
    const [profesional, setProfesional] = useState('');
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [verificado, setVerificado] = useState(false);
    const [mostrarSolicitarCodigo, setMostrarSolicitarCodigo] = useState(false);
    const [servicios, setServicios] = useState([]);
    const [peluqueros, setPeluqueros] = useState([]);
    const [horariosDisponibles, setHorariosDisponibles] = useState([]);
    const [duracionServicio, setDuracionServicio] = useState(0); // Para almacenar la duración del servicio
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

    // Obtener horarios disponibles del peluquero seleccionado y filtrar por solapamiento
    useEffect(() => {
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

                                // Filtrar horarios ocupados y solapados
                                const reservasRef = collection(db, 'reservas');
                                const queryReservas = query(reservasRef, where('fecha', '==', fecha), where('uidPeluquero', '==', uidPeluquero));
                                const querySnapshot = await getDocs(queryReservas);
                                const ocupados = querySnapshot.docs.map(doc => {
                                    const data = doc.data();
                                    return { 
                                        start: new Date(`${fecha}T${data.hora}`), 
                                        end: new Date(new Date(`${fecha}T${data.hora}`).getTime() + data.duracion * 60000) 
                                    };
                                });

                                const horariosFiltrados = availableSlots.filter(slot => {
                                    const slotStartTime = new Date(`${fecha}T${slot}`);
                                    const slotEndTime = new Date(slotStartTime.getTime() + duracionServicio * 60000);
                                    
                                    // Verifica que no haya solapamiento
                                    return !ocupados.some(({ start, end }) => (
                                        (start < slotEndTime && end > slotStartTime) // Solapamiento
                                    ));
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

        fetchHorariosDisponibles();
    }, [profesional, fecha, duracionServicio]); // Dependencias para volver a ejecutar la consulta

    const handleAgendar = async (e) => {
        e.preventDefault(); // Evitar el comportamiento predeterminado del formulario
        try {
            const clientesRef = collection(db, 'clientes'); // Referencia a la colección de clientes
            const q = query(clientesRef, where('dni', '==', dni)); // Buscar cliente por DNI
            const querySnapshot = await getDocs(q); // Obtener documentos que coinciden con la consulta

            if (!querySnapshot.empty) {
                for (const doc of querySnapshot.docs) {
                    const userData = doc.data(); // Obtener datos del usuario
                    if (userData.telefono === telefono && userData.verificado) {
                        setVerificado(true);

                        // Guardar la reserva en Firestore
                        try {
                            const reservasRef = collection(db, 'reservas'); // Referencia a la colección de reservas
                            
                            // Calcula el tiempo de fin
                            const startTime = new Date(`${fecha}T${hora}`);
                            const endTime = new Date(startTime.getTime() + duracionServicio * 60000); // Añade la duración

                            await addDoc(reservasRef, {
                                dni,
                                nombre,
                                apellido,
                                telefono,
                                servicio,
                                fecha,
                                hora,
                                duracion: duracionServicio, // Guarda la duración
                                horaFin: endTime.toISOString(), // Guarda la hora de fin
                                uidPeluquero: profesional, // Registrar el UID del peluquero seleccionado
                                status: 'Pendiente' // Establecer el estado de la reserva
                            });

                            alert('Reserva creada con éxito');
                            navigate('/'); // Redirigir al inicio o a otra página después de crear la reserva
                        } catch (error) {
                            console.error('Error al crear la reserva:', error);
                        }
                    } else {
                        alert('Número de teléfono incorrecto o usuario no verificado.');
                        setVerificado(false);
                        setMostrarSolicitarCodigo(true);
                    }
                }
            } else {
                alert('Usuario no encontrado, por favor solicita un código.');
                setVerificado(false);
                setMostrarSolicitarCodigo(true);
            }
        } catch (error) {
            console.error('Error verificando usuario:', error);
        }
    };

    return (            
            <form onSubmit={handleAgendar}>
            <div className='titulo'>
                <FontAwesomeIcon icon={faCalendarAlt} />
                <h1>Agenda tu cita</h1>                
            </div>
            <h3>Completa el siguiente formulario para reservar tu cita</h3>
                <div className='seccion'>
                <input className='input-gral' type="text" placeholder='Ingresa tu DNI' value={dni} onChange={(e) => setDni(e.target.value)} required />
                </div>
                <div>
                    <label>Teléfono:</label>
                    <input
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Nombre:</label>
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Apellido:</label>
                    <input
                        type="text"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Servicio:</label>
                    <select className='select-seccion' value={servicio} onChange={(e) => {
                        const selectedService = servicios.find(s => s.nombre === e.target.value);
                        setServicio(selectedService.nombre);
                        setDuracionServicio(selectedService.duracion); // Actualiza la duración del servicio
                    }}>
                        {servicios.map((s) => (
                            <option key={s.nombre} value={s.nombre}> {`${s.nombre} (${s.duracion} min)`}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Peluquero:</label>
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
                <div>
                    <label>Fecha:</label>
                    <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Hora:</label>
                    <select
                        className='select-seccion'
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
                <button type="submit">Agendar Turno</button>
            </form>
        
    );
};

export default ReservasForm;
