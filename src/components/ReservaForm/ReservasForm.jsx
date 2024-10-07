// Importar las funciones necesarias de Firebase
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
    const [profesional, setProfesional] = useState(''); // Deberías asignar el valor inicial correcto
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [verificado, setVerificado] = useState(false);
    const [mostrarSolicitarCodigo, setMostrarSolicitarCodigo] = useState(false);
    const [whatsapp, setWhatsapp] = useState('');
    const [servicios, setServicios] = useState([]); // Estado para almacenar servicios

    const navigate = useNavigate();

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

                setServicios(serviciosList); // Guarda los servicios en el estado
                if (serviciosList.length > 0) {
                    setServicio(serviciosList[0].nombre); // Selecciona el primer servicio por defecto
                }
            } catch (error) {
                console.error('Error obteniendo servicios:', error);
            }
        };

        fetchServicios(); // Llama a la función para obtener los servicios
    }, []); // El array vacío asegura que solo se ejecute una vez al montar el componente

    const handleAgendar = async (e) => {
        e.preventDefault(); // Previene el comportamiento predeterminado del formulario
        try {
            const clientesRef = collection(db, 'clientes'); // Referencia a la colección de clientes
            const q = query(clientesRef, where('dni', '==', dni)); // Consulta para buscar por DNI
            const querySnapshot = await getDocs(q); // Obtiene los documentos que coinciden con la consulta
    
            if (!querySnapshot.empty) {
                querySnapshot.forEach(async (doc) => {
                    const userData = doc.data(); // Obtiene los datos del usuario
                    if (userData.telefono === telefono && userData.verificado) {
                        // Si el número de teléfono es correcto y el usuario está verificado
                        setVerificado(true);
    
                        // Guarda la reserva en Firestore
                        const reservasRef = collection(db, 'reservas'); // Referencia a la colección de reservas
                        await addDoc(reservasRef, {
                            nombre,
                            apellido,
                            telefono,
                            servicio,
                            fecha,
                            hora,
                            uidPeluquero: profesional // Asegúrate de que esto contenga el uid correcto
                        });
    
                        alert('Turno reservado exitosamente.'); // Mensaje de éxito
                        navigate('/productos'); // Redirige al usuario
                    } else {
                        alert('Número de teléfono incorrecto o usuario no verificado.'); // Mensaje de error
                        setVerificado(false);
                        setMostrarSolicitarCodigo(true); // Muestra la opción de solicitar código
                    }
                });
            } else {
                alert('Usuario no encontrado, por favor solicita un código.'); // Mensaje de error si no se encuentra el usuario
                setVerificado(false);
                setMostrarSolicitarCodigo(true); // Muestra la opción de solicitar código
            }
        } catch (error) {
            console.error('Error verificando usuario:', error); // Manejo de errores
        }
    };

    const handleSolicitarCodigo = async () => {
        if (whatsapp) {
            const whatsappUrl = `https://wa.me/${whatsapp}?text=Hola,%20necesito%20un%20código%20de%20verificación%20para%20reservar%20mi%20turno.`;
            window.open(whatsappUrl, '_blank');
        } else {
            try {
                const peluqueroDocRef = doc(db, 'peluqueros', profesional); // 'profesional' debe ser el ID del peluquero
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
                        {/* Asegúrate de tener la lista de peluqueros aquí como antes */}
                        <option value="QIXu19fLpYW2IqLlrFE62fAJfPb2">Jorge</option>
                        <option value="dNa3yYUXAwX5AWualdzbtNa9TmA2">Augusto</option>
                        {/* Puedes cargar dinámicamente la lista de peluqueros desde la base de datos si lo deseas */}
                    </select>
                </div>
                <div className='div-date'>
                    <label className='titulo-servicio'>Elige tu fecha</label>
                    <input className='select-seccion2' type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
                </div>
                <div className='div-date'>
                    <label className='titulo-servicio'>Elige tu hora</label>
                    <input className='select-seccion2' type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
                </div>
            </div>
            <div>
                <button className='button-agendar' type="submit">
                    <FontAwesomeIcon icon={faCalendarAlt} /> Agendar Turno
                </button>
            </div>
            {!verificado && mostrarSolicitarCodigo && (
                <div>
                    <button type="button" onClick={handleSolicitarCodigo} className="btn-solicitar-codigo">
                        Solicitar Código
                    </button>
                </div>
            )}
        </form>
    );
};

export default ReservasForm;
