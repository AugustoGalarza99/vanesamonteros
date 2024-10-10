import React from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './EventActions.css';

const EventActions = ({ selectedEvent, setSelectedEvent, events, setEvents }) => {

  // Función para recordar turno enviando mensaje por WhatsApp
  const handleRemindTurn = () => {
    const message = `Te recordamos que tienes tu turno el ${selectedEvent.start.toLocaleDateString()} a las ${selectedEvent.start.toLocaleTimeString()} en nuestra peluquería.`;
    const phoneNumber = selectedEvent.phoneNumber;
  
    console.log("Número de teléfono para el recordatorio:", phoneNumber); // Verifica si el número está presente
  
    if (phoneNumber) {
      const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappURL, '_blank');
    } else {
      alert('No se encontró el número de teléfono para este cliente.');
    }
  };

// Función para cambiar el estado del turno a "en proceso"
const handleStartTurn = async () => {
  try {
      const eventRef = doc(db, 'reservas', selectedEvent.id);
      const startTime = Timestamp.now(); // Guardar la hora de inicio
      await updateDoc(eventRef, { status: 'en proceso', startTime });

      // Actualiza el estado local
      const updatedEvents = events.map(event => 
          event.id === selectedEvent.id ? { ...event, status: 'en proceso', startTime } : event
      );
      setEvents(updatedEvents);
      alert('El turno ha comenzado.');
      setSelectedEvent(null);
  } catch (error) {
      console.error('Error al actualizar el estado del turno:', error);
      alert('Hubo un error al comenzar el turno.');
  }
};

// Función para cambiar el estado del turno a "finalizado"
const handleFinishTurn = async () => {
  try {
      const eventRef = doc(db, 'reservas', selectedEvent.id);
      const endTime = Timestamp.now(); // Guardar la hora de finalización
      await updateDoc(eventRef, { status: 'finalizado', endTime });

      // Actualiza el estado local
      const updatedEvents = events.map(event => 
          event.id === selectedEvent.id ? { ...event, status: 'finalizado', endTime } : event
      );
      setEvents(updatedEvents);
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
