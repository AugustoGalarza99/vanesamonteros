import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import './EventActions.css';

const EventActions = ({ selectedEvent, setSelectedEvent, events, setEvents, fetchReservasAndTurnosExtras }) => {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    // Verificar que selectedEvent tenga la estructura adecuada
    if (selectedEvent) {
      const startDate = typeof selectedEvent.start === 'string' ? selectedEvent.start : selectedEvent.start.toISOString();
      setNewDate(startDate.split('T')[0]);
      setNewTime(startDate.split('T')[1].slice(0, 5));
    }
  }, [selectedEvent]);

  // Función para guardar cambios
  const handleSaveChanges = async () => {
    const updatedEvent = {
      ...selectedEvent,
      start: `${newDate}T${newTime}:00`, // Actualiza la fecha y hora
      end: `${newDate}T${String(parseInt(newTime.split(':')[0]) + 1).padStart(2, '0')}:${newTime.split(':')[1]}:00`, // Actualiza la hora de finalización
    };

    try {
      // Actualizar el evento en Firestore
      const eventRef = doc(db, 'reservas', selectedEvent.id); // Asegúrate de que `id` sea la clave del documento
      await updateDoc(eventRef, {
        fecha: newDate,
        hora: newTime,
        // Otros campos que quieras actualizar
      });

      // Actualizar el evento en el estado
      const updatedEvents = events.map(event => (event.id === selectedEvent.id ? updatedEvent : event));
      setEvents(updatedEvents);
      alert('Cambios guardados con éxito.');
      setSelectedEvent(null); // Limpiar la selección
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      alert('Hubo un error al guardar los cambios.');
    }
  };

  // Función para cancelar el turno
  const handleCancelEvent = async () => {
    try {
      // Eliminar el evento de Firestore
      const eventRef = doc(db, 'reservas', selectedEvent.id);
      await deleteDoc(eventRef);

      // Actualizar el estado
      setEvents(events.filter(event => event.id !== selectedEvent.id));
      alert('Turno cancelado.');
      setSelectedEvent(null); // Limpiar la selección
    } catch (error) {
      console.error('Error al cancelar el turno:', error);
      alert('Hubo un error al cancelar el turno.');
    }
  };

  return (
    <div className="event-actions">
      <h3 style={{ color: 'black' }}>Acciones para el Evento</h3>
      {selectedEvent ? (
        <>
          <div>
            <label>Modificar Fecha:</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <div>
            <label>Modificar Hora:</label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </div>
          <button onClick={handleSaveChanges}>Guardar Cambios</button>
          <button onClick={handleCancelEvent}>Cancelar Turno</button>
        </>
      ) : (
        <p>No hay evento seleccionado.</p>
      )}
    </div>
  );
};

export default EventActions;
