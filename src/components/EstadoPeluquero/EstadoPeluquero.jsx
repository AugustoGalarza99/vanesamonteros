import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import './EstadoPeluquero.css';

const EstadoPeluquero = () => {
    const [dni, setDni] = useState('');
    const [turno, setTurno] = useState(null);
    const [demora, setDemora] = useState(0);
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
            const turnoCliente = reservas.find(reserva => reserva.dni === dni && reserva.status.toLowerCase() === 'pendiente');
            
            if (turnoCliente) {
                setTurno(turnoCliente);

                const now = new Date();
                const [horaTurnoCliente, minutosTurnoCliente] = turnoCliente.hora.split(':').map(Number);
                const horaTurnoClienteFecha = new Date(`${turnoCliente.fecha} ${horaTurnoCliente}:${minutosTurnoCliente}`);

                let demoraTotal = 0;

                // Filtrar todos los turnos anteriores al del cliente del mismo peluquero
                const turnosPrevios = reservas
                    .filter(reserva =>
                        reserva.uidPeluquero === turnoCliente.uidPeluquero &&
                        new Date(`${reserva.fecha} ${reserva.hora}`) < horaTurnoClienteFecha && // Solo turnos antes del turno del cliente
                        reserva.id !== turnoCliente.id // Excluir el turno del cliente actual
                    )
                    .sort((a, b) => new Date(`${a.fecha} ${a.hora}`) - new Date(`${b.fecha} ${b.hora}`)); // Ordenar por fecha y hora

                // Calcular la demora sumando la duración de los turnos anteriores
                turnosPrevios.forEach(turnoPrevio => {
                    const duracionTurno = turnoPrevio.duracion || 30; // Usar 30 minutos como predeterminado si no se especifica duración

                    if (turnoPrevio.status === 'pendiente') {
                        // Sumar la duración del turno pendiente
                        demoraTotal += duracionTurno;
                    } else if (turnoPrevio.status === 'en proceso' && turnoPrevio.startTime) {
                        // Calcular el tiempo transcurrido desde que comenzó el turno en proceso
                        const startTime = turnoPrevio.startTime.toDate(); // Suponiendo que 'startTime' es un campo de tipo Timestamp
                        const tiempoTranscurrido = Math.floor((now - startTime) / (1000 * 60)); // Tiempo en minutos

                        // Calcular cuánto tiempo falta del turno en proceso
                        const tiempoRestante = Math.max(duracionTurno - tiempoTranscurrido, 0);
                        demoraTotal += tiempoRestante;
                    }
                });

                // Calcular la hora estimada basada en la demora total
                const horaEstimada = new Date(now.getTime() + demoraTotal * 60000);
                setMensajeDemora(`Su turno será aproximadamente en ${demoraTotal} minutos (a las ${formatTime(horaEstimada)}).`);
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
            <p>En esta seccion podras consultar la informacion sobre tu turno y el estado del peluquero. Si el peluquero esta con demora ingresando tu DNI te informaremos la hora aproximada de tu corte, tambien podras cancelar tu turno </p>
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
