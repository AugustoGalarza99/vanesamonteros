import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

const AgregarTurnoExtra = ({ uidPeluquero }) => {
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleAgregarTurnoExtra = async (e) => {
    e.preventDefault();
    try {
      const turnoExtraRef = collection(db, 'turnosExtras');
      await addDoc(turnoExtraRef, {
        uidPeluquero,
        fecha,
        hora,
      });
      setMensaje('Turno extra añadido exitosamente.');
    } catch (error) {
      console.error('Error al agregar turno extra:', error);
      setMensaje('Error al agregar turno extra.');
    }
  };

  return (
    <div>
      <h3>Agregar Turno Extra</h3>
      <form onSubmit={handleAgregarTurnoExtra}>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
        <input
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          required
        />
        <button type="submit">Agregar Turno Extra</button>
      </form>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
};

export default AgregarTurnoExtra;
