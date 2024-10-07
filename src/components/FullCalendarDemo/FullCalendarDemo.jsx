import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './FullCalendarDemo.css';

const FullCalendarDemo = () => {
  const [events, setEvents] = useState([]);
  const [uidPeluquero, setUidPeluquero] = useState(null);
  const [workSchedule, setWorkSchedule] = useState({});

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      setUidPeluquero(user.uid);
      loadWorkSchedule(user.uid);
    } else {
      console.log('No hay usuario autenticado.');
    }
  }, []);

  const loadWorkSchedule = async (uid) => {
    const scheduleDocRef = doc(db, 'horarios', uid);
    const unsubscribe = onSnapshot(scheduleDocRef, (scheduleDoc) => {
      if (scheduleDoc.exists()) {
        setWorkSchedule(scheduleDoc.data());
      } else {
        console.log('No se encontró el horario.');
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  };

  useEffect(() => {
    const fetchReservas = async () => {
      if (uidPeluquero) {
        const reservasRef = collection(db, 'reservas');
        const q = query(reservasRef, where('uidPeluquero', '==', uidPeluquero));
        const querySnapshot = await getDocs(q);
        const eventos = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const start = `${data.fecha}T${data.hora}`;
          const [hours, minutes] = data.hora.split(':');
          const endHour = parseInt(hours) + Math.floor(data.duracion / 60);
          const endMinute = parseInt(minutes) + (data.duracion % 60);

          const end = `${data.fecha}T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00`;

          eventos.push({
            title: `${data.servicio} - ${data.nombre} ${data.apellido}`,
            start,
            end,
            color: '#f28b82',
          });
        });

        setEvents(eventos);
      }
    };

    fetchReservas();
  }, [uidPeluquero]);

  const getNonWorkingDaysAndHours = () => {
    const nonWorkingDays = [];

    Object.keys(workSchedule).forEach((day) => {
      if (!workSchedule[day].isWorking) {
        nonWorkingDays.push(dayToNumber(day)); // Bloquea días no laborales
      }
    });

    return { nonWorkingDays };
  };

  const dayToNumber = (day) => {
    const days = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 0,
    };
    return days[day];
  };

  const { nonWorkingDays } = getNonWorkingDaysAndHours();

  return (
    <div className="fullcalendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={events}
        editable={true}
        droppable={true}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        locale="es"
        hiddenDays={nonWorkingDays} // Oculta los días no laborales
        slotDuration="01:00:00"
      />
    </div>
  );
};

export default FullCalendarDemo;
