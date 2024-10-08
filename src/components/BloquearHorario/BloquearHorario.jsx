import React, { useState } from 'react';
import { db } from '../../firebaseConfig'; // Asegúrate de importar la configuración de Firebase
import { collection, addDoc } from 'firebase/firestore';

const BloquearHorario = ({ uidPeluquero, onAddBlockedTime }) => {
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState(''); // Nuevo estado para la hora de fin
  const duracion = 60; // Duración fija en minutos

  const handleBloquear = async () => {
    if (fecha && horaInicio) {
      const start = `${fecha}T${horaInicio}`;
      const startDateTime = new Date(start);

      // Si horaFin está definido, usarla; de lo contrario, calcular el tiempo final
      let endDateTime;
      if (horaFin) {
        endDateTime = new Date(`${fecha}T${horaFin}`); // Usar horaFin si está definida
      } else {
        endDateTime = new Date(startDateTime.getTime() + duracion * 60 * 1000); // Calcular el tiempo final en minutos
      }

      const bloqueado = {
        title: 'Bloqueado',
        start: start,
        end: endDateTime.toISOString(), // Usar el formato ISO para el final
        color: '#ff0000', // Color rojo para bloqueos
        display: 'background',
        uidPeluquero, // Asegúrate de que uidPeluquero está definido
      };

      // Guardar el bloqueo en Firebase
      try {
        await addDoc(collection(db, 'bloqueos'), bloqueado);
        onAddBlockedTime(bloqueado); // Enviar el bloqueo al calendario
        console.log('Horario bloqueado guardado en Firebase');
      } catch (error) {
        console.error('Error al bloquear horario:', error);
      }
    }
  };

  return (
    <div>
      <h3>Bloquear Horario</h3>
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
      <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} /> {/* Nuevo campo para la hora de fin */}
      <button onClick={handleBloquear}>Bloquear</button>
    </div>
  );
};

export default BloquearHorario;
