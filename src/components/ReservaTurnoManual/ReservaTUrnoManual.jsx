import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const ReservarTurnoManual = ({ uidPeluquero, workSchedule }) => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [servicio, setServicio] = useState('');
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);

  useEffect(() => {
    if (fecha) {
      obtenerHorariosDisponibles(fecha);
    }
  }, [fecha]);

  const obtenerHorariosDisponibles = async (fechaSeleccionada) => {
    console.log('Fecha seleccionada:', fechaSeleccionada);
    
    const diaSemana = new Date(fechaSeleccionada).toLocaleString('es-ES', { weekday: 'long' }).toLowerCase();
    console.log('Día de la semana:', diaSemana);

    // Obtener horarios de trabajo para el día seleccionado
    const horariosTrabajo = workSchedule[diaSemana];
    
    if (!horariosTrabajo || !horariosTrabajo.isWorking) {
      console.log('No hay horarios de trabajo para este día.');
      setHorariosDisponibles([]);
      return;
    }

    const horariosOcupados = new Set();

    // Obtener reservas para la fecha seleccionada
    const reservasRef = collection(db, 'reservas');
    const q = query(reservasRef, where('fecha', '==', fechaSeleccionada), where('uidPeluquero', '==', uidPeluquero));
    
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      horariosOcupados.add(data.hora); // Añadir hora ocupada al Set
    });

    // Lógica para crear un array de horarios disponibles
    const horariosDisponibles = [];
    const { start1, end1, start2, end2 } = horariosTrabajo;

    // Función para generar horarios entre dos horas
    const generarHorarios = (inicio, fin) => {
      const horarios = [];
      const startHour = parseInt(inicio.split(':')[0], 10);
      const startMinute = parseInt(inicio.split(':')[1], 10);
      const endHour = parseInt(fin.split(':')[0], 10);
      const endMinute = parseInt(fin.split(':')[1], 10);
      
      for (let h = startHour; h <= endHour; h++) {
        for (let m = (h === startHour ? startMinute : 0); m < (h === endHour ? endMinute : 60); m += 30) {
          const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          if (!horariosOcupados.has(hora)) {
            horarios.push(hora);
          }
        }
      }
      return horarios;
    };

    horariosDisponibles.push(...generarHorarios(start1, end1));
    if (start2 && end2) {
      horariosDisponibles.push(...generarHorarios(start2, end2));
    }

    console.log('Horarios disponibles:', horariosDisponibles);
    setHorariosDisponibles(horariosDisponibles);
  };

  const handleReserva = async (e) => {
    e.preventDefault();

    // Validar que todos los campos estén completos
    if (!nombre || !apellido || !telefono || !fecha || !hora || !servicio) {
      alert('Por favor, complete todos los campos.');
      return;
    }

    try {
      // Guardar la reserva en Firestore
      const reservaRef = collection(db, 'reservas');
      await addDoc(reservaRef, {
        nombre,
        apellido,
        telefono,
        fecha,
        hora,
        servicio,
        uidPeluquero,  // UID del peluquero asociado
      });

      alert('Reserva realizada con éxito.');
      // Limpiar los campos después de la reserva
      setNombre('');
      setApellido('');
      setTelefono('');
      setFecha('');
      setHora('');
      setServicio('');
    } catch (error) {
      console.error('Error al realizar la reserva:', error);
      alert('Hubo un error al realizar la reserva.');
    }
  };

  return (
    <form onSubmit={handleReserva} className="reserva-manual-form">
      <h2>Reservar Turno Manual</h2>
      <div>
        <label>Nombre:</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Apellido:</label>
        <input
          type="text"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Teléfono:</label>
        <input
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Fecha:</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Hora:</label>
        <select value={hora} onChange={(e) => setHora(e.target.value)} required>
          <option value="">Seleccione una hora</option>
          {horariosDisponibles.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Servicio:</label>
        <input
          type="text"
          value={servicio}
          onChange={(e) => setServicio(e.target.value)}
          required
        />
      </div>
      <button type="submit">Reservar Turno</button>
    </form>
  );
};

export default ReservarTurnoManual;
