import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const BloquearTurno = ({ uidPeluquero }) => {
  const [fecha, setFecha] = useState('');
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [bloqueoExitoso, setBloqueoExitoso] = useState(false);
  const [horarioTrabajo, setHorarioTrabajo] = useState({});
  const duracion = 30; // Duración de 30 minutos

  useEffect(() => {
    // Cargar el horario de trabajo del peluquero
    const fetchWorkSchedule = async () => {
      try {
        const scheduleDocRef = doc(db, 'horarios', uidPeluquero);
        const scheduleDoc = await getDoc(scheduleDocRef);
        
        if (scheduleDoc.exists()) {
          setHorarioTrabajo(scheduleDoc.data());
        } else {
          console.log('No se encontró el horario.');
          setHorarioTrabajo({}); // Asegúrate de establecer un valor por defecto
        }
      } catch (error) {
        console.error('Error al obtener el horario de trabajo:', error);
      }
    };

    fetchWorkSchedule();
  }, [uidPeluquero]);

  useEffect(() => {
    if (fecha) {
      obtenerHorariosDisponibles();
    } else {
      setHorariosDisponibles([]);
    }
  }, [fecha, horarioTrabajo]);

  const obtenerHorariosDisponibles = async () => {
    const availableSlots = new Set(); // Cambiado a Set
    const selectedDate = new Date(fecha);
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    // Obtener todas las reservas para el día seleccionado
    const reservasRef = collection(db, 'reservas');
    const qReservas = query(reservasRef, where('uidPeluquero', '==', uidPeluquero));
    const querySnapshotReservas = await getDocs(qReservas);
    
    // Recopilar los horarios ocupados por reservas
    querySnapshotReservas.forEach((doc) => {
      const reserva = doc.data();
      const reservaStart = new Date(reserva.start);
      const reservaEnd = new Date(reserva.end);

      if (reservaStart >= startOfDay && reservaEnd <= endOfDay) {
        const start = reservaStart.getHours() * 60 + reservaStart.getMinutes();
        const end = reservaEnd.getHours() * 60 + reservaEnd.getMinutes();

        // Marcar los bloques ocupados
        for (let time = start; time < end; time += duracion) {
          availableSlots.add(time); // Cambiado a add para Set
        }
      }
    });

    // Obtener horarios de trabajo del peluquero
    const todosLosHorarios = [];

    // Iterar sobre los días de la semana y sus horarios
    Object.entries(horarioTrabajo).forEach(([dia, horario]) => {
      if (horario.isWorking) {
        const startHours = horario.start1.split(':').map(Number);
        const endHours = horario.end1.split(':').map(Number);
        
        const startMinute = startHours[0] * 60 + startHours[1]; // Convertir a minutos
        const endMinute = endHours[0] * 60 + endHours[1]; // Convertir a minutos

        // Generar los horarios dentro del rango de trabajo
        for (let time = startMinute; time < endMinute; time += duracion) {
          if (!availableSlots.has(time)) { // Cambiado a has para Set
            const slotStart = convertMinutesToTime(time);
            const slotEnd = convertMinutesToTime(time + duracion);
            todosLosHorarios.push({ start: slotStart, end: slotEnd });
          }
        }

        // Repetir para el segundo rango de trabajo si existe
        if (horario.start2 && horario.end2) {
          const startHours2 = horario.start2.split(':').map(Number);
          const endHours2 = horario.end2.split(':').map(Number);
          
          const startMinute2 = startHours2[0] * 60 + startHours2[1];
          const endMinute2 = endHours2[0] * 60 + endHours2[1];

          for (let time = startMinute2; time < endMinute2; time += duracion) {
            if (!availableSlots.has(time)) { // Cambiado a has para Set
              const slotStart = convertMinutesToTime(time);
              const slotEnd = convertMinutesToTime(time + duracion);
              todosLosHorarios.push({ start: slotStart, end: slotEnd });
            }
          }
        }
      }
    });

    setHorariosDisponibles(todosLosHorarios);
  };

  const convertMinutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const handleBloquear = async (slot) => {
    if (fecha && slot) {
      const start = `${fecha}T${slot.start}`;
      const end = `${fecha}T${slot.end}`;

      const bloqueado = {
        title: 'Bloqueo Personal',
        start,
        end,
        color: '#ff0000', // Color para bloqueos personales
        display: 'background',
        uidPeluquero,
      };

      // Guardar el bloqueo en Firebase
      try {
        await addDoc(collection(db, 'bloqueos'), bloqueado);
        setBloqueoExitoso(true);
      } catch (error) {
        console.error('Error al bloquear horario:', error);
        setBloqueoExitoso(false);
      }
    }
  };

  return (
    <div>
      <h3>Bloquear Horario Personal</h3>
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      <div>
        <h4>Horarios disponibles:</h4>
        {horariosDisponibles.length === 0 ? (
          <p>No hay horarios disponibles para bloquear.</p>
        ) : (
          <ul>
            {horariosDisponibles.map((slot, index) => (
              <li key={index}>
                {slot.start} - {slot.end}
                <button onClick={() => handleBloquear(slot)}>Bloquear</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {bloqueoExitoso && <p>Horario bloqueado con éxito.</p>}
    </div>
  );
};

export default BloquearTurno;
