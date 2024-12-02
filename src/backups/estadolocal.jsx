import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import Swal from 'sweetalert2';
import './EstadoPeluquero.css';

const EstadoPeluquero = () => {
    const [dni, setDni] = useState('');
    const [reservas, setReservas] = useState([]);
    const [turno, setTurno] = useState(null);
    const [mensajeDemora, setMensajeDemora] = useState('');

    useEffect(() => {
        // Cargar todas las reservas una vez y suscribirse a cambios
        const unsubscribe = onSnapshot(collection(db, 'reservas'), (snapshot) => {
            const fetchedReservas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReservas(fetchedReservas);
        });

        return () => unsubscribe(); // Cleanup al desmontar
    }, []);

    const formatTime = (date) => {
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    const handleBuscarTurno = () => {
        // Filtrar el turno del cliente por DNI
        const turnoCliente = reservas.find(
            reserva => reserva.dni === dni && reserva.status.toLowerCase() === 'pendiente'
        );

        if (turnoCliente) {
            setTurno(turnoCliente);

            const now = new Date();
            const [horaTurnoCliente, minutosTurnoCliente] = turnoCliente.hora.split(':').map(Number);
            const horaTurnoClienteFecha = new Date(`${turnoCliente.fecha} ${horaTurnoCliente}:${minutosTurnoCliente}`);

            let demoraTotal = 0;

            // Filtrar turnos previos
            const turnosPrevios = reservas
                .filter(reserva =>
                    reserva.uidPeluquero === turnoCliente.uidPeluquero &&
                    new Date(`${reserva.fecha} ${reserva.hora}`) < horaTurnoClienteFecha &&
                    reserva.id !== turnoCliente.id
                )
                .sort((a, b) => new Date(`${a.fecha} ${a.hora}`) - new Date(`${b.fecha} ${b.hora}`));

            turnosPrevios.forEach(turnoPrevio => {
                const duracionTurno = turnoPrevio.duracion || 30;

                if (turnoPrevio.status === 'Pendiente') {
                    demoraTotal += duracionTurno;
                } else if (turnoPrevio.status === 'en proceso' && turnoPrevio.startTime) {
                    const startTime = turnoPrevio.startTime.toDate();
                    const tiempoTranscurrido = Math.floor((now - startTime) / (1000 * 60));
                    const tiempoRestante = Math.max(duracionTurno - tiempoTranscurrido, 0);
                    demoraTotal += tiempoRestante;
                }
            });

            const horaEstimada = new Date(now.getTime() + demoraTotal * 60000);
            const horaEstimadaString = formatTime(horaEstimada);

            if (horaEstimada <= horaTurnoClienteFecha) {
                setMensajeDemora(`Su turno está a horario, será atendido a las ${formatTime(horaTurnoClienteFecha)}.`);
            } else {
                const minutosDemora = Math.floor((horaEstimada - now) / (1000 * 60));
                setMensajeDemora(`Su turno será aproximadamente en ${minutosDemora} minutos (a las ${horaEstimadaString}).`);
            }
        } else {
            setMensajeDemora('No tienes turnos pendientes.');
        }
    };

    const handleCancelarTurno = async () => {
        if (turno && turno.id) {
            const now = new Date();
            const [horaTurnoCliente, minutosTurnoCliente] = turno.hora.split(':').map(Number);
            const fechaTurno = new Date(`${turno.fecha} ${horaTurnoCliente}:${minutosTurnoCliente}`);
            const horasFaltantes = (fechaTurno - now) / (1000 * 60 * 60);

            Swal.fire({
                title: '¿Estás seguro?',
                text: '¿Estás seguro de que deseas cancelar la reserva?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, cancelar',
                cancelButtonText: 'No, mantener',
                background: 'black',
                color: 'white'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    if (horasFaltantes < 4) {
                        Swal.fire({
                            title: 'Error al cancelar el turno',
                            text: 'No puedes cancelar el turno porque faltan menos de 4 horas. Por favor, contacta a tu peluquero.',
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
                                text: 'Tu turno ha sido cancelado exitosamente, muchas gracias.',
                                icon: 'success',
                                background: 'black',
                                color: 'white',
                                confirmButtonText: 'Ok'
                            });
                            setTurno(null);
                            setMensajeDemora('');
                        } catch (error) {
                            console.error('Error al cancelar el turno:', error);
                            Swal.fire({
                                title: 'Error al cancelar el turno',
                                text: 'Ocurrió un error al intentar cancelar el turno. Por favor, intenta nuevamente.',
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
            <p>En esta seccion podras consultar la informacion sobre tu turno y el estado del peluquero. Si el peluquero esta con demora ingresando tu DNI te informaremos la hora aproximada de tu corte, tambien podras cancelar tu turno hasta un maximo de 4 horas antes del turno</p>
            <input
                className='input-estado'
                type="text"
                placeholder="Ingresa tu DNI"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                required
            />
            <button className='button-estado' onClick={handleBuscarTurno}>Buscar Turno</button>
            {mensajeDemora && <p className='demora'>{mensajeDemora}</p>}
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
