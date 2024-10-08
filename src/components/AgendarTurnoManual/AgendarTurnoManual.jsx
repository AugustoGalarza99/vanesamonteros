import React, { useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

const AgregarTurnoManual = ({ uidPeluquero, onAddExtraShift }) => {
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [nombre, setNombre] = useState('');
  const [servicio, setServicio] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleAgregarTurno = async () => {
    if (fecha && hora && nombre && servicio) {
      const turnoExtra = {
        title: `${servicio} - ${nombre}`,
        start: `${fecha}T${hora}`,
        color: '#00ff00', // Color verde para turnos extra
        uidPeluquero: uidPeluquero,
        fecha: fecha,
        hora: hora,
        servicio: servicio,
        nombre: nombre,
      };

      try {
        // Agregar el turno manual a Firebase
        const turnosRef = collection(db, 'turnosExtras');
        await addDoc(turnosRef, turnoExtra);

        onAddExtraShift(turnoExtra); // Enviar el turno extra al calendario
        setMensaje('Turno manual añadido exitosamente.');
      } catch (error) {
        console.error('Error al agregar turno manual:', error);
        setMensaje('Error al agregar turno manual.');
      }
    }
  };

  return (
    <div>
      <h3>Agregar Turno Manual</h3>
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
      />
      <input
        type="time"
        value={hora}
        onChange={(e) => setHora(e.target.value)}
      />
      <input
        type="text"
        placeholder="Nombre del cliente"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <input
        type="text"
        placeholder="Servicio"
        value={servicio}
        onChange={(e) => setServicio(e.target.value)}
      />
      <button onClick={handleAgregarTurno}>Agregar Turno</button>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
};

export default AgregarTurnoManual;
