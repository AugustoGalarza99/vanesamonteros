import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, query, where, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';


const TurnoFijo = () => {
    const [telefono, setTelefono] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [servicio, setServicio] = useState('');
    const [profesional, setProfesional] = useState('');
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [duracionServicio, setDuracionServicio] = useState(0);
    const [servicios, setServicios] = useState([]);
    const [peluqueros, setPeluqueros] = useState([]);
    const [horariosDisponibles, setHorariosDisponibles] = useState([]);
    const [recurrente, setRecurrente] = useState(false); // Nuevo: Turno recurrente
    const [frecuencia, setFrecuencia] = useState(''); // Frecuencia de recurrencia
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Obtener servicios y peluqueros
    useEffect(() => {
        const fetchServicios = async () => {
            try {
                const serviciosRef = collection(db, 'servicios');
                const querySnapshot = await getDocs(serviciosRef);
                const serviciosList = querySnapshot.docs.map(doc => doc.data());
                setServicios(serviciosList);
                if (serviciosList.length > 0) {
                    setServicio(serviciosList[0].nombre);
                    setDuracionServicio(serviciosList[0].duracion);
                }
            } catch (error) {
                console.error('Error obteniendo servicios:', error);
            }
        };

        const fetchPeluqueros = async () => {
            try {
                const peluquerosRef = collection(db, 'peluqueros');
                const querySnapshot = await getDocs(peluquerosRef);
                setPeluqueros(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                if (peluqueros.length > 0) setProfesional(peluqueros[0].id);
            } catch (error) {
                console.error('Error obteniendo peluqueros:', error);
            }
        };

        fetchServicios();
        fetchPeluqueros();
    }, []);

    // Obtener horarios disponibles (incluyendo verificación de turnos fijos y únicos)


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
                            
                            const selectedDate = new Date(`${fecha}T00:00:00Z`);
                            const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                            const diaSeleccionado = selectedDate.getUTCDay();
                            const dia = diasSemana[diaSeleccionado];
                            const horariosDelDia = horariosData[dia];
    
                            if (horariosDelDia && horariosDelDia.isWorking) {
                                const availableSlots = [];
    
                                // Generación de franjas horarias
                                const generateSlots = (startHour, endHour) => {
                                    let startTime = new Date(`1970-01-01T${startHour}:00`);
                                    let endTime = new Date(`1970-01-01T${endHour}:00`);
    
                                    while (startTime < endTime) {
                                        const slotTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                                        availableSlots.push(slotTime);
                                        startTime.setMinutes(startTime.getMinutes() + 30);
                                    }
                                };
    
                                // Horarios de la mañana y tarde
                                generateSlots(horariosDelDia.start1, horariosDelDia.end1);
                                generateSlots(horariosDelDia.start2, horariosDelDia.end2);
    
                                // Filtrar horarios ocupados y solapados
                                const reservasRef = collection(db, 'reservas');
                                const queryReservas = query(reservasRef, where('uidPeluquero', '==', uidPeluquero));
                                const querySnapshot = await getDocs(queryReservas);
    
                                // Procesar reservas ocupadas y recurrentes
                                const ocupados = querySnapshot.docs.flatMap(doc => {
                                    const data = doc.data();
                                    const reservaFecha = new Date(data.fecha);
                                    const isRecurrente = data.recurrente; // Suponemos que `recurrencia` es una marca booleana en la reserva
    
                                    // Si la reserva es recurrente, generar fechas futuras ocupadas
                                    if (isRecurrente) {
                                        const ocupadosRecurrentes = [];
                                        let recurrenteFecha = new Date(reservaFecha);
    
                                        while (recurrenteFecha <= selectedDate) {
                                            if (recurrenteFecha.toISOString().split('T')[0] === fecha) {
                                                ocupadosRecurrentes.push({
                                                    start: new Date(`${fecha}T${data.hora}`),
                                                    end: new Date(new Date(`${fecha}T${data.hora}`).getTime() + data.duracion * 60000)
                                                });
                                            }
                                            recurrenteFecha.setDate(recurrenteFecha.getDate() + 7); // Asumiendo recurrencia semanal
                                        }
    
                                        return ocupadosRecurrentes;
                                    } else {
                                        return [{
                                            start: new Date(`${data.fecha}T${data.hora}`),
                                            end: new Date(new Date(`${data.fecha}T${data.hora}`).getTime() + data.duracion * 60000)
                                        }];
                                    }
                                });
    
                                // Filtrar horarios disponibles considerando solapamientos
                                const horariosFiltrados = availableSlots.filter(slot => {
                                    const slotStartTime = new Date(`${fecha}T${slot}`);
                                    const slotEndTime = new Date(slotStartTime.getTime() + duracionServicio * 60000);
                                    
                                    return !ocupados.some(({ start, end }) => (
                                        (start < slotEndTime && end > slotStartTime)
                                    ));
                                });
    
                                setHorariosDisponibles(horariosFiltrados);
                            } else {
                                setHorariosDisponibles([]);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error obteniendo horarios:', error);
                }
            }
        };
    
        fetchHorariosDisponibles();
    }, [profesional, fecha, duracionServicio]);
    

    const handleAgendar = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        try {
            const startTime = new Date(`${fecha}T${hora}`);
            const endTime = new Date(startTime.getTime() + duracionServicio * 60000);

            const reservasRef = collection(db, 'reservas');
            const q = query(reservasRef, where('fecha', '==', fecha), where('uidPeluquero', '==', profesional));
            const querySnapshot = await getDocs(q);

            const solapamiento = querySnapshot.docs.some(doc => {
                const data = doc.data();
                const turnoStart = new Date(`${data.fecha}T${data.hora}`);
                const turnoEnd = new Date(turnoStart.getTime() + (data.duracion || duracionServicio) * 60000);
                return (turnoStart < endTime && turnoEnd > startTime);
            });

            if (solapamiento) {
                alert('El turno se solapa con otro ya existente. Por favor, elige otro horario.');
                return;
            }

            await addDoc(reservasRef, {
                nombre,
                apellido,
                telefono,
                servicio,
                fecha, // Fecha inicial del turno recurrente
                hora,
                duracion: duracionServicio,
                uidPeluquero: profesional,
                recurrente,
                frecuencia, // Semanal, Mensual, etc.
                status: 'Pendiente'
            });
            

            Swal.fire({
                title: 'Reserva registrada',
                text: 'Tu reserva ha sido creada exitosamente, muchas gracias.',
                icon: 'success',
                background: 'black',
                color: 'white',
                confirmButtonText: 'Ok'
            });
            navigate('/agenda');
        } catch (error) {
            console.error('Error al crear la reserva:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className='form-reserva' onSubmit={handleAgendar}>
            <h1>Reservar Turno</h1>
            <input placeholder='Nombre' type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required/>
            <input placeholder='Apellido' type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} required/>
            <input placeholder='Telefono' type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} required/>
            
            <label>Servicio</label>
            <select value={servicio} onChange={(e) => {
                const selectedService = servicios.find(s => s.nombre === e.target.value);
                setServicio(selectedService.nombre);
                setDuracionServicio(selectedService.duracion);
            }}>
                {servicios.map(s => <option key={s.nombre} value={s.nombre}>{s.nombre}</option>)}
            </select>

            <label>Peluquero</label>
            <select value={profesional} onChange={(e) => setProfesional(e.target.value)}>
                {peluqueros.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>

            <label>Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />

            <label>Hora</label>
            <select value={hora} onChange={(e) => setHora(e.target.value)} required>
                <option value="">Selecciona una hora</option>
                {horariosDisponibles.map(h => <option key={h} value={h}>{h}</option>)}
            </select>

            <label>Turno Recurrente</label>
            <input type="checkbox" checked={recurrente} onChange={() => setRecurrente(!recurrente)} />
            
            {recurrente && (
                <select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)}>
                    <option value="">Selecciona la frecuencia</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensual">Mensual</option>
                </select>
            )}

            <button type="submit" disabled={loading}>Confirmar</button>
        </form>
    );
};

export default TurnoFijo;
