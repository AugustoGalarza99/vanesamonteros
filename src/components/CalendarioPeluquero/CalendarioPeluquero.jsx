import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { addDays, startOfWeek, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';
import './CalendarioPeluquero.css';

const CalendarioPeluquero = ({ uidPeluquero }) => {
  const [diasTrabajo, setDiasTrabajo] = useState([]);
  const [horariosTrabajo, setHorariosTrabajo] = useState({});
  const [reservas, setReservas] = useState([]);  // Almacenamiento local de reservas
  const [fechaInicial, setFechaInicial] = useState(new Date());
  const [fechasSemana, setFechasSemana] = useState([]);
  const [rangoHorarioGlobal, setRangoHorarioGlobal] = useState({ startHour: 8, endHour: 21 });
  const [modoVista, setModoVista] = useState(1); // Por defecto, 7 días (semana)

  // Carga los horarios del peluquero
  const fetchHorariosPeluquero = async () => {
    try {
      if (!uidPeluquero) {
        console.error('uidPeluquero está indefinido');
        return;
      }

      console.log('Intentando cargar horarios desde Firebase...');
      const docRef = doc(db, 'horarios', uidPeluquero);
      const docSnap = await getDoc(docRef);
      console.log('Consulta a Firebase: horarios');

      if (docSnap.exists()) {
        const horarioData = docSnap.data();
        console.log('Horarios obtenidos:', horarioData);
        
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
        console.log(`Calculando rango global para ${dia}:`, { start1, end1, start2, end2 });

        startHourGlobal = Math.min(startHourGlobal, parseInt(start1));
        endHourGlobal = Math.max(endHourGlobal, parseInt(end1));

        if (start2 && end2) {
          startHourGlobal = Math.min(startHourGlobal, parseInt(start2));
          endHourGlobal = Math.max(endHourGlobal, parseInt(end2));
        }
      }
    });

    setRangoHorarioGlobal({ startHour: startHourGlobal, endHour: endHourGlobal });
    console.log('Rango horario global calculado:', { startHourGlobal, endHourGlobal });
  };

  // Carga las reservas una sola vez y las almacena en el estado
  const fetchReservasPeluquero = async () => {
    try {
      if (!uidPeluquero) {
        console.error('uidPeluquero está indefinido');
        return;
      }

      console.log('Intentando cargar reservas desde Firebase...');
      const reservasRef = collection(db, 'reservas');
      const q = query(reservasRef, where('uidPeluquero', '==', uidPeluquero));
      const querySnapshot = await getDocs(q);
      console.log('Consulta a Firebase: reservas');

      if (!querySnapshot.empty) {
        const reservasData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReservas(reservasData);
        console.log('Reservas obtenidas:', reservasData);
      } else {
        console.log('No se encontraron reservas para este peluquero');
      }
    } catch (error) {
      console.error('Error obteniendo las reservas:', error);
    }
  };

  // Calcular las fechas a mostrar (1 día, 3 días o 7 días)
  const calcularFechasSemana = () => {
    const fechas = [];
    console.log('Calculando fechas para la vista:', modoVista);

    if (modoVista === 7) {
      const inicioSemana = startOfWeek(fechaInicial, { weekStartsOn: 1 });
      for (let i = 0; i < 7; i++) {
        fechas.push(addDays(inicioSemana, i));
      }
    } else {
      for (let i = 0; i < modoVista; i++) {
        fechas.push(addDays(fechaInicial, i));
      }
    }

    setFechasSemana(fechas);
    console.log('Fechas de la semana calculadas:', fechas);
  };

  // useEffect para cargar los datos al inicio
  useEffect(() => {
    console.log('Iniciando carga de horarios y reservas para el peluquero con UID:', uidPeluquero);
    fetchHorariosPeluquero();
    fetchReservasPeluquero();
    calcularFechasSemana();
  }, [uidPeluquero]);

  // useEffect para recalcular las fechas al cambiar modo de vista o fecha inicial
  useEffect(() => {
    console.log('Recalculando fechas semana al cambiar modo de vista o fecha inicial');
    calcularFechasSemana();
  }, [modoVista, fechaInicial]); 

  // Renderizado de horas del día, sin cambios
  const renderHorasDelDia = (horarioDia) => {
    const horas = [];
    const { start1, end1, start2, end2 } = horarioDia;

    let currentHour = rangoHorarioGlobal.startHour;
    let currentMinute = 0;

    console.log('Renderizando horas del día:', { horarioDia });

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

  // Renderizar reservas desde los datos locales
  const renderReservas = (diaFecha) => {
    const { gridHeight, totalMinutes, startHour } = calcularGridProperties();
    console.log('Renderizando reservas para el día:', diaFecha);

    return reservas.map((reserva) => {
      const { hora, status, duracion, recurrente, frecuencia } = reserva;
      const horaDate = new Date(`1970-01-01T${hora}:00`);
      const reservaFecha = new Date(reserva.fecha);

      let fechasMostrar = [reservaFecha];

      if (recurrente && frecuencia === 'semanal') {
        const startDate = new Date(fechaInicial);
        const endDate = addDays(startDate, modoVista);

        fechasMostrar = [];
        let iterFecha = new Date(reservaFecha);
        while (iterFecha <= endDate) {
          if (iterFecha >= startDate) fechasMostrar.push(new Date(iterFecha));
          iterFecha = addDays(iterFecha, 7);
        }
      }
      
      return fechasMostrar.map((fechaMostrar) => {
        const reservaFechaLocal = new Date(fechaMostrar.getTime() + fechaMostrar.getTimezoneOffset() * 60000);
        const esMismaFecha = isSameDay(reservaFechaLocal, diaFecha);

        if (!esMismaFecha) return null;

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

        const totalStartMinutes = (horaDate.getHours() - startHour) * 60 + horaDate.getMinutes();
        const topPosition = (totalStartMinutes * gridHeight) / totalMinutes;
        const height = (parseInt(duracion) * gridHeight) / totalMinutes;

        console.log(`Reserva ${reserva.id} para ${fechaMostrar.toISOString()}:`, {
          cliente: reserva.nombreCliente,
          hora,
          status,
          topPosition,
          height,
        });

        return (
          <div
            key={`${fechaMostrar.toISOString()}-${reserva.id}`}
            className={`reserva ${estiloReserva}`}
            style={{ top: `${topPosition}px`, height: `${height}px` }}
            onClick={() => manejarClickReserva(reserva)} 
          >
            {reserva.nombreCliente} - {hora}
          </div>
        );
      });
    });
  };

  const calcularGridProperties = () => {
    const totalMinutes = (rangoHorarioGlobal.endHour - rangoHorarioGlobal.startHour) * 60;
    const gridHeight = (totalMinutes / 30) * 50;
    return { gridHeight, totalMinutes, startHour: rangoHorarioGlobal.startHour };
  };
  // Nueva función para verificar si es el primer turno del día
const verificarPrimerTurnoDelDia = async () => {
  const now = new Date();
  const hoy = now.toISOString().split('T')[0]; // Fecha actual en formato "YYYY-MM-DD"

  // Buscar turnos con estado "en proceso" para el día de hoy
  const reservasRef = collection(db, 'reservas');
  const q = query(reservasRef, where('status', '==', 'en proceso'), where('fecha', '==', hoy));
  const querySnapshot = await getDocs(q);

  // Si no hay turnos en proceso hoy, es el primer turno del día
  return querySnapshot.empty;
};
// Función para duplicar la reserva para la próxima semana
const duplicarReservaParaLaProximaSemana = async (reserva) => {
  try {
      const nuevaFecha = addDays(new Date(reserva.fecha), 7); // Nueva fecha una semana después
      const nuevaReserva = {
          ...reserva,
          fecha: nuevaFecha.toISOString().split('T')[0], // Formateamos la fecha
          status: 'Pendiente', // Iniciar con el estado 'Pendiente'
      };
      delete nuevaReserva.id; // Eliminamos el ID para no sobrescribir la reserva existente

      const reservasRef = collection(db, 'reservas');
      await addDoc(reservasRef, nuevaReserva); // Guardar la nueva reserva en la base de datos
      fetchReservasPeluquero(); // Refrescar reservas en pantalla
  } catch (error) {
      console.error('Error al duplicar la reserva:', error);
      Swal.fire('Error', 'No se pudo agendar el turno para la próxima semana', 'error');
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
            background: 'black',
            color: 'white',          
        }).then((result) => {
            if (result.isConfirmed) {
                actualizarEstadoTurno(id, 'en proceso'); 
                Swal.fire({
                  title: 'Turno Iniciado',
                  icon: 'success',
                  background: 'black',
                  color: 'white',
                });
                const isFirstTurnToday = verificarPrimerTurnoDelDia();
                if (isFirstTurnToday) {
                    limpiarReservasAntiguas(); 
                }
            } else if (result.isDenied) {
                handleRemindTurn(reserva); 
                Swal.fire({
                  title: 'Recordatorio enviado',
                  icon: 'success',
                  background: 'black',
                  color: 'white',
                });
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
            background: 'black',
            color: 'white',
        }).then((result) => {
            if (result.isConfirmed) {
                actualizarEstadoTurno(id, 'finalizado'); 
                Swal.fire({
                    title: 'Turno Finalizado',
                    text: '¿Deseas agendar este turno para la próxima semana?',
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonText: 'Reservar para próxima semana',
                    cancelButtonText: 'No deseo reservar',
                    background: 'black',
                    color: 'white',
                }).then((result) => {
                    if (result.isConfirmed) {
                        duplicarReservaParaLaProximaSemana(reserva);
                        Swal.fire({
                          title:'Turno agendado para la próxima semana',
                          icon:'success',
                          background: 'black',
                          color: 'white',});
                    }
                });
            }
        });
    }
  };

  return (
    <div className="calendario">
      <div className='div-contenedor-calendar'>
        <div className="calendario-navigation">
          <button className='button-semana' onClick={() => setFechaInicial(prev => addDays(prev, -modoVista))}>
            {modoVista === 1 ? '<' : '<'}
          </button>
          <button className='button-semana' onClick={() => setFechaInicial(prev => addDays(prev, modoVista))}>
            {modoVista === 1 ? '>' : '>'}
          </button>
        </div>
      
        <div className='calendario-navigation'>
          <button className='button-dias' onClick={() => {
            setModoVista(1);
            setFechaInicial(new Date()); // Cuando se elige ver un solo día, el día actual será la fecha inicial
            }}>Hoy
          </button>
          <button className='button-dias' onClick={() => {
            setModoVista(3);
            setFechaInicial(new Date()); // Cuando se elige ver 3 días, empezamos desde el día actual
            }}>3 Días
          </button>
          <button className='button-dias' onClick={() => {
            setModoVista(7);
            setFechaInicial(startOfWeek(new Date(), { weekStartsOn: 1 })); // Cuando se elige ver la semana, se inicia desde el comienzo de la semana
          }}>Semana
          </button>
        </div>
      </div>
      

      <div className="calendario-header">
  {fechasSemana.map((fecha, index) => (
    <div
      key={index}
      className={`div-dia ${modoVista === 1 ? 'vista-dia' : modoVista === 3 ? 'vista-tres' : 'vista-semana'}`}
    >
      <div className="calendario-dia">
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
