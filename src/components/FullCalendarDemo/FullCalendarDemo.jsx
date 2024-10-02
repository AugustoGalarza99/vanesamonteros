// FullCalendarDemo.jsx

import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react'; // Importa el componente FullCalendar
import dayGridPlugin from '@fullcalendar/daygrid'; // Vista de día
import timeGridPlugin from '@fullcalendar/timegrid'; // Vista de semana y día
import interactionPlugin from '@fullcalendar/interaction'; // Permite interactuar con los eventos (arrastrar, hacer clic)
import './FullCalendarDemo.css'

const FullCalendarDemo = () => {
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'Cita con Juan Pérez',
      start: '2024-09-26T10:00:00',
      end: '2024-09-26T11:00:00',
      color: '#f28b82' // rojo (para turnos reservados)
    },
    {
      id: 2,
      title: 'Disponible',
      start: '2024-09-26T13:00:00',
      end: '2024-09-26T14:00:00',
      color: '#81c995' // verde (para turnos disponibles)
    }
  ]);

  const handleDateClick = (info) => {
    // Puedes manejar eventos cuando el usuario hace clic en una fecha
    alert('Turno reservado en: ' + info.dateStr);
  };

  return (
    <div className="fullcalendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={events} // Eventos a mostrar
        dateClick={handleDateClick} // Maneja clic en fechas
        editable={true} // Habilita edición de eventos
        droppable={true} // Habilita arrastrar y soltar eventos
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        locale="es" // Cambia el idioma a español
        slotDuration="01:00:00" // Duración del slot (1 hora)
      />
    </div>
  );
};

export default FullCalendarDemo;
