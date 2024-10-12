import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './TurnDurationConfig.css'

const TurnDurationConfig = ({ onDurationChange }) => {
  const [duration, setDuration] = useState('01:00:00'); // Duración por defecto
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Obtener el valor actual de la duración de Firebase
    const fetchTurnDuration = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const docRef = doc(db, 'peluqueros', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.turnDuration) {
            setDuration(data.turnDuration);
            onDurationChange(data.turnDuration); // Actualiza la duración en el calendario
          }
        }
      }
    };

    fetchTurnDuration();
  }, [onDurationChange]);

  const handleDurationChange = (e) => {
    setDuration(e.target.value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      try {
        const docRef = doc(db, 'peluqueros', user.uid);
        await setDoc(docRef, { turnDuration: duration }, { merge: true });
        setIsSaving(false);
        onDurationChange(duration); // Actualiza la duración en el calendario
        alert('Duración de los turnos guardada exitosamente');
      } catch (error) {
        console.error('Error guardando la duración del turno: ', error);
        setIsSaving(false);
      }
    }
  };

  return (
    <div className='turn'>
      <label htmlFor="turn-duration">Duración del turno: </label>
      <select
        id="turn-duration"
        value={duration}
        onChange={handleDurationChange}
      >
        <option value="00:15:00">15 minutos</option>
        <option value="00:20:00">20 minutos</option>
        <option value="00:30:00">30 minutos</option>
        <option value="00:45:00">45 minutos</option>
        <option value="01:00:00">1 hora</option>
        <option value="01:30:00">1 hora 30 minutos</option>
        <option value="02:00:00">2 horas</option>
      </select>

      <button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  );
};

export default TurnDurationConfig;
