import React from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './EventActions.css';

const EventActions = ({ selectedEvent, setSelectedEvent, events, setEvents, refreshCalendar, getColorByStatus }) => {

  const handleRemindTurn = () => {
    const message = `Te recordamos que tienes tu turno el ${selectedEvent.start.toLocaleDateString()} a las ${selectedEvent.start.toLocaleTimeString()} en nuestra peluquería.`;
    const phoneNumber = selectedEvent.phoneNumber;

    if (phoneNumber) {
      const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappURL, '_blank');
    } else {
      alert('No se encontró el número de teléfono para este cliente.');
    }
  };

  const handleStartTurn = async () => {
    try {
      const eventRef = doc(db, 'reservas', selectedEvent.id);
      const startTime = Timestamp.now();
      await updateDoc(eventRef, { status: 'en proceso', startTime });

      // Actualiza el estado local sin eliminar el evento
      setEvents(prevEvents => prevEvents.map(event => 
          event.id === selectedEvent.id 
          ? { ...event, status: 'en proceso', startTime, color: getColorByStatus('en proceso') } 
          : event
      ));
      
      refreshCalendar(); // Refrescar el calendario después de la actualización
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error al actualizar el estado del turno:', error);
      alert('Hubo un error al comenzar el turno.');
    }
  };

  const handleFinishTurn = async () => {
    try {
      const eventRef = doc(db, 'reservas', selectedEvent.id);
      const endTime = Timestamp.now();
      await updateDoc(eventRef, { status: 'finalizado', endTime });

      // Actualiza el estado local sin eliminar el evento
      setEvents(prevEvents => prevEvents.map(event => 
          event.id === selectedEvent.id 
          ? { ...event, status: 'finalizado', endTime, color: getColorByStatus('finalizado') } 
          : event
      ));
      
      refreshCalendar(); // Refrescar el calendario después de la actualización
      alert('El turno ha sido finalizado.');
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error al finalizar el turno:', error);
      alert('Hubo un error al finalizar el turno.');
    }
  };

  return (
    <div className="event-actions">
      {selectedEvent ? (
        <div>
          <h3 style={{ color: 'black' }}>Información del Turno</h3>
          <p><strong>Nombre:</strong> {selectedEvent.title.split(' - ')[1]}</p>
          <p><strong>Horario:</strong> {selectedEvent.start.toLocaleDateString()} a las {selectedEvent.start.toLocaleTimeString()}</p>

          <div className="actions">
            <button onClick={handleRemindTurn}>Recordar Turno</button>
            <button onClick={handleStartTurn}>Comenzar Turno</button>
            <button onClick={handleFinishTurn}>Finalizar Turno</button>
          </div>
        </div>
      ) : (
        <p>No hay evento seleccionado.</p>
      )}
    </div>
  );
};

export default EventActions;
