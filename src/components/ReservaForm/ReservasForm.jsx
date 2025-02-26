import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, where, addDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { RxCalendar } from "react-icons/rx";
import Swal from 'sweetalert2';
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
    const [costoServicio, setCostoServicio] = useState(0); // Para almacenar el costo del servicio
    const [whatsapp, setWhatsapp] = useState('');
    const [servicios, setServicios] = useState([]);
    const [peluqueros, setPeluqueros] = useState([]);
    const [horariosDisponibles, setHorariosDisponibles] = useState([]);
    const [duracionServicio, setDuracionServicio] = useState(0); // Para almacenar la duración del servicio
    const [codigoVerificacion, setCodigoVerificacion] = useState(''); // Estado para almacenar el código de verificación
    const [loading, setLoading] = useState(false);
    const profesionalSeleccionado = peluqueros.find(p => p.id === profesional)?.nombre || '';
    const intervaloTurnos = horariosDisponibles.intervalo || 15;
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
    
                // Filtrar el peluquero que deseas excluir (por ejemplo, con un id específico)
                const peluqueroAExcluir = 'sZqQh0TghhSJ0CXRHY81McaemGa2'; // Aquí reemplaza con el id del peluquero que deseas excluir
                const peluquerosFiltrados = peluquerosList.filter(peluquero => peluquero.id !== peluqueroAExcluir);
    
                setPeluqueros(peluquerosFiltrados);
                if (peluquerosFiltrados.length > 0) {
                    setProfesional(peluquerosFiltrados[0].id); // Seleccionar el primer peluquero por defecto
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
        
        
    
        fetchHorariosDisponibles();
    }, [profesional, fecha, duracionServicio]);
    
    

    const handleAgendar = async (e) => {
        e.preventDefault(); // Evitar el comportamiento predeterminado del formulario
        if (loading) return;
        setLoading(true);
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
                                costoServicio, // Incluye el costo del servicio
                                duracion: duracionServicio, // Guarda la duración
                                horaFin: endTime.toISOString(), // Guarda la hora de fin
                                uidPeluquero: profesional, // Registrar el UID del peluquero seleccionado
                                status: 'Sin realizar' // Establecer el estado de la reserva
                            });

                            Swal.fire({
                                title: 'Reserva registrada',
                                html: 'Tu reserva ha sido creada exitosamente, muchas gracias. <br><br> <strong>IMPORTANTE:</strong> El turno puede verse modificado en +/- 15 minutos, en caso de serlo seras notificado. <br><br>Gracias por su comprensión',
                                icon: 'success',
                                background: 'black', 
                                color: 'white', 
                                confirmButtonText: 'Ok'
                            });
                            navigate('/estado'); // Redirigir al inicio o a otra página después de crear la reserva
                        } catch (error) {
                            console.error('Error al crear la reserva:', error);
                        } 

                    } else {
                        Swal.fire({
                            title: 'Aun no eres cliente',
                            text: 'Solicita el código de verificación a tu profesional para agendar tu turno y cuando lo tengas pégalo debajo por única vez. Si ya te verificaste revisa que tus datos sean correctos. Este paso es por única vez.',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Solicitar Código',
                            cancelButtonText: 'Tengo el codigo',
                            background: 'black', // Fondo rojo claro
                            color: 'white', // Texto rojo oscuro
                            customClass: {
                                icon: 'custom-warning-icon', // Clase personalizada para el ícono de advertencia
                            }
                        }).then((result) => {
                            // Aquí es donde se maneja el evento "click" del botón de confirmación
                            if (result.isConfirmed) {
                                // Llamar a la función para solicitar el código
                                handleSolicitarCodigo();
                            } else if (result.isDismissed) {
                                /*console.log('El usuario canceló la solicitud de código');*/
                            }
                        });
                        setVerificado(false);
                        setMostrarSolicitarCodigo(true);
                    }
                }
            } else {
                Swal.fire({
                    title: 'Aun no eres cliente',
                    text: 'Solicita el código de verificación a tu profesional para agendar tu turno y cuando lo tengas pégalo debajo por única vez. Si ya te verificaste revisa que tus datos sean correctos. Este paso es por única vez.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Solicitar Código',
                    cancelButtonText: 'Tengo el codigo',
                    background: 'black', // Fondo rojo claro
                    color: 'white', // Texto rojo oscuro
                    customClass: {
                        icon: 'custom-warning-icon', // Clase personalizada para el ícono de advertencia
                    }
                }).then((result) => {
                    // Aquí es donde se maneja el evento "click" del botón de confirmación
                    if (result.isConfirmed) {
                        // Llamar a la función para solicitar el código
                        handleSolicitarCodigo();
                    } else if (result.isDismissed) {
                        /*console.log('El usuario canceló la solicitud de código');*/
                    }
                });
                setVerificado(false);
                setMostrarSolicitarCodigo(true);
            }
        } catch (error) {
            console.error('Error verificando usuario:', error);
        } finally{
            setLoading(false);
        }
    };
    
   {/* const handleSolicitarCodigo = async () => {
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
                    window.open(`https://wa.me/${whatsappNumber}?text=Hola,%20necesito%20un%20código%20de%20verificación%20para%20reservar%20mi%20turno.`, `_blank`);
                } else {
                    Swal.fire({
                        title: 'Error de peluquero',
                        text: 'No se encontro el numero de telefono del peluquero, intenta nuevamente.',
                        icon: 'error',
                        background: 'black', 
                        color: 'white', 
                        confirmButtonText: 'Ok'
                    });
                }
            } catch (error) {
                console.error('Error obteniendo el número de WhatsApp:', error);
            }
        }
    };
    */}


    const handleSolicitarCodigo = async () => {
        if (whatsapp) {
            const profesionalNombre = peluqueros.find(p => p.id === profesional)?.nombre || '';
            const profesionalNombreSinParentesis = profesionalNombre.replace(/\s*\(.*?\)\s*/g, '').trim();
            const cleanWhatsappNumber = whatsapp.replace(/\+/g, '').trim();
            const whatsappUrl = `https://wa.me/${cleanWhatsappNumber}?text=Hola,%20necesito%20el%20código%20de%20verificación%20para%20reservar%20mi%20turno%20con%20${encodeURIComponent(profesionalNombreSinParentesis)}.`;
            window.location.href = whatsappUrl; // Redirige al número de WhatsApp
        } else {
            try {
                const peluqueroDocRef = doc(db, 'peluqueros', profesional);
                const peluqueroDocSnap = await getDoc(peluqueroDocRef);
        
                if (peluqueroDocSnap.exists()) {
                    const whatsappNumber = peluqueroDocSnap.data().whatsapp;
                    setWhatsapp(whatsappNumber);
                    const profesionalNombre = peluqueros.find(p => p.id === profesional)?.nombre || '';
                    const profesionalNombreSinParentesis = profesionalNombre.replace(/\s*\(.*?\)\s*/g, '').trim();
                    const cleanWhatsappNumber = whatsappNumber.replace(/\+/g, '').trim();
                    const whatsappUrl = `https://wa.me/${cleanWhatsappNumber}?text=Hola,%20necesito%20el%20código%20de%20verificación%20para%20reservar%20mi%20turno%20con%20${encodeURIComponent(profesionalNombreSinParentesis)}.`;

                    window.location.href = whatsappUrl; // Redirige al número de WhatsApp
                } else {
                    Swal.fire({
                        title: 'Error de profesional',
                        text: 'No se encontró el número de teléfono del profesional, intenta nuevamente.',
                        icon: 'error',
                        background: 'black',
                        color: 'white',
                        confirmButtonText: 'Ok'
                    });
                }
            } catch (error) {
                console.error('Error obteniendo el número de WhatsApp:', error);
            }
        }
    };
    
    

    const handleVerificarCodigo = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const codigoDocRef = doc(db, 'codigos_verificacion', profesional);
            const codigoDocSnap = await getDoc(codigoDocRef);
    
            if (codigoDocSnap.exists()) {
                const codigoData = codigoDocSnap.data();
                if (codigoData.codigoVerificacion === parseInt(codigoVerificacion)) {
                    // Si el código es correcto, guardar el cliente como verificado
                    await guardarClienteVerificado();
    
                    // Ahora que el cliente está verificado, crear la reserva
                    await guardarReserva();
                    
                    Swal.fire({
                        title: 'Código verificado y reserva creada',
                        html: 'Tu reserva ha sido creada exitosamente, muchas gracias. <br><br> <strong>IMPORTANTE:</strong> El turno puede verse modificado en +/- 15 minutos, en caso de serlo seras notificado. <br><br>Gracias por su comprensión',
                        icon: 'success',
                        background: 'black', // Fondo rojo claro
                        color: 'white', // Texto rojo oscuro
                        confirmButtonText: 'Ok'
                    });
    
                    // Redirigir al usuario después de la reserva
                    navigate('/estado');
                } else {
                    Swal.fire({
                        title: 'Código incorrecto',
                        text: 'El código de verificación ingresado es incorrecto. Por favor, intenta nuevamente.',
                        icon: 'error',
                        background: 'black', 
                        color: 'white', 
                        confirmButtonText: 'Ok'
                    });
                }
            } else {
                Swal.fire({
                    title: 'Código incorrecto',
                    text: 'El código de verificación ingresado es incorrecto. Por favor, intenta nuevamente.',
                    icon: 'error',
                    background: 'black', 
                    color: 'white', 
                    confirmButtonText: 'Ok'
                });
            }
        } catch (error) {
            console.error('Error verificando el código:', error);
            Swal.fire({
                title: 'Error',
                text: 'Ocurrió un error al verificar el código. Intenta nuevamente más tarde.',
                icon: 'error',
                background: 'black', 
                color: 'white', 
                confirmButtonText: 'Ok'
            });
        } finally{
            setLoading(false);
        }
    };

    const guardarReserva = async () => {
        try {
            const reservasRef = collection(db, 'reservas'); // Referencia a la colección de reservas
    
            // Calcula el tiempo de fin de la reserva
            const startTime = new Date(`${fecha}T${hora}`);
            const endTime = new Date(startTime.getTime() + duracionServicio * 60000); // Añade la duración
    
            // Guardar la reserva en Firestore
            await addDoc(reservasRef, {
                dni,
                nombre,
                apellido,
                telefono,
                servicio,
                fecha,
                hora,
                costoServicio, // Incluye el costo del servicio
                duracion: duracionServicio, // Guarda la duración
                horaFin: endTime.toISOString(), // Guarda la hora de fin
                uidPeluquero: profesional, // Registrar el UID del peluquero seleccionado
                status: 'Sin realizar' // Establecer el estado de la reserva
            });
    
            /*console.log('Reserva creada con éxito');*/
        } catch (error) {
            console.error('Error al crear la reserva:', error);
            Swal.fire({
                title: 'Error al crear la reserva',
                text: 'Ocurrió un error al intentar crear la reserva. Por favor, intenta nuevamente más tarde.',
                icon: 'error',
                background: 'black', 
                color: 'white', 
                confirmButtonText: 'Ok'
            });
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
            /*console.log('Cliente guardado como verificado en Firebase');*/
        } catch (error) {
            console.error('Error al guardar el cliente:', error);
        }
    };

    return (            
            <form className='form-reserva' onSubmit={handleAgendar}>
            <div className='titulo'>
                <RxCalendar />
                <h1 className='titulo'>Agenda tu cita</h1>                
            </div>
            <h3 className='h3'>Completa el siguiente formulario para reservar tu cita</h3>
                <div className='seccion'>
                <input className='input-gral' type="text" placeholder='Ingresa tu DNI' value={dni}   onChange={(e) => {const value = e.target.value;if (/^\d*$/.test(value)) {setDni(value);}}} required />
                </div>
                <div className='div-tel'>
                <input className='input-gral2' type="text" placeholder='Ingresa tu nombre' value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                <input className='input-gral2' type="text" placeholder='Ingresa tu apellido' value={apellido} onChange={(e) => setApellido(e.target.value)} required />
                <input className='input-gral2' type="text" placeholder='Ingresa tu número de teléfono' value={telefono} onChange={(e) => {const value = e.target.value; if (/^\d*$/.test(value)) {setTelefono(value);}}} required />
            </div>
            <div className='div-date'>
                <label className='titulo-servicio'>Selecciona tu profesional</label>
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
                <div className='div-serv'>
                    <label className='titulo-servicio'>Selecciona el servicio</label>
                    <select className='select-seccion' value={servicio} onChange={(e) => {
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
                <label className='titulo-servicio'>Elige tu fecha</label>
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
                <label className='titulo-servicio'>Elige tu hora</label>
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
            <div>
                <button className='button-agendar' type="submit">
                    <RxCalendar /> {loading ? 'Agendando...' : 'Agendar Turno' }
                </button>
            </div>
            {!verificado && mostrarSolicitarCodigo && (
                <div>
                    <input
                        type="text"
                        placeholder='Ingresa el código de verificación'
                        className='input-gral2'
                        value={codigoVerificacion}
                        onChange={(e) => setCodigoVerificacion(e.target.value)}
                        required
                    />
                    <button type="button" onClick={handleVerificarCodigo} className="button-agendar">
                        Verificar Código
                    </button>
                    {/*<button type="button" onClick={handleSolicitarCodigo} className="btn-solicitar-codigo">
                        Solicitar Código
                    </button>*/}
                </div>
            )}
            </form>
        
    );
};

export default ReservasForm;
