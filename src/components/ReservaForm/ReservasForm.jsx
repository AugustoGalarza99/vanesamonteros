import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, where, addDoc, setDoc } from 'firebase/firestore';
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
    const [profesional, setProfesional] = useState(''); // Estado para almacenar el peluquero seleccionado
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [verificado, setVerificado] = useState(false);
    const [mostrarSolicitarCodigo, setMostrarSolicitarCodigo] = useState(false);
    const [whatsapp, setWhatsapp] = useState('');
    const [servicios, setServicios] = useState([]); // Servicios disponibles
    const [peluqueros, setPeluqueros] = useState([]); // Estado para almacenar la lista de peluqueros
    const [horariosDisponibles, setHorariosDisponibles] = useState([]); // Horarios disponibles
    const [codigoVerificacion, setCodigoVerificacion] = useState(''); // Estado para almacenar el código de verificación


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

                setPeluqueros(peluquerosList); // Guardar peluqueros en el estado
                if (peluquerosList.length > 0) {
                    setProfesional(peluquerosList[0].id); // Seleccionar el primer peluquero por defecto
                }
            } catch (error) {
                console.error('Error obteniendo peluqueros:', error);
            }
        };

        fetchPeluqueros();
    }, []);

    // Obtener horarios disponibles del peluquero seleccionado
