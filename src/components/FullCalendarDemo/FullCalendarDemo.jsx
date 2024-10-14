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
import EventActions from '../EventActions/EventActions';
import GeneradorCodigo from '../GeneradorCodigo/GeneradorCodigo';

const FullCalendarDemo = ({ extraShifts }) => {
  const [events, setEvents] = useState([]);
  const [uidPeluquero, setUidPeluquero] = useState(null);
  const [workSchedule, setWorkSchedule] = useState({});
  const [slotDuration, setSlotDuration] = useState('01:00:00');
  const [workingHours, setWorkingHours] = useState({ min: '09:00', max: '18:00' });
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      setUidPeluquero(user.uid);
      loadWorkSchedule(user.uid);
      fetchTurnDuration(user.uid);
      fetchReservasAndTurnosExtras(user.uid);
    } else {
      console.log('No hay usuario autenticado.');
    }
  }, []);

  const loadWorkSchedule = async (uid) => {
    const scheduleDocRef = doc(db, 'horarios', uid);
    const unsubscribe = onSnapshot(scheduleDocRef, (scheduleDoc) => {
      if (scheduleDoc.exists()) {
        setWorkSchedule(scheduleDoc.data());
        // Después de obtener el horario, calcular las horas de trabajo
        calculateWorkingHours(scheduleDoc.data());
      } else {
        console.log('No se encontró el horario.');
      }
    });

    return () => unsubscribe();
  };

  const fetchTurnDuration = async (uid) => {
    const docRef = doc(db, 'peluqueros', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.turnDuration) {
        setSlotDuration(data.turnDuration);
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
      console.log("Reserva obtenida de Firebase:", data);

      const start = `${data.fecha}T${data.hora}`;
      const [hours, minutes] = data.hora.split(':');
      const endHour = parseInt(hours) + Math.floor(data.duracion / 60);
      const endMinute = parseInt(minutes) + (data.duracion % 60);
      
      const end = `${data.fecha}T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00`;

      eventos.add(JSON.stringify({
        id: doc.id, 
        title: `${data.servicio} - ${data.nombre} ${data.apellido}`,
        start,
        end,
        color: '#f28b82', 
        status: 'reservado',
        phoneNumber: data.telefono // Asegúrate de que el número de teléfono esté aquí
      }));
    });

    // Agregar los turnos extra
    querySnapshotTurnos.forEach((doc) => {
      const data = doc.data();
      eventos.add(JSON.stringify({
        id: doc.id, 
        title: `${data.servicio} - ${data.nombre}`,
        start: `${data.fecha}T${data.hora}`,
        color: '#00ff00', 
        status: 'extra'
      }));
    });

    setEvents(Array.from(eventos).map(event => JSON.parse(event))); // Convertir de vuelta a objeto
  };

  // Calcular las horas de trabajo basado en la estructura que has proporcionado
  const calculateWorkingHours = (scheduleData) => {
    const daysOfWeek = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    let minHour = '23:59'; // Valor máximo para encontrar el mínimo
    let maxHour = '00:00'; // Valor mínimo para encontrar el máximo

    daysOfWeek.forEach(day => {
      if (scheduleData[day]?.isWorking) {
        // Revisar los horarios de inicio y fin
        const start1 = scheduleData[day].start1;
        const end1 = scheduleData[day].end1;
        const start2 = scheduleData[day].start2;
        const end2 = scheduleData[day].end2;

        // Comparar las horas de inicio y fin
        if (start1 < minHour) minHour = start1;
        if (end1 > maxHour) maxHour = end1;
        if (start2 < minHour) minHour = start2;
        if (end2 > maxHour) maxHour = end2;
      }
    });

    setWorkingHours({ min: minHour, max: maxHour });
  };

  const handleEventClick = (info) => {
    console.log("Evento seleccionado en el calendario:", info.event);
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      color: info.event.color,
      status: info.event.extendedProps.status,
      phoneNumber: info.event.extendedProps.phoneNumber 
    });
  };
  
  return (
    <div className="fullcalendar-wrapper">
      <div className='primer-fraccion'>
        <TurnDurationConfig onDurationChange={setSlotDuration} />
        <GeneradorCodigo />
      </div>
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
        hiddenDays={[]}
        slotDuration={slotDuration}
        slotMinTime={workingHours.min} // Usar slotMinTime
        slotMaxTime={workingHours.max} // Usar slotMaxTime
        eventClick={handleEventClick}
      />
      
      
      {selectedEvent && (
        <EventActions 
          selectedEvent={selectedEvent} 
          setSelectedEvent={setSelectedEvent} 
          events={events} 
          setEvents={setEvents} 
        />
      )}
    </div>
  );
};

export default FullCalendarDemo;
