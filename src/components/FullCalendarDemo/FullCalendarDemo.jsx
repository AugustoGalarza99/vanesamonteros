import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where, doc, onSnapshot, getDoc, addDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './FullCalendarDemo.css';
import TurnDurationConfig from '../TurnDurationConfig/TurnDurationConfig';
import BloquearHorario from '../BloquearHorario/BloquearHorario'; // Importar el nuevo componente

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
      fetchReservasAndTurnosExtras(user.uid); // Cargar reservas y turnos extra desde Firebase
      fetchBlockedTimes(user.uid); // Cargar horarios bloqueados desde Firebase
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

  // Cargar reservas y turnos extra desde Firebase
  const fetchReservasAndTurnosExtras = async (uid) => {
    const reservasRef = collection(db, 'reservas');
    const qReservas = query(reservasRef, where('uidPeluquero', '==', uid));
    const querySnapshotReservas = await getDocs(qReservas);
    
    const turnosRef = collection(db, 'turnosExtras');
    const qTurnos = query(turnosRef, where('uidPeluquero', '==', uid));
    const querySnapshotTurnos = await getDocs(qTurnos);

    const eventos = new Set(); // Usar un Set para evitar duplicados

    // Agregar las reservas
    querySnapshotReservas.forEach((doc) => {
      const data = doc.data();
      const start = `${data.fecha}T${data.hora}`;
      const [hours, minutes] = data.hora.split(':');
      const endHour = parseInt(hours) + Math.floor(data.duracion / 60);
      const endMinute = parseInt(minutes) + (data.duracion % 60);

      const end = `${data.fecha}T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00`;

      eventos.add(JSON.stringify({ // Usar JSON.stringify para evitar duplicados
        title: `${data.servicio} - ${data.nombre} ${data.apellido}`,
        start,
        end,
        color: '#f28b82',
      }));
    });

    // Agregar los turnos extra
    querySnapshotTurnos.forEach((doc) => {
      const data = doc.data();
      eventos.add(JSON.stringify({ // Usar JSON.stringify para evitar duplicados
        title: `${data.servicio} - ${data.nombre}`,
        start: `${data.fecha}T${data.hora}`,
        color: '#00ff00', // Color verde para turnos extra
      }));
    });

    setEvents(Array.from(eventos).map(event => JSON.parse(event))); // Convertir de vuelta a objeto
  };

  // Cargar los horarios bloqueados desde Firebase
  const fetchBlockedTimes = async (uid) => {
    const bloqueosRef = collection(db, 'bloqueos');
    const qBloqueos = query(bloqueosRef, where('uidPeluquero', '==', uid));
    const querySnapshotBloqueos = await getDocs(qBloqueos);

    const bloqueos = [];

    querySnapshotBloqueos.forEach((doc) => {
      const data = doc.data();
      bloqueos.push({
        title: data.title,
        start: data.start,
        end: data.end,
        color: data.color,
      });
    });

    // Añadir los bloqueos a los eventos
    setEvents((prevEvents) => [...prevEvents, ...bloqueos]);
  };

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

// Función para agregar horarios bloqueados a Firebase
const handleAddBlockedTime = async (bloqueado) => {
  try {
    const bloqueosRef = collection(db, 'bloqueos'); // Asegúrate de tener la colección "bloqueos" en Firestore
    const dataToSave = {
      uidPeluquero: bloqueado.uidPeluquero, // Asegúrate de que uidPeluquero está definido
      title: bloqueado.title,
      start: new Date(bloqueado.start).toISOString(), // Convertir a formato ISO
      end: new Date(bloqueado.end).toISOString(), // Convertir a formato ISO
      color: bloqueado.color,
      display: bloqueado.display,
    };
    await addDoc(bloqueosRef, dataToSave);
    // Luego puedes volver a cargar los eventos para reflejar los cambios
    fetchBlockedTimes(uidPeluquero); // Cargar los bloqueos nuevamente después de agregar uno nuevo
  } catch (error) {
    console.error('Error al agregar horario bloqueado:', error);
  }
};

  return (
    <div className="fullcalendar-wrapper">
      <TurnDurationConfig onDurationChange={handleDurationChange} />
      <BloquearHorario uidPeluquero={uidPeluquero} onAddBlockedTime={handleAddBlockedTime} /> {/* Incluir el nuevo componente */}

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
