import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { addDays, startOfWeek, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import './CalendarioPeluquero.css';

const CalendarioPeluquero = ({ uidPeluquero }) => {
  const [diasTrabajo, setDiasTrabajo] = useState([]);
  const [horariosTrabajo, setHorariosTrabajo] = useState({});
  const [reservas, setReservas] = useState([]);
  const [fechaInicial, setFechaInicial] = useState(new Date());
  const [fechasSemana, setFechasSemana] = useState([]);
  const [rangoHorarioGlobal, setRangoHorarioGlobal] = useState({ startHour: 8, endHour: 21 });

  // Función para obtener los horarios de trabajo desde Firebase
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

  // Función para calcular el rango de horas más amplio basado en todos los días de trabajo
  const calcularRangoHorarioGlobal = (horarioData) => {
    let startHourGlobal = 24; // Empezamos con el valor máximo posible
    let endHourGlobal = 0; // Empezamos con el valor mínimo posible

    Object.keys(horarioData).forEach((dia) => {
      if (horarioData[dia].isWorking) {
        const { start1, end1, start2, end2 } = horarioData[dia];

        startHourGlobal = Math.min(startHourGlobal, parseInt(start1));
        endHourGlobal = Math.max(endHourGlobal, parseInt(end1));

        // Si hay segundo turno
        if (start2 && end2) {
          startHourGlobal = Math.min(startHourGlobal, parseInt(start2));
          endHourGlobal = Math.max(endHourGlobal, parseInt(end2));
        }
      }
    });

    setRangoHorarioGlobal({ startHour: startHourGlobal, endHour: endHourGlobal });
  };

  // Función para obtener las reservas del peluquero desde Firebase
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
        console.log('Reservas recibidas:', reservasData);
      } else {
        console.log('No se encontraron reservas para este peluquero');
      }
    } catch (error) {
      console.error('Error obteniendo las reservas:', error);
    }
  };

  // Función para calcular las fechas de la semana actual
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


  // Función para renderizar las franjas horarias del día con los huecos vacíos
// Función para renderizar las horas del día (cada 30 minutos)
const renderHorasDelDia = (horarioDia) => {
    const horas = [];
    const { start1, end1, start2, end2 } = horarioDia;
  
    let currentHour = rangoHorarioGlobal.startHour;
    let currentMinute = 0; // Empezamos desde el minuto 0
  
    while (currentHour < rangoHorarioGlobal.endHour || (currentHour === rangoHorarioGlobal.endHour && currentMinute === 0)) {
      const inFirstShift = currentHour >= parseInt(start1) && (currentHour < parseInt(end1) || (currentHour === parseInt(end1) && currentMinute === 0));
      const inSecondShift = start2 && end2 && currentHour >= parseInt(start2) && (currentHour < parseInt(end2) || (currentHour === parseInt(end2) && currentMinute === 0));
  
      // Formateamos la hora, ejemplo: "08:00" o "08:30"
      const formattedTime = `${String(currentHour).padStart(2, '0')}:${currentMinute === 0 ? '00' : '30'}`;
  
      // Empujamos la hora, con el formato correspondiente y un bloque de descanso si es necesario
      horas.push(
        <div key={formattedTime} className={`calendario-hora ${inFirstShift || inSecondShift ? 'trabajando' : 'descanso'}`}>
          {inFirstShift || inSecondShift ? formattedTime : ''}
        </div>
      );
  
      // Avanzar 30 minutos
      if (currentMinute === 0) {
        currentMinute = 30;
      } else {
        currentMinute = 0;
        currentHour++;
      }
    }
  
    return horas;
  };
  
  // Función para renderizar las reservas (eventos)
  const renderReservas = (diaFecha) => {
    const { gridHeight, totalMinutes, startHour } = calcularGridProperties();
  
    return reservas.map((reserva) => {
      const { hora, status, duracion } = reserva;
      const horaDate = new Date(`1970-01-01T${hora}:00`);
      const reservaFecha = new Date(reserva.fecha);
  
      if (!isNaN(reservaFecha) && !isNaN(horaDate)) {
        const esMismaFecha = isSameDay(reservaFecha, diaFecha);
  
        if (esMismaFecha) {
          let estiloReserva = '';
  
          // Estilo del evento según su estado
          switch (status) {
            case 'pendiente':
              estiloReserva = 'reserva-pendiente';
              break;
            case 'en proceso':
              estiloReserva = 'reserva-en-proceso';
              break;
            case 'finalizado':
              estiloReserva = 'reserva-finalizada';
              break;
            default:
              estiloReserva = '';
          }
  
          // Cálculo de la posición y altura del evento
          const totalReservaMinutes = (horaDate.getHours() - startHour) * 60 + horaDate.getMinutes();
          console.log(totalReservaMinutes);
          const topPosition = (totalReservaMinutes * (gridHeight / totalMinutes));
          
          // Duración en minutos (cada 30 minutos = 50px de altura)
          const height = (duracion / 30) * 50;
  
          return (
            <div
              key={reserva.id}
              className={`reserva ${estiloReserva}`}
              style={{
                position: 'absolute',
                left: '0',
                top: `${topPosition}px`, // Posición superior basada en los minutos
                height: `${height}px`, // Altura basada en la duración
                zIndex: 1,
              }}
            >
              {`${reserva.nombre} - ${hora}`}
            </div>
          );
        }
      }
      return null;
    });
  };
  
  // Función para calcular las propiedades del grid
  const calcularGridProperties = () => {
    const totalMinutes = (rangoHorarioGlobal.endHour - rangoHorarioGlobal.startHour) * 60; // Minutos totales en el rango horario
    const gridHeight = 1350; // Altura total del grid en px, ajusta esto según tu diseño
    return { gridHeight, totalMinutes, startHour: rangoHorarioGlobal.startHour };
  };
  

  
  

  return (
    <div className="calendario">
      <div className="calendario-navigation">
        <button onClick={() => setFechaInicial(prev => addDays(prev, -7))}>
          Semana Anterior
        </button>
        <button onClick={() => setFechaInicial(prev => addDays(prev, 7))}>
          Semana Siguiente
        </button>
      </div>

      <div className="calendario-header">
        {fechasSemana.map((fecha, index) => (
          <div key={index} className="calendario-dia">
            {format(fecha, 'EEE d MMM', { locale: es })}
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
                    {renderReservas(fecha)} {/* Renderiza las reservas sobre las horas */}
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
