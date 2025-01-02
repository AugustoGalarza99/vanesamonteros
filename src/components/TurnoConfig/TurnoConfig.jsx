import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { doc, collection, addDoc, getDocs, query, where, getDoc} from 'firebase/firestore';
import Swal from 'sweetalert2';

const TurnoConfig = ({ uidPeluquero }) => {
  const [selectedDay, setSelectedDay] = useState('');
  const [interval, setInterval] = useState(30);
  const [generatedTurns, setGeneratedTurns] = useState([]);

  const generateTurns = async () => {
    if (!uidPeluquero || !selectedDay || interval <= 0) return;

    const horariosRef = doc(db, 'horarios', uidPeluquero);
    const horariosSnap = await getDoc(horariosRef);

    if (!horariosSnap.exists()) {
      Swal.fire('No se encontraron horarios configurados para el peluquero.', '', 'error');
      return;
    }

    const horarios = horariosSnap.data();
    const dayKey = new Date(selectedDay).toLocaleString('es-ES', { weekday: 'long' });

    if (!horarios[dayKey] || !horarios[dayKey].isWorking) {
      Swal.fire(`El día ${dayKey} no está configurado como día laboral.`, '', 'error');
      return;
    }

    const { start1, end1, start2, end2 } = horarios[dayKey];
    const turns = [];

    const addTurnsInRange = (start, end) => {
      let startTime = new Date(`${selectedDay}T${start}`);
      const endTime = new Date(`${selectedDay}T${end}`);
      while (startTime < endTime) {
        const nextStart = new Date(startTime);
        const nextEnd = new Date(startTime);
        nextEnd.setMinutes(nextStart.getMinutes() + interval);

        if (nextEnd <= endTime) {
          turns.push({
            startTime: nextStart.toISOString().slice(11, 16),
            endTime: nextEnd.toISOString().slice(11, 16),
          });
        }

        startTime.setMinutes(startTime.getMinutes() + interval);
      }
    };

    if (start1 && end1) addTurnsInRange(start1, end1);
    if (start2 && end2) addTurnsInRange(start2, end2);

    setGeneratedTurns(turns);

    // Opcional: Guardar turnos en Firestore
    const turnosRef = collection(db, 'turnos');
    for (const turn of turns) {
      await addDoc(turnosRef, {
        uidPeluquero,
        day: selectedDay,
        startTime: turn.startTime,
        endTime: turn.endTime,
      });
    }

    Swal.fire('Turnos generados correctamente.', '', 'success');
  };

  return (
    <div>
      <h3>Generar Turnos</h3>
      <label>
        Día:
        <input
          type="date"
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
        />
      </label>
      <label>
        Intervalo (minutos):
        <input
          type="number"
          value={interval}
          onChange={(e) => setInterval(parseInt(e.target.value))}
          min="1"
        />
      </label>
      <button onClick={generateTurns}>Generar Turnos</button>

      {generatedTurns.length > 0 && (
        <div>
          <h4>Turnos Generados:</h4>
          <ul>
            {generatedTurns.map((turn, index) => (
              <li key={index}>
                {turn.startTime} - {turn.endTime}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TurnoConfig;
