import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { addDays, startOfWeek, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import './CalendarioPeluquero.css';

const CalendarioPeluquero = ({ uidPeluquero }) => {
  const [diasTrabajo, setDiasTrabajo] = useState([]);
  const [horariosTrabajo, setHorariosTrabajo] = useState({});
  const [reservas, setReservas] = useState([]);
  const [fechaInicial, setFechaInicial] = useState(new Date());
  const [fechasSemana, setFechasSemana] = useState([]);
  const [rangoHorarioGlobal, setRangoHorarioGlobal] = useState({ startHour: 8, endHour: 21 });

  const fetchHorariosPeluquero = async () => {
    try {
      if (!uidPeluquero) {
        console.error('uidPeluquero está indefinido');
        return;
      }

      const docRef = doc(db, 'horarios', uidPeluquero);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const horarioData = docSnap.data();
        const diasTrabajo = Object.keys(horarioData).filter(dia => horarioData[dia].isWorking);
        setDiasTrabajo(diasTrabajo);
        setHorariosTrabajo(horarioData);
        calcularRangoHorarioGlobal(horarioData);
      } else {
        console.log('No se encontraron horarios para este peluquero');
      }
    } catch (error) {
      console.error('Error obteniendo los horarios:', error);
    }
  };

  const calcularRangoHorarioGlobal = (horarioData) => {
    let startHourGlobal = 24; 
    let endHourGlobal = 0; 

    Object.keys(horarioData).forEach((dia) => {
      if (horarioData[dia].isWorking) {
        const { start1, end1, start2, end2 } = horarioData[dia];

        startHourGlobal = Math.min(startHourGlobal, parseInt(start1));
        endHourGlobal = Math.max(endHourGlobal, parseInt(end1));

        if (start2 && end2) {
          startHourGlobal = Math.min(startHourGlobal, parseInt(start2));
          endHourGlobal = Math.max(endHourGlobal, parseInt(end2));
        }
      }
    });

    setRangoHorarioGlobal({ startHour: startHourGlobal, endHour: endHourGlobal });
  };

  const fetchReservasPeluquero = async () => {
    try {
      if (!uidPeluquero) {
        console.error('uidPeluquero está indefinido');
        return;
      }

      const reservasRef = collection(db, 'reservas');
      const q = query(reservasRef, where('uidPeluquero', '==', uidPeluquero));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const reservasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReservas(reservasData);
      } else {
        console.log('No se encontraron reservas para este peluquero');
      }
    } catch (error) {
      console.error('Error obteniendo las reservas:', error);
    }
  };

  const calcularFechasSemana = () => {
    const inicioSemana = startOfWeek(fechaInicial, { weekStartsOn: 1 });
    const fechas = [];

    for (let i = 0; i < 7; i++) {
      fechas.push(addDays(inicioSemana, i));
    }

    setFechasSemana(fechas);
  };

  useEffect(() => {
    fetchHorariosPeluquero();
    fetchReservasPeluquero();
    calcularFechasSemana();
  }, [uidPeluquero, fechaInicial]);

  const renderHorasDelDia = (horarioDia) => {
    const horas = [];
    const { start1, end1, start2, end2 } = horarioDia;

    let currentHour = rangoHorarioGlobal.startHour;
    let currentMinute = 0;

    while (currentHour < rangoHorarioGlobal.endHour || (currentHour === rangoHorarioGlobal.endHour && currentMinute === 0)) {
      const inFirstShift = currentHour >= parseInt(start1) && (currentHour < parseInt(end1) || (currentHour === parseInt(end1) && currentMinute === 0));
      const inSecondShift = start2 && end2 && currentHour >= parseInt(start2) && (currentHour < parseInt(end2) || (currentHour === parseInt(end2) && currentMinute === 0));

      const formattedTime = `${String(currentHour).padStart(2, '0')}:${currentMinute === 0 ? '00' : '30'}`;

      horas.push(
        <div key={formattedTime} className={`calendario-hora ${inFirstShift || inSecondShift ? 'trabajando' : 'descanso'}`}>
          {inFirstShift || inSecondShift ? formattedTime : ''}
        </div>
      );

      if (currentMinute === 0) {
        currentMinute = 30;
      } else {
        currentMinute = 0;
        currentHour++;
      }
    }

    return horas;
  };

  const handleRemindTurn = (reserva) => {
    const fechaTurno = new Date(reserva.fecha);
    const fechaLocal = new Date(fechaTurno.getTime() + (fechaTurno.getTimezoneOffset() * 60000)); 
  
    const message = `Te recordamos que tienes tu turno el ${fechaLocal.toLocaleDateString()} a las ${reserva.hora} en nuestra peluquería.`;
    const phoneNumber = reserva.telefono; 
  
    if (phoneNumber) {
      const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappURL, '_blank'); 
    } else {
      alert('No se encontró el número de teléfono para este cliente.');
    }
  };

  const handleCancelTurn = async (reserva) => {
    try {
      const reservaId = reserva.id; 
      const reservaRef = doc(db, 'reservas', reservaId); 
  
      await deleteDoc(reservaRef); 
  
      fetchReservasPeluquero(); 
  
      Swal.fire('Turno Cancelado', 'El turno ha sido cancelado y eliminado.', 'success');
    } catch (error) {
      console.error('Error al cancelar el turno:', error);
      Swal.fire('Error', 'Hubo un problema al cancelar el turno.', 'error');
    }
  };

  const manejarClickReserva = (reserva) => {
    const { status, id } = reserva;

    if (status === 'Pendiente') {
      Swal.fire({
        title: 'Turno Pendiente',
        text: '¿Qué acción desea realizar?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Iniciar Turno',
        cancelButtonText: 'Cancelar Turno',
        showDenyButton: true,
        denyButtonText: 'Recordar Turno',
      }).then((result) => {
        if (result.isConfirmed) {
          actualizarEstadoTurno(id, 'en proceso'); 
          Swal.fire('Turno Iniciado', '', 'success');
        } else if (result.isDenied) {
          handleRemindTurn(reserva); 
          Swal.fire('Recordatorio enviado', '', 'info');
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          handleCancelTurn(reserva); 
        }
      });
    } else if (status === 'en proceso') {
      Swal.fire({
        title: 'Turno en Proceso',
        text: '¿Desea finalizar este turno?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Finalizar Turno',
      }).then((result) => {
        if (result.isConfirmed) {
          actualizarEstadoTurno(id, 'finalizado'); 
          Swal.fire('Turno Finalizado', '', 'success');
        }
      });
    }
  };

  const actualizarEstadoTurno = async (reservaId, nuevoEstado) => {
    try {
      const reservaRef = doc(db, 'reservas', reservaId);
      const updateData = { status: nuevoEstado };

      // Si el estado es "en proceso", también guardamos el tiempo de inicio del turno
      if (nuevoEstado === 'en proceso') {
        updateData.startTime = new Date();
      }

      await updateDoc(reservaRef, updateData);
      fetchReservasPeluquero();
    } catch (error) {
      console.error('Error actualizando el estado del turno:', error);
    }
  };

  const renderReservas = (diaFecha) => {
    const { gridHeight, totalMinutes, startHour } = calcularGridProperties();

    return reservas.map((reserva) => {
      const { hora, status, duracion } = reserva;
      const horaDate = new Date(`1970-01-01T${hora}:00`);
      const reservaFecha = new Date(reserva.fecha);

      const reservaFechaLocal = new Date(reservaFecha.getTime() + reservaFecha.getTimezoneOffset() * 60000);

      if (!isNaN(reservaFechaLocal) && !isNaN(horaDate)) {
        const esMismaFecha = isSameDay(reservaFechaLocal, diaFecha);

        if (esMismaFecha) {
          let estiloReserva = '';

          switch (status) {
            case 'Pendiente':
              estiloReserva = 'reserva-pendiente';
              break;
            case 'en proceso':
              estiloReserva = 'reserva-en-proceso';
              break;
            case 'finalizado':
              estiloReserva = 'reserva-finalizada';
              break;
            case 'cancelado':
              estiloReserva = 'reserva-cancelado';
              break;
            default:
              estiloReserva = '';
          }

          const totalReservaMinutes = (horaDate.getHours() - startHour) * 60 + horaDate.getMinutes();
          const topPosition = (totalReservaMinutes * (gridHeight / totalMinutes));
          const height = (duracion / 30) * 50;

          return (
            <div
              key={reserva.id}
              className={`reserva ${estiloReserva}`}
              style={{
                position: 'absolute',
                left: '0',
                top: `${topPosition}px`,
                height: `${height}px`,
                zIndex: 1,
              }}
              onClick={() => manejarClickReserva(reserva)} 
            >
              {`${reserva.nombre} - ${hora}`}
            </div>
          );
        }
      }
      return null;
    });
  };

  const calcularGridProperties = () => {
    const totalMinutes = (rangoHorarioGlobal.endHour - rangoHorarioGlobal.startHour) * 60;
    const gridHeight = (totalMinutes / 30) * 50;
    return { gridHeight, totalMinutes, startHour: rangoHorarioGlobal.startHour };
  };

  return (
    <div className="calendario">
      <div className="calendario-navigation">
        <button className='button-semana' onClick={() => setFechaInicial(prev => addDays(prev, -7))}>
          Semana Anterior
        </button>
        <button className='button-semana' onClick={() => setFechaInicial(prev => addDays(prev, 7))}>
          Semana Siguiente
        </button>
      </div>

      <div className="calendario-header">
        {fechasSemana.map((fecha, index) => (
          <div className='div-dia'>
          <div key={index} className="calendario-dia">
            {format(fecha, 'EEE d MMM', { locale: es })}
          </div>
          </div>
        ))}
      </div>

      <div className="calendario-grid">
        {fechasSemana.map((fecha, diaIndex) => {
          const diaSemana = format(fecha, 'EEEE', { locale: es }).toLowerCase();

          return (
            <div key={diaIndex} className="calendario-column">
              {horariosTrabajo[diaSemana] && horariosTrabajo[diaSemana].isWorking
                ? (
                  <div className="horas-container" style={{ position: 'relative', height: '100%' }}>
                    {renderHorasDelDia(horariosTrabajo[diaSemana], fecha)}
                    {renderReservas(fecha)} 
                  </div>
                )
                : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarioPeluquero;
