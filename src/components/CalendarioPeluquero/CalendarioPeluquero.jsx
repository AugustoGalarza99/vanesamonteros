import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { addDays, startOfWeek, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { limpiarReservasAntiguas } from '../../reservaService'
import Swal from 'sweetalert2';
import './CalendarioPeluquero.css';

const CalendarioPeluquero = ({ uidPeluquero }) => {
  const [diasTrabajo, setDiasTrabajo] = useState([]);
  const [horariosTrabajo, setHorariosTrabajo] = useState({});
  const [reservas, setReservas] = useState([]);
  const [fechaInicial, setFechaInicial] = useState(new Date());
  const [fechasSemana, setFechasSemana] = useState([]);
  const [rangoHorarioGlobal, setRangoHorarioGlobal] = useState({ startHour: 8, endHour: 21 });
  const [modoVista, setModoVista] = useState(1); // Por defecto, 7 días (semana)

  

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
    const fechas = [];

    if (modoVista === 7) {
      // Ver 7 días (Semana completa)
      const inicioSemana = startOfWeek(fechaInicial, { weekStartsOn: 1 }); // Inicio de la semana
      for (let i = 0; i < 7; i++) {
        fechas.push(addDays(inicioSemana, i));
      }
    } else {
      // Ver 1 día o 3 días (Comienza desde el día actual)
      for (let i = 0; i < modoVista; i++) {
        fechas.push(addDays(fechaInicial, i)); // Empezamos desde la fechaInicial (que sería el día actual)
      }
    }

    setFechasSemana(fechas);
  };

  useEffect(() => {
    fetchHorariosPeluquero();
    fetchReservasPeluquero();
    calcularFechasSemana(); // Recalcular las fechas según el modo de vista
  }, [uidPeluquero, fechaInicial, modoVista]); 

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
    Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Estás seguro de que deseas cancelar esta reserva?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No, mantener',
        background: 'black',
        color: 'white'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const reservaId = reserva.id;
                const reservaRef = doc(db, 'reservas', reservaId);

                await deleteDoc(reservaRef);

                fetchReservasPeluquero();

                Swal.fire({
                    title: 'Turno Cancelado',
                    text: 'El turno ha sido cancelado y eliminado.',
                    icon: 'success',
                    background: 'black',
                    color: 'white',
                    confirmButtonText: 'Ok'
                });
            } catch (error) {
                console.error('Error al cancelar el turno:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Hubo un problema al cancelar el turno.',
                    icon: 'error',
                    background: 'black',
                    color: 'white',
                    confirmButtonText: 'Ok'
                });
            }
        }
    });
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
              const isFirstTurnToday = verificarPrimerTurnoDelDia();
              if (isFirstTurnToday) {
                  limpiarReservasAntiguas(); 
              }
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
              Swal.fire({
                  title: 'Turno Finalizado',
                  text: '¿Deseas agendar este turno para la próxima semana?',
                  icon: 'success',
                  showCancelButton: true,
                  confirmButtonText: 'Reservar para próxima semana',
                  cancelButtonText: 'No deseo reservar'
              }).then((result) => {
                  if (result.isConfirmed) {
                      duplicarReservaParaLaProximaSemana(reserva);
                      Swal.fire('Turno agendado para la próxima semana', '', 'success');
                  }
              });
          }
      });
  }
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
        const { hora, status, duracion, recurrente, frecuencia } = reserva;
        const horaDate = new Date(`1970-01-01T${hora}:00`);
        const reservaFecha = new Date(reserva.fecha);

        let fechasMostrar = [reservaFecha];
        
        if (recurrente && frecuencia === 'semanal') {
            // Agregar una copia del turno cada semana dentro de un periodo deseado
            const startDate = new Date(fechaInicial);
            const endDate = addDays(startDate, modoVista); // Ajusta para el periodo visible
            
            fechasMostrar = [];
            let iterFecha = new Date(reservaFecha);
            while (iterFecha <= endDate) {
                if (iterFecha >= startDate) fechasMostrar.push(new Date(iterFecha));
                iterFecha = addDays(iterFecha, 7); // Incremento semanal
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

            const totalReservaMinutes = (horaDate.getHours() - startHour) * 60 + horaDate.getMinutes();
            const topPosition = (totalReservaMinutes * (gridHeight / totalMinutes));
            const height = (duracion / 30) * 50;

            return (
                <div
                    key={`${reserva.id}-${fechaMostrar}`} // Identificador único
                    className={`reserva ${estiloReserva} ${modoVista === 1 ? 'vista-dia' : modoVista === 3 ? 'vista-tres' : 'vista-semana'}`}
                    style={{
                        position: 'absolute',
                        left: '0',
                        top: `${topPosition}px`,
                        height: `${height}px`,
                        zIndex: 1,
                    }}
                    onClick={() => manejarClickReserva(reserva)} 
                >
                    <p className='text'>{`${reserva.nombre} ${reserva.apellido} - ${hora} - ${reserva.servicio} - ${reserva.status}`}</p>
                </div>
            )
        });
    }).flat(); // Asegura que las fechas repetidas se manejen como elementos individuales
};


  const calcularGridProperties = () => {
    const totalMinutes = (rangoHorarioGlobal.endHour - rangoHorarioGlobal.startHour) * 60;
    const gridHeight = (totalMinutes / 30) * 50;
    return { gridHeight, totalMinutes, startHour: rangoHorarioGlobal.startHour };
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
