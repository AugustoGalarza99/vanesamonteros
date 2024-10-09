// FullCalendarDemo.jsx

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
import ReservarTurnoManual from '../ReservaTurnoManual/ReservaTurnoManual';
import EventActions from '../EventActions/EventActions'; // Importar el nuevo componente

const FullCalendarDemo = ({ extraShifts }) => {
  const [events, setEvents] = useState([]);
  const [uidPeluquero, setUidPeluquero] = useState(null);
  const [workSchedule, setWorkSchedule] = useState({});
  const [slotDuration, setSlotDuration] = useState('01:00:00'); // Duración por defecto de 1 hora
  const [reservas, setReservas] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); // Estado para el evento seleccionado

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      setUidPeluquero(user.uid);
      loadWorkSchedule(user.uid);
      fetchTurnDuration(user.uid); // Cargar la duración del turno desde Firebase
      fetchReservasAndTurnosExtras(user.uid); // Cargar reservas y turnos extra desde Firebase
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

      eventos.add(JSON.stringify({
        id: doc.id, // Almacenar el ID del documento
        title: `${data.servicio} - ${data.nombre} ${data.apellido}`,
        start,
        end,
        color: '#f28b82', // Color por defecto para reservas
        status: 'reservado' // Estado por defecto
      }));
    });

    // Agregar los turnos extra
    querySnapshotTurnos.forEach((doc) => {
      const data = doc.data();
      eventos.add(JSON.stringify({
        id: doc.id, // Almacenar el ID del documento
        title: `${data.servicio} - ${data.nombre}`,
        start: `${data.fecha}T${data.hora}`,
        color: '#00ff00', // Color verde para turnos extra
        status: 'extra' // Estado para turnos extra
      }));
    });

    setEvents(Array.from(eventos).map(event => JSON.parse(event))); // Convertir de vuelta a objeto
    setReservas(Array.from(eventos).map(event => JSON.parse(event))); // Guardamos las reservas para el bloqueo
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
      lunes: 1,
      martes: 2,
      miercoles: 3,
      jueves: 4,
      viernes: 5,
      sabado: 6,
      domingo: 0,
    };
    return days[day];
  };

  const { nonWorkingDays } = getNonWorkingDaysAndHours();

  const combinedEvents = [...events, ...extraShifts]; // Recibe eventos de turnos y turnos extra

  const handleDurationChange = (newDuration) => {
    setSlotDuration(newDuration); // Cambiamos la duración de los turnos en el calendario
  };

  const handleEventClick = (info) => {
    setSelectedEvent({
      id: info.event.id, // Almacenar el ID del evento
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      color: info.event.color,
      status: info.event.extendedProps.status // Almacenar el estado del evento
    });
  };

  return (
    <div className="fullcalendar-wrapper">
      <TurnDurationConfig onDurationChange={handleDurationChange} />
      {/* Pasamos workSchedule como prop a ReservarTurnoManual */}
      <ReservarTurnoManual uidPeluquero={uidPeluquero} workSchedule={workSchedule} />
      
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
        eventClick={handleEventClick} // Manejar clic en eventos
      />
      
      {selectedEvent && (
       <EventActions 
       selectedEvent={selectedEvent} 
       setSelectedEvent={setSelectedEvent} 
       events={events} 
       setEvents={setEvents} 
       fetchReservasAndTurnosExtras={fetchReservasAndTurnosExtras} 
     />          
      )}
    </div>
  );
};

export default FullCalendarDemo;
