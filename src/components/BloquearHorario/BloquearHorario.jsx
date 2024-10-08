import React, { useState } from 'react';

const BloquearHorario = ({ onAddBlockedTime }) => {
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');

  const handleBloquear = () => {
    if (fecha && hora) {
      const bloqueado = {
        title: 'Bloqueado',
        start: `${fecha}T${hora}`,
        color: '#ff0000', // Color rojo para bloqueos
        display: 'background',
      };
      onAddBlockedTime(bloqueado); // Enviar el bloqueo al calendario
    }
  };

  return (
    <div>
      <h3>Bloquear Horario</h3>
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
      <button onClick={handleBloquear}>Bloquear</button>
    </div>
  );
};

export default BloquearHorario;
