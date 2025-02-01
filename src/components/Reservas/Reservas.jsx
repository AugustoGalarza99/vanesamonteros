import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Select, InputLabel, FormControl, Button, TableContainer, Paper, TextField } from "@mui/material";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, setDoc } from "firebase/firestore";
import { limpiarReservasAntiguas } from '../../reservaService'
import Swal from "sweetalert2";
import "./Reservas.css";

const Reservas = ({ uidPeluquero }) => {
  const [rolUsuario, setRolUsuario] = useState("peluquero");
  const [peluqueros, setPeluqueros] = useState([]);
  const [peluqueroSeleccionado, setPeluqueroSeleccionado] = useState("admin");
  const [reservas, setReservas] = useState([]);
  const [reservasFiltradas, setReservasFiltradas] = useState([]); // Reservas filtradas
  const [reservasLocal, setReservasLocal] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(""); // Fecha seleccionada
  const [nombreBuscado, setNombreBuscado] = useState("");

  const obtenerNombreProfesional = async (uid) => {
    /*console.log(`Consultando nombre del profesional con UID: ${uid}`);*/
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
      /*console.log("Cargando usuario...");*/
      try {
        if (!uidPeluquero) {
          console.error("UID de peluquero no proporcionado.");
          return;
        }

        const peluqueroDoc = await getDoc(doc(db, "peluqueros", uidPeluquero));
        /*console.log("Resultado de consulta de peluquero:", peluqueroDoc.exists());*/
        if (peluqueroDoc.exists()) {
          setRolUsuario("peluquero");
          setPeluqueroSeleccionado(uidPeluquero);
          return;
        }

        const adminDoc = await getDoc(doc(db, "administradores", uidPeluquero));
       /* console.log("Resultado de consulta de administrador:", adminDoc.exists());*/
        if (adminDoc.exists()) {
          setRolUsuario("administrador");
          const peluquerosSnapshot = await getDocs(collection(db, "peluqueros"));
          const listaPeluqueros = peluquerosSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          /*console.log("Lista de peluqueros cargada:", listaPeluqueros);*/
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

    // Filtrar reservas cuando cambia la fecha seleccionada
    useEffect(() => {
      if (fechaSeleccionada) {
        const reservasFiltradas = reservas.filter(
          (reserva) => reserva.fecha === fechaSeleccionada
        );
        setReservasFiltradas(reservasFiltradas);
      } else {
        setReservasFiltradas(reservas);
      }
    }, [fechaSeleccionada, reservas]);
  
    const manejarCambioFecha = (event) => {
      setFechaSeleccionada(event.target.value);
    };
  
// Función para formatear fechas
const formatearFecha = (fecha) => {
  const partes = fecha.split("-"); // Divide la fecha en partes
  return `${partes[2]}-${partes[1]}-${partes[0]}`; // Reorganiza como dd-mm-yyyy
};

const reservasFiltradasPorNombre = reservasFiltradas.filter((reserva) =>
  `${reserva.nombre} ${reserva.apellido}`.toLowerCase().includes(nombreBuscado.toLowerCase())
);

useEffect(() => {
  const cargarReservas = async () => {
    if (reservasLocal.length > 0) {
      /*console.log("Usando reservas almacenadas localmente.");*/
      setReservasFiltradas(reservasLocal);
      return;
    }

    /*console.log("Cargando reservas desde Firebase...");*/
    try {
      const snapshot = await getDocs(collection(db, "reservas"));
      /*console.log(`Número de reservas obtenidas: ${snapshot.size}`);*/

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

      /*console.log("Reservas cargadas y ordenadas:", reservasCargadas);*/
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
  const filtrarReservas = () => {
    const reservasFiltradas = reservasLocal.filter((reserva) => {
      const coincideProfesional =
        peluqueroSeleccionado === "admin" || reserva.uidPeluquero === peluqueroSeleccionado;
      const coincideFecha = !fechaSeleccionada || reserva.fecha === fechaSeleccionada;
      return coincideProfesional && coincideFecha;
    });

    setReservasFiltradas(reservasFiltradas);
  };

  filtrarReservas();
}, [peluqueroSeleccionado, fechaSeleccionada, reservasLocal]);

  

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

    /*console.log('Turno actualizado a finalizado y registrado en la colección control.');*/
  } catch (error) {
    console.error('Error al finalizar el turno:', error.message);
  }
};
const editarDuracionYHoraTurno = async (reservaId, nuevaDuracion, nuevaHoraInicio) => {
  try {
    // Calcular nueva hora de finalización
    const [horas, minutos] = nuevaHoraInicio.split(":").map(Number);
    const nuevaHoraInicioDate = new Date();
    nuevaHoraInicioDate.setHours(horas, minutos);

    const nuevaHoraFinDate = new Date(nuevaHoraInicioDate);
    nuevaHoraFinDate.setMinutes(nuevaHoraInicioDate.getMinutes() + nuevaDuracion);

    const nuevaHoraFin = `${String(nuevaHoraFinDate.getHours()).padStart(2, "0")}:${String(
      nuevaHoraFinDate.getMinutes()
    ).padStart(2, "0")}`;

    // Actualizar la base de datos en Firebase
    const reservaRef = doc(db, "reservas", reservaId);
    await updateDoc(reservaRef, {
      duracion: nuevaDuracion,
      hora: nuevaHoraInicio,
      horaInicio: nuevaHoraInicio, // Mantener consistencia
      horaFin: nuevaHoraFin, // Actualizar hora de finalización
    });

    // Actualizar el estado local
    setReservasLocal((prevReservas) =>
      prevReservas.map((reserva) =>
        reserva.id === reservaId
          ? {
              ...reserva,
              duracion: nuevaDuracion,
              hora: nuevaHoraInicio,
              horaInicio: nuevaHoraInicio,
              horaFin: nuevaHoraFin, // Actualizar también localmente
            }
          : reserva
      )
    );

    Swal.fire({
      title: "Horario Actualizado",
      text: "La duración, hora de inicio y hora de finalización se han actualizado correctamente.",
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
        confirmButtonText: 'Turno realizado',
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
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            // Cambiar el estado del turno a "Finalizado"
            await actualizarEstadoTurno(id, 'finalizado');
  
            // Verificar si es el primer turno del día
            const isFirstTurnToday = await verificarPrimerTurnoDelDia();
            if (isFirstTurnToday) {
              await limpiarReservasAntiguas();
            }
  
            // Finalizar el turno
            await finalizarTurno(reserva);
  
            Swal.fire({
              title: 'Turno Confirmado',
              text: 'El turno se ha registrado como realizado.',
              icon: 'success',
              background: 'black',
              color: 'white',
            });
          } catch (error) {
            console.error('Error al confirmar el turno:', error.message);
            Swal.fire({
              title: 'Error',
              text: 'Hubo un problema al confirmar el turno. Inténtelo nuevamente.',
              icon: 'error',
              background: 'black',
              color: 'white',
            });
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
      <h3>Gestión de Reservas</h3>
      <div className="div-control">
        {rolUsuario === "administrador" && peluqueros.length > 0 && (
          <>
            <FormControl fullWidth>
              <InputLabel id="select-peluquero-label">Profesional</InputLabel>
              <Select
                labelId="select-peluquero-label"
                value={peluqueroSeleccionado}
                onChange={(e) => setPeluqueroSeleccionado(e.target.value)}
              >
                <MenuItem value="admin">Todos los profesionales</MenuItem>
                {peluqueros.map((peluquero) => (
                  <MenuItem key={peluquero.id} value={peluquero.uid}>
                    {peluquero.nombre.split(" (")[0]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              type="date"
              label="Seleccionar Fecha"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </>
        )}
      </div>

      {/* Buscador */}
      <div className="div-control">
        <TextField
          label="Buscar Cliente"
          variant="outlined"
          value={nombreBuscado}
          onChange={(e) => setNombreBuscado(e.target.value)}
          fullWidth
        />
      </div>
  
      {/* Tabla: Visible solo en pantallas grandes */}
      <TableContainer component={Paper} className="custom-table-container">
        <Table className="custom-table">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Hora Inicio</TableCell>
              <TableCell>Hora Fin</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Servicio</TableCell>
              <TableCell>Profesional</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reservasFiltradasPorNombre
              .filter((reserva) => reserva.status !== "finalizado")
              .map((reserva) => (
                <TableRow key={reserva.id}>
                  <TableCell>{formatearFecha(reserva.fecha)}</TableCell>
                  <TableCell>{reserva.hora}</TableCell>
                  <TableCell>{reserva.horaFin}</TableCell>
                  <TableCell>{`${reserva.nombre} ${reserva.apellido}`}</TableCell>
                  <TableCell>{reserva.servicio}</TableCell>
                  <TableCell>{reserva.nombrePeluquero}</TableCell>
                  <TableCell>
                    <span
                      className={`status-label ${
                        reserva.status === "Sin realizar"
                          ? "status-sin-realizar"
                          : reserva.status === "en proceso"
                          ? "status-en-proceso"
                          : ""
                      }`}
                    >
                      {reserva.status}
                    </span>
                  </TableCell>
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
  
      {/* Tarjetas: Visible solo en pantallas pequeñas */}
      <div className="reservas-cards">
        {reservasFiltradasPorNombre
          .filter((reserva) => reserva.status !== "finalizado")
          .map((reserva) => (
            <div className="reservas-card" key={reserva.id}>
              <div className="card-row">
                <span>Fecha:</span>
                <p>{formatearFecha(reserva.fecha)}</p>
              </div>
              <div className="card-row">
                <span>Hora inicio:</span>
                <p>{reserva.hora}</p>
              </div>
              <div className="card-row">
                <span>Hora fin:</span>
                <p>{reserva.horaFin}</p>
              </div>
              <div className="card-row">
                <span>Cliente:</span>
                <p>{`${reserva.nombre} ${reserva.apellido}`}</p>
              </div>
              <div className="card-row">
                <span>Servicio:</span>
                <p>{reserva.servicio}</p>
              </div>
              <div className="card-row">
                <span>Profesional:</span>
                <p>{reserva.nombrePeluquero}</p>
              </div>
              <div className="card-row">
                <span>Estado:</span>
                <p
                  className={
                    reserva.status === "Sin realizar"
                      ? "status-sin-realizar"
                      : reserva.status === "en proceso"
                      ? "status-en-proceso"
                      : ""
                  }
                >
                  {reserva.status}
                </p>
              </div>
              <Button
                className="button-acciones"
                variant="outlined"
                onClick={() => manejarClickReserva(reserva)}
              >
                Acciones
              </Button>
            </div>
          ))}
      </div>
    </div>
  );
  
  
};

export default Reservas;
