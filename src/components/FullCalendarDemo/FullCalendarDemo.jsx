import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './FullCalendarDemo.css';
import EventActions from '../EventActions/EventActions';

const FullCalendarDemo = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const fetchReservasAndTurnosExtras = () => {
        const reservasRef = collection(db, 'reservas');
        const qReservas = query(reservasRef, where('uidPeluquero', '==', user.uid));

        const unsubscribe = onSnapshot(qReservas, (querySnapshot) => {
          const eventos = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            eventos.push({
              id: doc.id,
              title: `${data.servicio} - ${data.nombre} ${data.apellido}`,
              start: `${data.fecha}T${data.hora}`,
              end: `${data.fecha}T${data.horaFin}`,
              status: data.status,
              phoneNumber: data.telefono,
              color: getColorByStatus(data.status), // Usa la función de color aquí
            });
          });
          setEvents(eventos);
        }, (error) => {
          console.error("Error en la suscripción:", error);
        });

        return () => unsubscribe();
      };

      fetchReservasAndTurnosExtras();
    } else {
      console.log('No hay usuario autenticado.');
    }
  }, []);

  const getColorByStatus = (status) => {
    switch (status) {
      case 'pendiente':
        return '#f28b82'; // Rojo
      case 'en proceso':
        return '#fbbc04'; // Amarillo
      case 'finalizado':
        return '#34a853'; // Verde
      default:
        return '#000000'; // Negro por defecto
    }
  };

  const handleEventClick = (info) => {
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      status: info.event.extendedProps.status,
      phoneNumber: info.event.extendedProps.phoneNumber,
    });
  };

  const refreshCalendar = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div className="fullcalendar-wrapper">
      <FullCalendar
        key={refreshKey} // Usa refreshKey para forzar la recarga del calendario
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={events.map(event => ({ ...event, backgroundColor: event.color }))}
        eventClick={handleEventClick}
        locale="es"
        editable={true}
        droppable={true}
      />
      
      {selectedEvent && (
        <EventActions 
          selectedEvent={selectedEvent} 
          setSelectedEvent={setSelectedEvent} 
          events={events} 
          setEvents={setEvents}
          refreshCalendar={refreshCalendar}
          getColorByStatus={getColorByStatus} 
        />
      )}
    </div>
  );
};

export default FullCalendarDemo;
