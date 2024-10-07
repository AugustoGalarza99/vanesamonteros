// FullCalendarDemo.jsx
import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react'; // Importa el componente FullCalendar
import dayGridPlugin from '@fullcalendar/daygrid'; // Vista de día
import timeGridPlugin from '@fullcalendar/timegrid'; // Vista de semana y día
import interactionPlugin from '@fullcalendar/interaction'; // Permite interactuar con los eventos (arrastrar, hacer clic)
import { db } from '../../firebaseConfig'; // Asegúrate de que esta sea la ruta correcta
import { collection, getDocs } from 'firebase/firestore';
import './FullCalendarDemo.css'

const FullCalendarDemo = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchServicios = async () => {
      const serviciosRef = collection(db, 'servicios');
      const querySnapshot = await getDocs(serviciosRef);
      const eventos = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        eventos.push({
          title: data.nombre,
          start: '2024-09-26T10:00:00', // Ajusta según tus necesidades
          end: `2024-09-26T${String(10 + data.duracion / 60).padStart(2, '0')}:00:00`, // Ajusta la hora de fin
          color: '#f28b82' // rojo (para turnos reservados)
        });
      });

      setEvents(eventos); // Establece los eventos obtenidos
    };

    fetchServicios();
  }, []);

  const handleDateClick = (info) => {
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


