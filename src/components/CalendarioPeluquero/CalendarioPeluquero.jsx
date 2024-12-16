import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { addDays, startOfWeek, format, isSameDay } from 'date-fns';
import { serverTimestamp } from 'firebase/firestore'; // Importa serverTimestamp
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
            <p className='text'>{`${reserva.nombre} ${reserva.apellido} - ${hora} - ${reserva.servicio} - ${reserva.status}`}</p>
          </div>
        );
      });
    });
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

  const calcularGridProperties = () => {
    const totalMinutes = (rangoHorarioGlobal.endHour - rangoHorarioGlobal.startHour) * 60;
    const gridHeight = (totalMinutes / 30) * 70;
    return { gridHeight, totalMinutes, startHour: rangoHorarioGlobal.startHour };
  };

  const editarDuracionYHoraTurno = async (reservaId, nuevaDuracion, nuevaHoraInicio) => {
    try {
      const reservaRef = doc(db, 'reservas', reservaId);
  
      // Sobrescribir los valores de "hora" y "horaInicio"
      await updateDoc(reservaRef, { 
        duracion: nuevaDuracion,
        hora: nuevaHoraInicio, // Reemplaza la hora original
        horaInicio: nuevaHoraInicio // También actualiza el campo horaInicio
      });
  
      // Actualizar el estado local para reflejar los cambios
      setReservas((prevReservas) =>
        prevReservas.map((reserva) =>
          reserva.id === reservaId 
            ? { ...reserva, duracion: nuevaDuracion, hora: nuevaHoraInicio, horaInicio: nuevaHoraInicio }
            : reserva
        )
      );
  
      Swal.fire({
        title: 'Datos actualizados',
        text: `La duración se ha actualizado a ${nuevaDuracion} minutos y la hora de inicio a ${nuevaHoraInicio}.`,
        icon: 'success',
        background: 'black',
        color: 'white',
      });
    } catch (error) {
      console.error('Error actualizando la duración y hora de inicio:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo actualizar la duración y hora de inicio.',
        icon: 'error',
        background: 'black',
        color: 'white',
      });
    }
  };

  // Función para notificar el cambio del horario
const notificarCambioHorario = (reserva) => {
  const { fecha, horaInicio, telefono } = reserva;

  if (!telefono) {
    alert('No se encontró el número de teléfono para este cliente.');
    return;
  }

  // Crear mensaje para WhatsApp
  const fechaTurno = new Date(fecha);
  const fechaLocal = new Date(fechaTurno.getTime() + fechaTurno.getTimezoneOffset() * 60000);
  const mensaje = `Hola ${reserva.nombre}, te informamos que tu turno ha sido modificado. 
Nueva fecha y hora: ${fechaLocal.toLocaleDateString()} a las ${horaInicio}. 
Duración estimada: ${reserva.duracion} minutos. Gracias por tu comprensión.`;

  const whatsappURL = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  window.open(whatsappURL, '_blank'); // Abrir WhatsApp
};

const finalizarTurno = async (reserva) => {
  try {
    // Obtener la fecha de la reserva
    const fecha = new Date(reserva.fecha);
    const anio = fecha.getFullYear().toString();
    const mes = fecha.toLocaleString('es-ES', { month: 'long' }).toLowerCase(); // Nombre del mes en minúsculas
    const dia = fecha.getDate().toString().padStart(2, '0'); // Día del mes con dos dígitos

    // Crear la referencia a la estructura en "control"
    const controlRef = doc(db, 'control', anio.toString());

    // Leer los datos actuales de "control" para ese año
    const controlSnap = await getDoc(controlRef);
    const controlData = controlSnap.exists() ? controlSnap.data() : {};

    // Crear la estructura si no existe
    if (!controlData[mes]) {
      controlData[mes] = {};
    }
    if (!controlData[mes][dia]) {
      controlData[mes][dia] = { servicios: {} };
    }

    // Agregar el turno a los servicios del día correspondiente
    controlData[mes][dia].servicios[reserva.id] = {
      fecha: reserva.fecha,
      servicio: reserva.servicio || 'Desconocido',
      precio: reserva.costoServicio || 0.0,
    };

    // Guardar los datos actualizados en Firebase con setDoc
    await setDoc(controlRef, controlData, { merge: true });

    console.log('Turno actualizado a finalizado y registrado en la colección control.');
  } catch (error) {
    console.error('Error al finalizar el turno:', error);
  }
};


  const manejarClickReserva = (reserva) => {
    const { status, id, duracion, horaInicio, fecha, telefono } = reserva;
  
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
        footer: `
          <button id="editarDuracionBtn" class="btn btn-info">Editar duración y hora de inicio</button>
          <button id="notificarCambioBtn" class="btn btn-cambio">Notificar Cambio</button>
        `,
        background: 'black',
        color: 'white',
        didRender: () => {
          // Agregar evento para el botón de Editar
          document.getElementById('editarDuracionBtn')?.addEventListener('click', () => {
            Swal.close(); // Cerrar el Swal actual
            editarDuracionYHora(reserva); // Llama a la función para editar duración y hora
          });
  
          // Agregar evento para el botón de Notificar Cambio
          document.getElementById('notificarCambioBtn')?.addEventListener('click', () => {
            Swal.close(); // Cerrar el Swal actual
            notificarCambioHorario(reserva); // Llama a la función para notificar cambio
          });
        },
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
  
      // Lógica para manejar el clic en "Editar Duración y Hora de Inicio"
      document.getElementById("editarDuracionBtn")?.addEventListener("click", () => {
        // Abrir un Swal para editar la duración y la hora de inicio
        Swal.fire({
          title: 'Editar duración y hora de inicio',
          html: `
          <div>
            <label for="duracionInput" class="label-edit">Nueva duración (en minutos):</label>
            <input id="duracionInput" class="swal2-input" type="number" value="${reserva.duracion}" min="1" max="180" step="1">
          </div>
          <div>
            <label for="horaInicioInput">Nueva hora de inicio:</label>
            <input id="horaInicioInput" class="swal2-input" type="time" value="${reserva.hora || reserva.horaInicio}">
          </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'Guardar Cambios',
          background: 'black',
          color: 'white',
          preConfirm: () => {
            const nuevaDuracion = parseInt(document.getElementById('duracionInput').value, 10);
            const nuevaHoraInicio = document.getElementById('horaInicioInput').value;
        
            if (!isNaN(nuevaDuracion) && nuevaDuracion > 0 && nuevaHoraInicio) {
              return { nuevaDuracion, nuevaHoraInicio };
            } else {
              Swal.showValidationMessage('Por favor, ingresa valores válidos');
            }
          }
        }).then((result) => {
          if (result.isConfirmed) {
            const { nuevaDuracion, nuevaHoraInicio } = result.value;
            // Llamar a la función para actualizar Firebase
            editarDuracionYHoraTurno(reserva.id, nuevaDuracion, nuevaHoraInicio);
          }
        });
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
            finalizarTurno(reserva); // Llama a la función para finalizar el turno
    
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
                  title: 'Turno agendado para la próxima semana',
                  icon: 'success',
                  background: 'black',
                  color: 'white',
                });
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
          <button className='button-dias button-oculto' onClick={() => {
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
