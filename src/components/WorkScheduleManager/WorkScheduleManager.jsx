import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, setDoc, getDoc, addDoc, collection } from 'firebase/firestore';
import Swal from 'sweetalert2';
import './WorkScheduleManager.css';

const WorkScheduleManager = ({ uidPeluquero }) => {
  const initialWorkDays = {
    domingo: { start1: '', end1: '', start2: '', end2: '', isWorking: false, interval: 30 },
    lunes: { start1: '', end1: '', start2: '', end2: '', isWorking: false, interval: 30 },
    martes: { start1: '', end1: '', start2: '', end2: '', isWorking: false, interval: 30 },
    miércoles: { start1: '', end1: '', start2: '', end2: '', isWorking: false, interval: 30 },
    jueves: { start1: '', end1: '', start2: '', end2: '', isWorking: false, interval: 30 },
    viernes: { start1: '', end1: '', start2: '', end2: '', isWorking: false, interval: 30 },
    sábado: { start1: '', end1: '', start2: '', end2: '', isWorking: false, interval: 30 },
  };

  const [workDays, setWorkDays] = useState(initialWorkDays);
  const [extraTurn, setExtraTurn] = useState({ fecha: '', startTime: '', duration: 30 });

  useEffect(() => {
    if (uidPeluquero) loadWorkSchedule();
  }, [uidPeluquero]);

  const loadWorkSchedule = async () => {
    const scheduleDocRef = doc(db, 'horarios', uidPeluquero);
    const scheduleDoc = await getDoc(scheduleDocRef);
    if (scheduleDoc.exists()) {
      setWorkDays(scheduleDoc.data());
    }
  };

  const saveWorkSchedule = async () => {
    if (!uidPeluquero) return;
    try {
      const scheduleDocRef = doc(db, 'horarios', uidPeluquero);
      await setDoc(scheduleDocRef, workDays);
      Swal.fire('Horario guardado correctamente', '', 'success');
    } catch (error) {
      console.error('Error al guardar horario:', error);
      Swal.fire('Error al guardar el horario', '', 'error');
    }
  };

  const addExtraTurn = async () => {
    if (!uidPeluquero || !extraTurn.fecha || !extraTurn.startTime) {
      Swal.fire('Por favor completa todos los campos del turno extra', '', 'error');
      return;
    }

    try {
      const turnosRef = collection(db, 'turnos');
      const startTime = new Date(`${extraTurn.fecha}T${extraTurn.startTime}`);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + extraTurn.duration);

      await addDoc(turnosRef, {
        uidPeluquero,
        fecha: extraTurn.fecha,  // Usamos "fecha" en vez de "day"
        startTime: extraTurn.startTime,
        endTime: endTime.toISOString().slice(11, 16),
      });

      Swal.fire('Turno extra agregado correctamente', '', 'success');
      setExtraTurn({ fecha: '', startTime: '', duration: 30 });
    } catch (error) {
      console.error('Error al agregar turno extra:', error);
      Swal.fire('Error al agregar el turno extra', '', 'error');
    }
  };

  const handleChange = (day, field, value) => {
    setWorkDays((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  return (
    <div className="schedule-manager">
      <h2 className="title">Gestión de Horarios de Trabajo</h2>

      {daysOfWeek.map((day) => (
        <div key={day} className="day-config">
          <div className="day-header">
            <h3>{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
            <label>
              ¿Trabajas este día?
              <input
                type="checkbox"
                checked={workDays[day].isWorking}
                onChange={(e) => handleChange(day, 'isWorking', e.target.checked)}
              />
            </label>
          </div>

          {workDays[day].isWorking && (
            <div className="day-details">
              <div className="time-range">
                <label>Turno Mañana:</label>
                <input
                  type="time"
                  value={workDays[day].start1}
                  onChange={(e) => handleChange(day, 'start1', e.target.value)}
                />
                <span>a</span>
                <input
                  type="time"
                  value={workDays[day].end1}
                  onChange={(e) => handleChange(day, 'end1', e.target.value)}
                />
              </div>

              <div className="time-range">
                <label>Turno Tarde:</label>
                <input
                  type="time"
                  value={workDays[day].start2}
                  onChange={(e) => handleChange(day, 'start2', e.target.value)}
                />
                <span>a</span>
                <input
                  type="time"
                  value={workDays[day].end2}
                  onChange={(e) => handleChange(day, 'end2', e.target.value)}
                />
              </div>

              <div className="interval-config">
                <label>Intervalo de turnos (min):</label>
                <input
                  type="number"
                  min="1"
                  value={workDays[day].interval}
                  onChange={(e) => handleChange(day, 'interval', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <button className="btn-save" onClick={saveWorkSchedule}>Guardar Horarios</button>

      <div className="extra-turn">
        <h3>Agregar Turno Extra</h3>
        <label>
          Fecha:
          <input
            type="date"
            value={extraTurn.fecha}
            onChange={(e) => setExtraTurn({ ...extraTurn, fecha: e.target.value })}
          />
        </label>
        <label>
          Hora:
          <input
            type="time"
            value={extraTurn.startTime}
            onChange={(e) => setExtraTurn({ ...extraTurn, startTime: e.target.value })}
          />
        </label>
        <label>
          Duración (min):
          <input
            type="number"
            min="1"
            value={extraTurn.duration}
            onChange={(e) => setExtraTurn({ ...extraTurn, duration: parseInt(e.target.value) })}
          />
        </label>
        <button className="btn-extra-turn" onClick={addExtraTurn}>Agregar Turno Extra</button>
      </div>
    </div>
  );
};

export default WorkScheduleManager;
