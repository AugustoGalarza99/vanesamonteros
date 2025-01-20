import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { FiSearch } from "react-icons/fi";
import './EstadoPeluquero.css';

const EstadoPeluquero = () => {
    const [dni, setDni] = useState('');
    const [turno, setTurno] = useState(null);
    const [mensaje, setMensaje] = useState('');

    // Función para buscar el turno por DNI
    const handleBuscarTurno = async () => {
        try {
            // Realizar una consulta a Firebase filtrando por DNI y status
            const reservasRef = collection(db, 'reservas');
            const q = query(reservasRef, where('dni', '==', dni), where('status', '==', 'Sin realizar'));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Si hay un turno pendiente, tomar el primero
                const turnoCliente = querySnapshot.docs[0].data();
                turnoCliente.id = querySnapshot.docs[0].id; // Añadir el ID del documento
                setTurno(turnoCliente);
                setMensaje('');
            } else {
                // Si no hay turnos pendientes
                setTurno(null);
                setMensaje('No tienes turnos pendientes.');
            }
        } catch (error) {
            console.error('Error al buscar el turno:', error);
            setMensaje('Hubo un error al buscar el turno. Inténtalo nuevamente.');
        }
    };

    // Función para cancelar el turno
    const handleCancelarTurno = async () => {
        if (turno && turno.id) {
            const now = new Date();
            const [horaTurno, minutosTurno] = turno.hora.split(':').map(Number);
            const fechaTurno = new Date(`${turno.fecha} ${horaTurno}:${minutosTurno}`);
            const horasRestantes = (fechaTurno - now) / (1000 * 60 * 60); // Diferencia en horas

            // Mostrar alerta de confirmación
            Swal.fire({
                title: '¿Estás seguro?',
                text: '¿Deseas cancelar este turno?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, cancelar',
                cancelButtonText: 'No, mantener',
                background: 'black',
                color: 'white'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    if (horasRestantes < 4) {
                        // Mostrar mensaje si no es posible cancelar el turno
                        Swal.fire({
                            title: 'No se puede cancelar',
                            text: 'No puedes cancelar el turno porque faltan menos de 4 horas.',
                            icon: 'error',
                            background: 'black',
                            color: 'white',
                            confirmButtonText: 'Ok'
                        });
                    } else {
                        // Eliminar el turno de Firebase
                        try {
                            const turnoRef = doc(db, 'reservas', turno.id);
                            await deleteDoc(turnoRef);
                            Swal.fire({
                                title: 'Turno cancelado',
                                text: 'Tu turno ha sido cancelado exitosamente.',
                                icon: 'success',
                                background: 'black',
                                color: 'white',
                                confirmButtonText: 'Ok'
                            });
                            setTurno(null);
                            setMensaje('');
                        } catch (error) {
                            console.error('Error al cancelar el turno:', error);
                            Swal.fire({
                                title: 'Error al cancelar',
                                text: 'Hubo un error al intentar cancelar el turno. Inténtalo nuevamente.',
                                icon: 'error',
                                background: 'black',
                                color: 'white',
                                confirmButtonText: 'Ok'
                            });
                        }
                    }
                }
            });
        }
    };

    return (
        <div className="estado-peluquero">
            <h2>Consulta el estado de tu turno</h2>
            <p className='p-estado'>
                Ingresa tu DNI para consultar el estado de tu turno. Si lo deseas, también puedes cancelarlo 
                hasta 4 horas antes de la hora del turno.
            </p>
            <input
                className='input-estado'
                type="text"
                placeholder="Ingresa tu DNI"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                required
            />
            <button className='button-estado' onClick={handleBuscarTurno}>
                <FiSearch size={16} /> Buscar Turno
            </button>

            {mensaje && <p className='mensaje'>{mensaje}</p>}

            {turno && (
                <div className='info-turno'>
                    <h3>Información del turno:</h3>
                    <p><strong>Nombre:</strong> {turno.nombre} {turno.apellido}</p>
                    <p><strong>Servicio:</strong> {turno.servicio}</p>
                    <p><strong>Fecha:</strong> {turno.fecha}</p>
                    <p><strong>Hora:</strong> {turno.hora}</p>
                    <button className='button-estado2' onClick={handleCancelarTurno}>Cancelar Turno</button>
                </div>
            )}
        </div>
    );
};

export default EstadoPeluquero;
