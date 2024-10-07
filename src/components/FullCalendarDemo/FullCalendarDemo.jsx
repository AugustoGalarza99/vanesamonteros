import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { db } from '../../firebaseConfig'; // Asegúrate de que la ruta sea correcta
import { collection, getDocs } from 'firebase/firestore';
import './FullCalendarDemo.css';

const FullCalendarDemo = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const reservasRef = collection(db, 'reservas');
        const querySnapshot = await getDocs(reservasRef);
        const fetchedEvents = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id, // Guarda el ID del documento para futuras referencias
            title: `${data.nombre} ${data.apellido} - ${data.servicio}`, // Título con el nombre, apellido y servicio
            start: `${data.fecha}T${data.hora}:00`, // Asegúrate de que la fecha y hora están bien formateadas
            end: `${data.fecha}T${data.hora}:00`, // Puedes ajustar esto si es necesario
            color: '#f28b82' // Color para las reservas
          };
        });
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error al cargar las reservas:', error);
      }
    };

    fetchReservations();
  }, []);

  const handleDateClick = (info) => {
    alert('Turno reservado en: ' + info.dateStr);
  };

  return (
    <div className="fullcalendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={events}
        dateClick={handleDateClick}
        editable={true}
        droppable={true}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        locale="es"
        slotDuration="01:00:00"
      />
    </div>
  );
};

export default FullCalendarDemo;

