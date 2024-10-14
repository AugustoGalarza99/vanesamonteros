import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore'; // Importamos doc y deleteDoc
import './EstadoPeluquero.css';

const EstadoPeluquero = () => {
    const [dni, setDni] = useState('');
    const [turno, setTurno] = useState(null); // Guardar información del turno del cliente
    const [demora, setDemora] = useState(0); // Guardar la demora aproximada en minutos
    const [mensajeDemora, setMensajeDemora] = useState('');

    // Función para convertir horas y minutos en formato HH:MM
    const formatTime = (date) => {
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    // Función para obtener el turno del cliente y calcular la demora total
    const handleBuscarTurno = async () => {
        try {
            const reservasRef = collection(db, 'reservas');
            const querySnapshot = await getDocs(reservasRef);
            const reservas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Filtrar el turno del cliente por DNI
            const turnoCliente = reservas.find(reserva => reserva.dni === dni && reserva.status === 'pendiente');
            
            if (turnoCliente) {
                setTurno(turnoCliente);

                // Calcular la diferencia de tiempo entre la hora actual y la hora del turno
                const now = new Date();
                const [horaTurnoCliente, minutosTurnoCliente] = turnoCliente.hora.split(':').map(Number);
                const horaTurno = new Date(`${turnoCliente.fecha} ${horaTurnoCliente}:${minutosTurnoCliente}`);
                
                const diferenciaMinutos = (horaTurno - now) / (1000 * 60); // Diferencia en minutos

                // Mostrar estimación solo si faltan 120 minutos (2 horas) o menos
                if (diferenciaMinutos <= 120) {
                    // Filtrar todas las reservas del mismo peluquero que sean anteriores a la del cliente
                    const turnosPrevios = reservas
                        .filter(reserva =>
                            reserva.uidPeluquero === turnoCliente.uidPeluquero &&
                            new Date(`${reserva.fecha} ${reserva.hora}`) < now && // Solo turnos antes de la hora actual
                            reserva.id !== turnoCliente.id // Excluir el turno del cliente actual
                        )
                        .sort((a, b) => new Date(`${a.fecha} ${a.hora}`) - new Date(`${b.fecha} ${b.hora}`)); // Ordenar por fecha y hora

                    // Calcular la demora
                    let demoraTotal = 0;

                    turnosPrevios.forEach(turnoPrevio => {
                        if (turnoPrevio.status === 'pendiente') {
                            // Sumar 30 minutos por cada turno pendiente
                            demoraTotal += 30;
                        } else if (turnoPrevio.status === 'en proceso' && turnoPrevio.startTime) {
                            // Calcular el tiempo transcurrido desde que comenzó el turno en proceso
                            const startTime = turnoPrevio.startTime.toDate(); // Suponiendo que 'startTime' es un campo de tipo Timestamp
                            const tiempoTranscurrido = Math.floor((now - startTime) / (1000 * 60)); // Tiempo en minutos
                            
                            // Tiempo restante del turno en proceso (si ya pasó más de 30 minutos, lo dejamos en 0)
                            const tiempoRestante = Math.max(30 - tiempoTranscurrido, 0);
                            demoraTotal += tiempoRestante;
                        }
                        // Ignoramos las reservas que están en "finalizado"
                    });

                    // Actualizar la demora total
                    setDemora(demoraTotal);

                    // Calcular la hora estimada basada en la hora actual
                    const horaEstimada = new Date(now.getTime() + demoraTotal * 60000);
                    setMensajeDemora(`Su turno será aproximadamente en ${demoraTotal} minutos (a las ${formatTime(horaEstimada)}).`);
                } else {
                    // Si faltan más de 2 horas
                    setMensajeDemora('Tu turno aún está a más de 2 horas.');
                }
            } else {
                setMensajeDemora('No tienes turnos pendientes.');
            }
        } catch (error) {
            console.error('Error buscando el turno:', error);
            setMensajeDemora('Hubo un error al buscar las reservas.');
        }
    };

    // Función para cancelar el turno
    const handleCancelarTurno = async () => {
        if (turno && turno.id) {
            try {
                const turnoRef = doc(db, 'reservas', turno.id); // Referencia al documento del turno
                await deleteDoc(turnoRef); // Eliminar el documento del turno
                alert('Tu turno ha sido cancelado.');
                setTurno(null);
                setMensajeDemora('');
            } catch (error) {
                console.error('Error al cancelar el turno:', error);
                alert('Hubo un problema al cancelar el turno.');
            }
        }
    };

    return (
        <div className="estado-peluquero">
            <h2>Consulta el estado de tu turno</h2>
            <input
                className='input-estado'
                type="text"
                placeholder="Ingresa tu DNI"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                required
            />
            <button className='button-estado' onClick={handleBuscarTurno}>Buscar Turno</button>

            {mensajeDemora && <p>{mensajeDemora}</p>}

            {turno && (
                <div>
                    <h3>Información del turno:</h3>
                    <p><strong>Nombre:</strong> {turno.nombre} {turno.apellido}</p>
                    <p><strong>Servicio:</strong> {turno.servicio}</p>
                    <p><strong>Peluquero:</strong> {turno.uidPeluquero}</p>
                    <p><strong>Fecha:</strong> {turno.fecha}</p>
                    <p><strong>Hora:</strong> {turno.hora}</p>

                    <button onClick={handleCancelarTurno}>Cancelar Turno</button>
                </div>
            )}
        </div>
    );
};

export default EstadoPeluquero;