// Obtener horarios disponibles del peluquero seleccionado
useEffect(() => {
    const fetchHorariosDisponibles = async () => {
        if (profesional && fecha) {
            try {
                // Obtener el documento del peluquero
                const peluqueroRef = doc(db, 'peluqueros', profesional);
                const peluqueroDoc = await getDoc(peluqueroRef);

                if (peluqueroDoc.exists()) {
                    const peluqueroData = peluqueroDoc.data();
                    const uidPeluquero = peluqueroData.uid; // Obtener el UID

                    // Buscar horarios usando el UID del peluquero
                    const horariosRef = doc(db, 'horarios', uidPeluquero);
                    const horariosDoc = await getDoc(horariosRef);

                    if (horariosDoc.exists()) {
                        const horariosData = horariosDoc.data();
                        const dia = new Date(fecha).toLocaleString('es-ES', { weekday: 'long' }).toLowerCase(); // Obtener el día seleccionado
                        console.log('Día seleccionado:', dia); // Log para verificar el día

                        const horariosDelDia = horariosData[dia]; // Obtener horarios de ese día
                        console.log('Horarios del día:', horariosDelDia); // Log para verificar horarios del día

                        if (horariosDelDia && horariosDelDia.isWorking) {
                            const availableSlots = []; // Arreglo para los horarios disponibles
                            
                            // Horarios de la mañana
                            const startHour1 = horariosDelDia.start1; // Inicio de la mañana
                            const endHour1 = horariosDelDia.end1; // Fin de la mañana
                            
                            let startTime = new Date(`1970-01-01T${startHour1}:00`);
                            let endTime = new Date(`1970-01-01T${endHour1}:00`);
                            
                            while (startTime < endTime) {
                                const slotTime = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                availableSlots.push(slotTime);
                                startTime.setMinutes(startTime.getMinutes() + 30); // Incrementar 30 minutos
                            }

                            // Horarios de la tarde
                            const startHour2 = horariosDelDia.start2; // Inicio de la tarde
                            const endHour2 = horariosDelDia.end2; // Fin de la tarde

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
                            const ocupados = querySnapshot.docs.map(doc => doc.data().hora); // Obtener las horas ocupadas

                            const horariosFiltrados = availableSlots.filter(slot => !ocupados.includes(slot)); // Filtrar los ocupados
                            setHorariosDisponibles(horariosFiltrados); // Guardar los horarios disponibles en el estado
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
}, [profesional, fecha]); // Dependencias para volver a ejecutar la consulta






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
                        await addDoc(reservasRef, {
                            dni,
                            nombre,
                            apellido,
                            telefono,
                            servicio,
                            fecha,
                            hora,
                            uidPeluquero: profesional, // Registrar el UID del peluquero seleccionado
                            status: 'pendiente' // Agregar el estado pendiente al momento de crear la reserva
                        });

                        alert('Turno reservado exitosamente.');
                        navigate('/productos'); // Redirigir al usuario después de reservar
                    } catch (error) {
                        console.error('Error al guardar la reserva:', error);
                        alert('Error al reservar el turno. Inténtalo de nuevo.');
                    }
                    return; // Salir de la función después de guardar la reserva
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


const handleSolicitarCodigo = async () => {
    if (whatsapp) {
        const whatsappUrl = `https://wa.me/${whatsapp}?text=Hola,%20necesito%20un%20código%20de%20verificación%20para%20reservar%20mi%20turno.`;
        window.open(whatsappUrl, '_blank');
    } else {
        try {
            const peluqueroDocRef = doc(db, 'peluqueros', profesional); // Obtener datos del peluquero por ID
            const peluqueroDocSnap = await getDoc(peluqueroDocRef);

            if (peluqueroDocSnap.exists()) {
                const whatsappNumber = peluqueroDocSnap.data().whatsapp;
                setWhatsapp(whatsappNumber);
                window.open(`https://wa.me/${whatsappNumber}?text=Hola,%20necesito%20un%20código%20de%20verificación%20para%20reservar%20mi%20turno.`, '_blank');
            } else {
                alert('No se encontró el número de WhatsApp del peluquero. Verifica el ID del peluquero.');
            }
        } catch (error) {
            console.error('Error obteniendo el número de WhatsApp:', error);
        }
    }
};



const handleVerificarCodigo = async () => {
    // Verificar el código ingresado por el cliente
    try {
        const codigoDocRef = doc(db, 'codigos_verificacion', 'codigo_actual');
        const codigoDocSnap = await getDoc(codigoDocRef);

        if (codigoDocSnap.exists()) {
            const codigoData = codigoDocSnap.data();
            if (codigoData.codigoVerificacion === parseInt(codigoVerificacion)) {
                // Si el código es correcto, guardar el cliente como verificado
                await guardarClienteVerificado();
                alert('Código verificado. Reserva exitosa.');
                navigate('/productos');
            } else {
                alert('Código de verificación incorrecto.');
            }
        } else {
            alert('No se encontró el código de verificación.');
        }
    } catch (error) {
        console.error('Error verificando el código:', error);
    }
};

const guardarClienteVerificado = async () => {
    // Guardar al cliente como verificado en la base de datos
    try {
        await setDoc(doc(db, 'clientes', telefono), {
            dni: dni,
            telefono: telefono,
            nombre: nombre,
            apellido: apellido,
            verificado: true,
        });
        console.log('Cliente guardado como verificado en Firebase');
    } catch (error) {
        console.error('Error al guardar el cliente:', error);
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
            <div className='div-tel'>
                <input className='input-gral2' type="text" placeholder='Ingresa tu nombre' value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                <input className='input-gral2' type="text" placeholder='Ingresa tu apellido' value={apellido} onChange={(e) => setApellido(e.target.value)} required />
                <input className='input-gral2' type="text" placeholder='Ingresa tu número de teléfono' value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
            </div>
            <div className='seccion-2'>
                <div>
                    <label className='titulo-servicio'>Selecciona el servicio</label>
                    <select className='select-seccion' value={servicio} onChange={(e) => setServicio(e.target.value)}>
                        {servicios.map((servicio) => (
                            <option key={servicio.nombre} value={servicio.nombre}>{servicio.nombre}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className='titulo-servicio'>Selecciona tu profesional</label>
                    <select className='select-seccion' value={profesional} onChange={(e) => setProfesional(e.target.value)}>
                        {peluqueros.map((peluquero) => (
                            <option key={peluquero.id} value={peluquero.id}>{peluquero.nombre}</option>
                        ))}
                    </select>
                </div>
                <div className='div-date'>
                    <label className='titulo-servicio'>Elige tu fecha</label>
                    <input className='select-seccion2' type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
                </div>
                <div className='div-date'>
    <label className='titulo-servicio'>Elige tu hora</label>
    <select className='select-seccion2' value={hora} onChange={(e) => setHora(e.target.value)} required>
        <option value="" disabled>Seleccione un horario</option>
        {horariosDisponibles.length > 0 ? (
            horariosDisponibles.map((slot, index) => (
                <option key={index} value={slot}>{slot}</option>
            ))
        ) : (
            <option value="" disabled>No hay horarios disponibles</option>
        )}
    </select>
</div>
            </div>
            <div>
                <button className='button-agendar' type="submit">
                    <FontAwesomeIcon icon={faCalendarAlt} /> Agendar Turno
                </button>
            </div>
            {!verificado && mostrarSolicitarCodigo && (
                <div>
                    <input
                        type="text"
                        placeholder='Ingresa el código de verificación'
                        value={codigoVerificacion}
                        onChange={(e) => setCodigoVerificacion(e.target.value)}
                        required
                    />
                    <button type="button" onClick={handleVerificarCodigo} className="btn-verificar-codigo">
                        Verificar Código
                    </button>
                    <button type="button" onClick={handleSolicitarCodigo} className="btn-solicitar-codigo">
                        Solicitar Código
                    </button>
                </div>
            )}
        </form>
    );
};

export default ReservasForm;
