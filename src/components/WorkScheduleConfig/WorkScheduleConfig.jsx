import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const WorkScheduleConfig = () => {
  const [workDays, setWorkDays] = useState({
    monday: { start: '', end: '', isWorking: false },
    tuesday: { start: '', end: '', isWorking: false },
    wednesday: { start: '', end: '', isWorking: false },
    thursday: { start: '', end: '', isWorking: false },
    friday: { start: '', end: '', isWorking: false },
    saturday: { start: '', end: '', isWorking: false },
    sunday: { start: '', end: '', isWorking: false },
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
              <label>
                Hora de inicio:
                <input
                  type="time"
                  value={workDays[day].start}
                  onChange={(e) => handleChange(day, 'start', e.target.value)}
                />
              </label>
              <label>
                Hora de fin:
                <input
                  type="time"
                  value={workDays[day].end}
                  onChange={(e) => handleChange(day, 'end', e.target.value)}
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
