import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Select, InputLabel, FormControl, Button, TableContainer, Paper } from "@mui/material";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import "./Reservas.css";

const Reservas = ({ uidPeluquero }) => {
  const [rolUsuario, setRolUsuario] = useState("peluquero");
  const [peluqueros, setPeluqueros] = useState([]);
  const [peluqueroSeleccionado, setPeluqueroSeleccionado] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [reservasFiltradas, setReservasFiltradas] = useState([]);
  const [reservasLocal, setReservasLocal] = useState([]);

  const obtenerNombreProfesional = async (uid) => {
    console.log(`Consultando nombre del profesional con UID: ${uid}`);
    try {
      const peluqueroDoc = await getDoc(doc(db, "peluqueros", uid));
      if (peluqueroDoc.exists()) {
        const nombreCompleto = peluqueroDoc.data().nombre || "";
        return nombreCompleto.split(" (")[0];
      }
      return "Profesional no encontrado";
    } catch (error) {
      console.error(`Error obteniendo el nombre del profesional con UID ${uid}:`, error);
      return "Error obteniendo nombre";
    }
  };

  useEffect(() => {
    const cargarUsuario = async () => {
      console.log("Cargando usuario...");
      try {
        if (!uidPeluquero) {
          console.error("UID de peluquero no proporcionado.");
          return;
        }

        const peluqueroDoc = await getDoc(doc(db, "peluqueros", uidPeluquero));
        console.log("Resultado de consulta de peluquero:", peluqueroDoc.exists());
        if (peluqueroDoc.exists()) {
          setRolUsuario("peluquero");
          setPeluqueroSeleccionado(uidPeluquero);
          return;
        }

        const adminDoc = await getDoc(doc(db, "administradores", uidPeluquero));
        console.log("Resultado de consulta de administrador:", adminDoc.exists());
        if (adminDoc.exists()) {
          setRolUsuario("administrador");
          const peluquerosSnapshot = await getDocs(collection(db, "peluqueros"));
          const listaPeluqueros = peluquerosSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log("Lista de peluqueros cargada:", listaPeluqueros);
          setPeluqueros(listaPeluqueros);
          setPeluqueroSeleccionado("admin");
        } else {
          console.error("Usuario no encontrado en peluqueros ni administradores.");
        }
      } catch (error) {
        console.error("Error cargando usuario:", error);
      }
    };

    cargarUsuario();
  }, [uidPeluquero]);

  useEffect(() => {
    const cargarReservas = async () => {
      if (reservasLocal.length > 0) {
        console.log("Usando reservas almacenadas localmente.");
        setReservasFiltradas(reservasLocal);
        return;
      }

      console.log("Cargando reservas desde Firebase...");
      try {
        const snapshot = await getDocs(collection(db, "reservas"));
        console.log(`Número de reservas obtenidas: ${snapshot.size}`);

        const reservasCargadas = await Promise.all(
          snapshot.docs.map(async (docReserva) => {
            const reserva = docReserva.data();

            // Calcular hora de finalización
            const [horaInicio, minutosInicio] = reserva.hora.split(":").map(Number);
            const duracion = reserva.duracion || 0;
            const horaFin = new Date();
            horaFin.setHours(horaInicio, minutosInicio + duracion);
            const horaFinTexto = horaFin.toTimeString().split(" ")[0].substring(0, 5);

            // Obtener nombre del profesional
            const nombrePeluquero = await obtenerNombreProfesional(reserva.uidPeluquero);

            return {
              ...reserva,
              id: docReserva.id,
              horaFin: horaFinTexto,
              nombrePeluquero,
            };
          })
        );

        reservasCargadas.sort((a, b) => {
          const fechaA = new Date(`${a.fecha}T${a.hora}`);
          const fechaB = new Date(`${b.fecha}T${b.hora}`);
          return fechaA - fechaB; // Orden ascendente
        });

        console.log("Reservas cargadas y ordenadas:", reservasCargadas);
        setReservas(reservasCargadas);
        setReservasLocal(reservasCargadas);
        setReservasFiltradas(reservasCargadas);
      } catch (error) {
        console.error("Error cargando reservas:", error);
      }
    };

    if (peluqueroSeleccionado) {
      cargarReservas();
    }
  }, [peluqueroSeleccionado, reservasLocal]);

  useEffect(() => {
    console.log("Filtrando reservas...");
    const filtrarReservas = () => {
      if (peluqueroSeleccionado === "admin" || !peluqueroSeleccionado) {
        setReservasFiltradas(reservasLocal);
      } else {
        const reservasFiltradas = reservasLocal.filter(
          (reserva) => reserva.uidPeluquero === peluqueroSeleccionado
        );
        console.log(`Reservas filtradas para peluquero ${peluqueroSeleccionado}:`, reservasFiltradas);
        setReservasFiltradas(reservasFiltradas);
      }
    };

    filtrarReservas();
  }, [peluqueroSeleccionado, reservasLocal]);
  const handleRemindTurn = (reserva) => {
    const fechaTurno = new Date(reserva.fecha);
    const fechaLocal = new Date(fechaTurno.getTime() + (fechaTurno.getTimezoneOffset() * 60000)); 
  
    const message = `Hola! 👋
Te esperamos para tu turno el 
🗓 ${fechaLocal.toLocaleDateString()} a las ${reserva.hora} en Monteros Vanesa Espacio. 

En caso de no poder asistir por favor avísanos 🙌🏽
¡Gracias! ❤`;

    const phoneNumber = reserva.telefono; 

    if (phoneNumber) {
        // Detecta si la aplicación de WhatsApp está instalada
        const whatsappBaseURL = navigator.userAgent.includes('Windows') || navigator.userAgent.includes('Mac') 
            ? 'https://web.whatsapp.com' // Usa WhatsApp Web si estás en PC
            : 'https://api.whatsapp.com'; // Usa WhatsApp App si no se detecta escritorio

        const whatsappURL = `${whatsappBaseURL}/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, '_blank'); 
    } else {
        Swal.fire({
            title: 'Error',
            text: 'No se encontró el número de teléfono para el cliente',
            icon: 'error',
            background: 'black',
            color: 'white',
            confirmButtonText: 'Ok'
        });
    }
};
const verificarPrimerTurnoDelDia = async () => {
  const now = new Date();
  const hoy = now.toISOString().split('T')[0]; // Fecha actual en formato "YYYY-MM-DD"  
  const reservasRef = collection(db, 'reservas');
  const q = query(reservasRef, where('status', '==', 'en proceso'), where('fecha', '==', hoy));
  const querySnapshot = await getDocs(q);  
  return querySnapshot.empty;
};
const finalizarTurno = async (reserva) => {
  try {
    // Verificar si el uid está presente en la reserva
    if (!reserva.uidPeluquero) {
      throw new Error('El uid del peluquero no está definido en la reserva.');
    }

    // Obtener la fecha de la reserva
    const fecha = new Date(reserva.fecha);
    const anio = fecha.getFullYear().toString();
    const mes = fecha.toLocaleString('es-ES', { month: 'long' }).toLowerCase(); // Nombre del mes en minúsculas
    const dia = fecha.getDate().toString().padStart(2, '0'); // Día del mes con dos dígitos

    // Obtener el uid del peluquero desde la reserva
    const uidPeluquero = reserva.uidPeluquero; // Asumimos que el uid está en la reserva

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
      uid: uidPeluquero, // Agregar el uid del peluquero
    };

    // Guardar los datos actualizados en Firebase con setDoc
    await setDoc(controlRef, controlData, { merge: true });

    console.log('Turno actualizado a finalizado y registrado en la colección control.');
  } catch (error) {
    console.error('Error al finalizar el turno:', error.message);
  }
};
const editarDuracionYHoraTurno = async (reservaId, nuevaDuracion, nuevaHoraInicio) => {
  try {
    const reservaRef = doc(db, "reservas", reservaId);
    await updateDoc(reservaRef, {
      duracion: nuevaDuracion,
      hora: nuevaHoraInicio,
    });

    setReservasLocal((prevReservas) =>
      prevReservas.map((reserva) =>
        reserva.id === reservaId
          ? { ...reserva, duracion: nuevaDuracion, hora: nuevaHoraInicio }
          : reserva
      )
    );

    Swal.fire({
      title: "Horario Actualizado",
      text: "La duración y hora de inicio se han actualizado correctamente.",
      icon: "success",
      background: "black",
      color: "white",
    });
  } catch (error) {
    console.error("Error actualizando el horario:", error);
    Swal.fire({
      title: "Error",
      text: "No se pudo actualizar el horario.",
      icon: "error",
      background: "black",
      color: "white",
    });
  }
};

const notificarCambioHorario = (reserva) => {
  const { fecha, horaInicio, telefono } = reserva;

  if (!telefono) {
    Swal.fire({
        title: 'Error',
        text: 'No se encontró el número de teléfono para este cliente',
        icon: 'error',
        background: 'black',
        color: 'white',
        confirmButtonText: 'Ok'
    });
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
const actualizarEstadoTurno = async (reservaId, nuevoEstado) => {
  try {
    const reservaRef = doc(db, "reservas", reservaId);
    await updateDoc(reservaRef, { status: nuevoEstado });

    setReservasLocal((prevReservas) =>
      prevReservas.map((reserva) =>
        reserva.id === reservaId ? { ...reserva, status: nuevoEstado } : reserva
      )
    );
  } catch (error) {
    console.error("Error actualizando el estado del turno:", error);
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

              // Actualizar estado local
              setReservasFiltradas((prevReservas) =>
                  prevReservas.filter((item) => item.id !== reservaId)
              );

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
    const { status, id, duracion, horaInicio, fecha, telefono } = reserva;
  
    if (status === 'Sin realizar') {
      Swal.fire({
        title: 'Turno sin realizar',
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

  return (
    <div className="reservas-container">
      <div>
      <h3>Gestión de Reservas</h3>
      </div>

      {rolUsuario === "administrador" && peluqueros.length > 0 && (
        <FormControl fullWidth>
          <InputLabel id="select-peluquero-label"></InputLabel>
          <Select
            labelId="select-peluquero-label"
            value={peluqueroSeleccionado}
            onChange={e => setPeluqueroSeleccionado(e.target.value)}
          >
            <MenuItem value="admin">Todos los profesionales</MenuItem>
            {peluqueros.map(peluquero => (
              <MenuItem key={peluquero.id} value={peluquero.uid}>
                {peluquero.nombre.split(" (")[0]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    <TableContainer component={Paper}>
      <Table className="custom-table">
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Hora</TableCell>
            <TableCell>Hora Fin</TableCell>
            <TableCell>Cliente</TableCell>
            <TableCell>Servicio</TableCell>
            <TableCell>Profesional</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reservasFiltradas
            .filter((reserva) => reserva.status !== "finalizado") // Filtrar turnos finalizados
            .map((reserva) => (
              <TableRow key={reserva.id}>
                <TableCell>{reserva.fecha}</TableCell>
                <TableCell>{reserva.hora}</TableCell>
                <TableCell>{reserva.horaFin}</TableCell>
                <TableCell>{`${reserva.nombre} ${reserva.apellido}`}</TableCell>
                <TableCell>{reserva.servicio}</TableCell>
                <TableCell>{reserva.nombrePeluquero}</TableCell>
                <TableCell>{reserva.status}</TableCell> 
                <TableCell>
                  <Button
                    className="button-acciones"
                    variant="outlined"                    
                    onClick={() => manejarClickReserva(reserva)}
                  >
                    Acciones
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      </TableContainer>
    </div>
  );
};

export default Reservas;