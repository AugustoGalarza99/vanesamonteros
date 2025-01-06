import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import './RecurringReservation.css';

const RecurringReservation = () => {
  const [clientes, setClientes] = useState([]);
  const [nombreCliente, setNombreCliente] = useState('');
  const [apellidoCliente, setApellidoCliente] = useState('');
  const [hora, setHora] = useState('');
  const [frecuencia, setFrecuencia] = useState('semanal');
  const [turnosFijos, setTurnosFijos] = useState([]);

  useEffect(() => {
    // Cargar los clientes desde Firebase (si ya tienes la colección 'clientes')
    const fetchClientes = async () => {
      const querySnapshot = await getDocs(collection(db, 'clientes'));
      const clientesData = querySnapshot.docs.map(doc => doc.data());
      setClientes(clientesData);
    };

    // Cargar los turnos fijos (reservas recurrentes)
    const fetchTurnosFijos = async () => {
      const querySnapshot = await getDocs(collection(db, 'reservas'));
      const reservasData = querySnapshot.docs.map(doc => doc.data());
      setTurnosFijos(reservasData);
    };

    fetchClientes();
    fetchTurnosFijos();
  }, []);

  // Guardar la reserva recurrente
  const saveReserva = async () => {
    if (!nombreCliente || !apellidoCliente || !hora) {
      Swal.fire('Faltan datos', 'Por favor completa todos los campos', 'error');
      return;
    }

    try {
      // Crear el nombre completo del cliente
      const clienteCompleto = `${nombreCliente} ${apellidoCliente}`;

      // Crear la reserva recurrente
      await addDoc(collection(db, 'reservas'), {
        cliente: clienteCompleto,
        hora,
        frecuencia,
        fechaInicio: new Date().toISOString(), // Fecha de inicio (actual)
      });

      Swal.fire('Reserva guardada', 'La reserva recurrente se ha guardado correctamente', 'success');
      setNombreCliente('');
      setApellidoCliente('');
      setHora('');
      setFrecuencia('semanal');
    } catch (error) {
      console.error('Error al guardar la reserva:', error);
      Swal.fire('Error', 'Hubo un problema al guardar la reserva', 'error');
    }
  };

  // Eliminar una reserva
  const deleteReserva = async (id) => {
    try {
      const docRef = doc(db, 'reservas', id);
      await deleteDoc(docRef);
      Swal.fire('Reserva eliminada', 'La reserva recurrente ha sido eliminada correctamente', 'success');
      setTurnosFijos(turnosFijos.filter(turno => turno.id !== id));
    } catch (error) {
      console.error('Error al eliminar la reserva:', error);
      Swal.fire('Error', 'Hubo un problema al eliminar la reserva', 'error');
    }
  };

  return (
    <div className="recurring-reservation">
      <h2>Crear Reserva Recurrente</h2>
      <div className="form">
        <label>Nombre:</label>
        <input
          type="text"
          value={nombreCliente}
          onChange={(e) => setNombreCliente(e.target.value)}
          placeholder="Nombre del cliente"
          required
        />

        <label>Apellido:</label>
        <input
          type="text"
          value={apellidoCliente}
          onChange={(e) => setApellidoCliente(e.target.value)}
          placeholder="Apellido del cliente"
          required
        />

        <label>Hora:</label>
        <input
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          required
        />

        <label>Frecuencia:</label>
        <select
          value={frecuencia}
          onChange={(e) => setFrecuencia(e.target.value)}
        >
          <option value="semanal">Semanal</option>
          <option value="quincenal">Quincenal</option>
          <option value="mensual">Mensual</option>
        </select>

        <button onClick={saveReserva}>Guardar Reserva</button>
      </div>

      <h3>Turnos Fijos Existentes</h3>
      <div className="turnos-list">
        {turnosFijos.map((turno, index) => (
          <div key={index} className="turno-item">
            <p>{turno.cliente} - {turno.hora} - Frecuencia: {turno.frecuencia}</p>
            <button onClick={() => deleteReserva(turno.id)}>Eliminar Reserva</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecurringReservation;
