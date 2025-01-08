import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, getDocs, updateDoc, setDoc, where } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { db } from '../../firebaseConfig'; // Asegúrate de tener configurado Firebase

const CalendarioAdmin = () => {
  const [peluqueros, setPeluqueros] = useState([]);
  const [peluqueroSeleccionado, setPeluqueroSeleccionado] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [fechasSemana, setFechasSemana] = useState([]);
  const [modoVista, setModoVista] = useState(1); // 1: día, 3: tres días, 7: semana completa
  const [fechaInicial, setFechaInicial] = useState(new Date());

  useEffect(() => {
    const cargarPeluqueros = async () => {
      const peluquerosQuery = query(collection(db, 'peluqueros'));
      const peluquerosSnapshot = await getDocs(peluquerosQuery);
      const peluquerosData = peluquerosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPeluqueros(peluquerosData);
    };

    cargarPeluqueros();
  }, []);

  useEffect(() => {
    if (peluqueroSeleccionado) {
      cargarReservasPeluquero(peluqueroSeleccionado.id);
    }
  }, [peluqueroSeleccionado, fechaInicial, modoVista]);

  const cargarReservasPeluquero = async (peluqueroId) => {
    const reservasQuery = query(collection(db, 'reservas'), where('uidPeluquero', '==', peluqueroId));
    const reservasSnapshot = await getDocs(reservasQuery);
    const reservasData = reservasSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setReservas(reservasData);
    calcularFechasSemana();
  };

  const calcularFechasSemana = () => {
    const dias = [];
    for (let i = 0; i < modoVista; i++) {
      dias.push(new Date(fechaInicial.getTime() + i * 24 * 60 * 60 * 1000));
    }
    setFechasSemana(dias);
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
                 confirmButtonText: 'Reservar proximo turno',
                 cancelButtonText: 'No deseo reservar',
                 background: 'black',
                 color: 'white',
               }).then((result) => {
                 if (result.isConfirmed) {
                   // Redirige a la sección /reservamanual
                   window.location.href = '/reservamanual';
                 }
               });
               
             }
           });
       }
     };

  const renderHorasDelDia = (horarios, fecha) => {
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

  const renderReservas = (fecha) => {
    const reservasDelDia = reservas.filter(
      (reserva) => new Date(reserva.fecha).toDateString() === fecha.toDateString()
    );
  
    const horas = renderHorasDelDia();
  
    return (
      <>
        {horas}
        {reservasDelDia.map((reserva, index) => (
          <div
            key={index}
            className="reserva"
            onClick={() => manejarClickReserva(reserva)}
            style={{
              top: `${(new Date(reserva.horaInicio).getHours() - 8) * 70}px`,
            }}
          >
            <span>{reserva.nombre}</span>
            <span>{reserva.servicio}</span>
          </div>
        ))}
      </>
    );
  };
  

  return (
    <div className="calendario">
      <div className="calendario-navigation">
        <select
          value={peluqueroSeleccionado?.id || ''}
          onChange={(e) =>
            setPeluqueroSeleccionado(
              peluqueros.find((p) => p.id === e.target.value)
            )
          }
        >
          <option value="">Seleccione un peluquero</option>
          {peluqueros.map((peluquero) => (
            <option key={peluquero.id} value={peluquero.id}>
              {peluquero.nombre}
            </option>
          ))}
        </select>
      </div>

      {peluqueroSeleccionado ? (
        <div>
          <div className="calendario-header">
            {fechasSemana.map((fecha, index) => (
              <div
                key={index}
                className={`calendario-dia ${
                  modoVista === 1
                    ? 'vista-dia'
                    : modoVista === 3
                    ? 'vista-tres'
                    : 'vista-semana'
                }`}
              >
                {format(fecha, 'EEE d MMM', { locale: es })}
              </div>
            ))}
          </div>

          <div className="calendario-grid">
            {fechasSemana.map((fecha, diaIndex) => (
              <div key={diaIndex} className="calendario-column">
                {renderReservas(fecha)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="calendario-placeholder">
          Seleccione un peluquero para visualizar su agenda.
        </div>
      )}
    </div>
  );
};

export default CalendarioAdmin;
