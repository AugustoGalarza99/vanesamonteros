import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const WorkScheduleConfig = () => {
  const [workDays, setWorkDays] = useState({
    lunes: { start1: '', end1: '', start2: '', end2: '', isWorking: false },
    martes: { start1: '', end1: '', start2: '', end2: '', isWorking: false },
    miércoles: { start1: '', end1: '', start2: '', end2: '', isWorking: false },
    jueves: { start1: '', end1: '', start2: '', end2: '', isWorking: false },
    viernes: { start1: '', end1: '', start2: '', end2: '', isWorking: false },
    sábado: { start1: '', end1: '', start2: '', end2: '', isWorking: false },
    domingo: { start1: '', end1: '', start2: '', end2: '', isWorking: false },
  });
  const [uidPeluquero, setUidPeluquero] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUidPeluquero(user.uid);
      loadWorkSchedule(user.uid);
    }
  }, []);

  const loadWorkSchedule = async (uid) => {
    const scheduleDocRef = doc(db, 'horarios', uid);
    const scheduleDoc = await getDoc(scheduleDocRef);
    if (scheduleDoc.exists()) {
      setWorkDays(scheduleDoc.data());
    }
  };

  const handleSave = async () => {
    if (!uidPeluquero) return;

    try {
      const scheduleDocRef = doc(db, 'horarios', uidPeluquero);
      await setDoc(scheduleDocRef, workDays);
      alert('Horario guardado correctamente.');
    } catch (error) {
      console.error('Error guardando horario: ', error);
      alert('Error guardando horario, intenta nuevamente.');
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

  return (
    <div>
      <h2>Configurar Días y Horarios de Trabajo</h2>
      {Object.keys(workDays).map((day) => (
        <div key={day}>
          <h3>{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
          <label>
            <input
              type="checkbox"
              checked={workDays[day].isWorking}
              onChange={(e) => handleChange(day, 'isWorking', e.target.checked)}
            />
            ¿Trabaja este día?
          </label>
          {workDays[day].isWorking && (
            <>
              {/* Primer rango horario */}
              <label>
                Hora de inicio 1:
                <input
                  type="time"
                  value={workDays[day].start1}
                  onChange={(e) => handleChange(day, 'start1', e.target.value)}
                />
              </label>
              <label>
                Hora de fin 1:
                <input
                  type="time"
                  value={workDays[day].end1}
                  onChange={(e) => handleChange(day, 'end1', e.target.value)}
                />
              </label>
              {/* Segundo rango horario */}
              <label>
                Hora de inicio 2:
                <input
                  type="time"
                  value={workDays[day].start2}
                  onChange={(e) => handleChange(day, 'start2', e.target.value)}
                />
              </label>
              <label>
                Hora de fin 2:
                <input
                  type="time"
                  value={workDays[day].end2}
                  onChange={(e) => handleChange(day, 'end2', e.target.value)}
                />
              </label>
            </>
          )}
        </div>
      ))}
      <button onClick={handleSave}>Guardar Horario</button>
    </div>
  );
};

export default WorkScheduleConfig;
