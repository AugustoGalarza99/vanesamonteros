import React, { useState } from 'react';

const AgregarTurnoManual = ({ onAddExtraShift }) => {
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [nombre, setNombre] = useState('');
  const [servicio, setServicio] = useState('');

  const handleAgregarTurno = () => {
    if (fecha && hora && nombre && servicio) {
      const turnoExtra = {
        title: `${servicio} - ${nombre}`,
        start: `${fecha}T${hora}`,
        color: '#00ff00', // Color verde para turnos extra
      };
      onAddExtraShift(turnoExtra); // Enviar el turno extra al calendario
    }
  };

  return (
    <div>
      <h3>Agregar Turno Manual</h3>
      <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
      <input type="text" placeholder="Nombre del cliente" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <input type="text" placeholder="Servicio" value={servicio} onChange={(e) => setServicio(e.target.value)} />
      <button onClick={handleAgregarTurno}>Agregar Turno</button>
    </div>
  );
};

export default AgregarTurnoManual;
