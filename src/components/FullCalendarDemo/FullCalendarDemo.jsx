import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where, doc, onSnapshot, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './FullCalendarDemo.css';
import TurnDurationConfig from '../TurnDurationConfig/TurnDurationConfig';

const FullCalendarDemo = ({ blockedTimes, extraShifts }) => {
  const [events, setEvents] = useState([]);
  const [uidPeluquero, setUidPeluquero] = useState(null);
  const [workSchedule, setWorkSchedule] = useState({});
  const [slotDuration, setSlotDuration] = useState('01:00:00'); // Duración por defecto de 1 hora

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      setUidPeluquero(user.uid);
      loadWorkSchedule(user.uid);
      fetchTurnDuration(user.uid); // Cargar la duración del turno desde Firebase
    } else {
      console.log('No hay usuario autenticado.');
    }
  }, []);

  // Cargar el horario de trabajo del peluquero
  const loadWorkSchedule = async (uid) => {
    const scheduleDocRef = doc(db, 'horarios', uid);
    const unsubscribe = onSnapshot(scheduleDocRef, (scheduleDoc) => {
      if (scheduleDoc.exists()) {
        setWorkSchedule(scheduleDoc.data());
      } else {
        console.log('No se encontró el horario.');
      }
    });

    return () => unsubscribe();
  };

  // Cargar la duración del turno desde Firebase
  const fetchTurnDuration = async (uid) => {
    const docRef = doc(db, 'peluqueros', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.turnDuration) {
        setSlotDuration(data.turnDuration); // Actualiza la duración de los slots en el calendario
      }
    }
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
        nonWorkingDays.push(dayToNumber(day));
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

  const combinedEvents = [...events, ...blockedTimes, ...extraShifts]; // Recibe eventos de turnos y bloqueos

  const handleDurationChange = (newDuration) => {
    setSlotDuration(newDuration); // Cambiamos la duración de los turnos en el calendario
  };

  return (
    <div className="fullcalendar-wrapper">
      <TurnDurationConfig onDurationChange={handleDurationChange} />

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={combinedEvents}
        editable={true}
        droppable={true}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        locale="es"
        hiddenDays={nonWorkingDays}
        slotDuration={slotDuration} // Actualiza la duración del slot según lo seleccionado por el peluquero
      />
    </div>
  );
};

export default FullCalendarDemo;
