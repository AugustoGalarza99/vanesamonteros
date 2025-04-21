import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { FiSearch } from "react-icons/fi";
import './EstadoPeluquero.css';

const EstadoPeluquero = () => {
    const [dni, setDni] = useState('');
    const [turnos, setTurnos] = useState([]);
    const [mensaje, setMensaje] = useState('');

    const handleBuscarTurno = async () => {
        try {
            const reservasRef = collection(db, 'reservas');
            const q = query(reservasRef, where('dni', '==', dni), where('status', '==', 'Sin realizar'));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const turnosCliente = querySnapshot.docs.map(docSnapshot => {
                    const data = docSnapshot.data();
                    return { ...data, id: docSnapshot.id };
                });
                setTurnos(turnosCliente);
                setMensaje('');
            } else {
                setTurnos([]);
                setMensaje('No tienes turnos pendientes.');
            }
        } catch (error) {
            console.error('Error al buscar turnos:', error);
            setMensaje('Hubo un error al buscar los turnos. Inténtalo nuevamente.');
        }
    };

    const handleCancelarTurno = async (turno) => {
        const now = new Date();
        const [horaTurno, minutosTurno] = turno.hora.split(':').map(Number);
        const fechaTurno = new Date(`${turno.fecha} ${horaTurno}:${minutosTurno}`);
        const horasRestantes = (fechaTurno - now) / (1000 * 60 * 60);

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
                    Swal.fire({
                        title: 'No se puede cancelar',
                        text: 'No puedes cancelar el turno porque faltan menos de 4 horas.',
                        icon: 'error',
                        background: 'black',
                        color: 'white',
                        confirmButtonText: 'Ok'
                    });
                } else {
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
                        // Filtrar el turno cancelado de la lista
                        setTurnos(turnos.filter(t => t.id !== turno.id));
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
    };

    return (
        <div className="estado-peluquero">
            <h2>Consulta el estado de tu turno</h2>
            <p className='p-estado'>
                Ingresa tu DNI para consultar el estado de tus turnos. Puedes cancelar cualquiera hasta 4 horas antes de su hora programada.
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

            {turnos.length > 0 && (
                <div className='lista-turnos'>
                    <h3>Turnos pendientes:</h3>
                    {turnos.map((turno) => (
                        <div key={turno.id} className='info-turno'>
                            <p><strong>Nombre:</strong> {turno.nombre} {turno.apellido}</p>
                            <p><strong>Servicio:</strong> {turno.servicio}</p>
                            <p><strong>Fecha:</strong> {turno.fecha}</p>
                            <p><strong>Hora:</strong> {turno.hora}</p>
                            <button className='button-estado2' onClick={() => handleCancelarTurno(turno)}>
                                Cancelar Turno
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EstadoPeluquero;
