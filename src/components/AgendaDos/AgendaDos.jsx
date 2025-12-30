import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Select, InputLabel, FormControl, Button, TableContainer, Paper, TextField } from "@mui/material";
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, setDoc } from "firebase/firestore";
import { limpiarReservasAntiguas } from '../../reservaService'
import Swal from "sweetalert2";
import './Agendados.css'

const ReservasDos = ({ uidPeluquero }) => {
  const [rolUsuario, setRolUsuario] = useState("peluquero");
  const [peluqueros, setPeluqueros] = useState([]);
  const [peluqueroSeleccionado, setPeluqueroSeleccionado] = useState("admin");
  const [reservas, setReservas] = useState([]);
  const [reservasFiltradas, setReservasFiltradas] = useState([]); // Reservas filtradas
  const [reservasLocal, setReservasLocal] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(""); // Fecha seleccionada

  const obtenerNombreProfesional = async (uid) => {
    try {
      const peluqueroDoc = await getDoc(doc(db, "peluqueros", uid));
      return peluqueroDoc.exists() ? peluqueroDoc.data().nombre : "Profesional no encontrado";
    } catch (error) {
      console.error("Error obteniendo el nombre del profesional:", error);
      return "Error obteniendo nombre";
    }
  };;

        // Limpiar reservas antiguas al montar el componente
        useEffect(() => {
          const limpiarAlMontar = async () => {
            try {
              await limpiarReservasAntiguas();
            } catch (error) {
              console.error('Error al limpiar reservas antiguas al montar:', error);
            }
          };
      
          limpiarAlMontar();
        }, []); // Dependencia vacía: se ejecuta solo al montar

  useEffect(() => {
    const cargarReservasDelPeluquero = async () => {
      try {
        if (reservasLocal.length > 0) {
          /*console.log("Usando reservas almacenadas localmente.");*/
          setReservasFiltradas(reservasLocal);
          return;
        }
  
        if (!uidPeluquero) {
          /*console.error("El UID del peluquero no está definido");*/
          return;
        }
  
        /*console.log("Cargando reservas desde Firebase...");*/
        const reservasRef = collection(db, "reservas");
        const q = query(reservasRef, where("uidPeluquero", "==", uidPeluquero));
        const querySnapshot = await getDocs(q);
  
        if (!querySnapshot.empty) {
          const reservasCargadas = await Promise.all(
            querySnapshot.docs.map(async (docReserva) => {
              const reserva = docReserva.data();
  
              // Calcular hora de finalización
              const [horaInicio, minutosInicio] = reserva.hora.split(":").map(Number);
              const duracion = reserva.duracion || 0;
              const horaFin = new Date();
              horaFin.setHours(horaInicio, minutosInicio + duracion);
              const horaFinTexto = horaFin.toTimeString().split(" ")[0].substring(0, 5);
  
              // Obtener nombre del profesional
              const nombrePeluquero = await obtenerNombreProfesional(uidPeluquero);
  
              return {
                ...reserva,
                id: docReserva.id,
                horaFin: horaFinTexto, // Agregamos la hora de finalización
                nombrePeluquero,
                // Nuevos campos (usamos ?? para valores por defecto seguros)
                aviso: reserva.aviso ?? false,
                recManiana: reserva.recManiana ?? false,
                recTarde: reserva.recTarde ?? false,
                costoServicio: reserva.costoServicio ?? 0,
              };
            })
          );
  
          reservasCargadas.sort(
            (a, b) =>
              new Date(`${a.fecha}T${a.hora}`) - new Date(`${b.fecha}T${b.hora}`)
          );
  
          /*console.log("Reservas cargadas y ordenadas:", reservasCargadas);*/
  
          setReservas(reservasCargadas);
          setReservasLocal(reservasCargadas);
          setReservasFiltradas(reservasCargadas);
        } else {
         /* console.log("No se encontraron reservas para este peluquero");*/
          setReservas([]);
          setReservasFiltradas([]);
        }
      } catch (error) {
       /* console.error("Error cargando las reservas del peluquero:", error);*/
      }
    };
  
    cargarReservasDelPeluquero();
  }, [uidPeluquero, reservasLocal]);


  // Filtrar reservas por fecha seleccionada
  useEffect(() => {
    if (fechaSeleccionada) {
      const filtradas = reservas.filter((reserva) => reserva.fecha === fechaSeleccionada);
      setReservasFiltradas(filtradas);
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
      formaPago: reserva.formaPago, // Guardar la forma de pago (efectivo o transferencia)
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

const actualizarCostoServicio = async (reservaId, nuevoCosto) => {
  try {
    const reservaRef = doc(db, "reservas", reservaId);
    
    await updateDoc(reservaRef, { 
      costoServicio: Number(nuevoCosto) 
    });

    // Actualizar estado local
    setReservasLocal(prev => 
      prev.map(r => 
        r.id === reservaId ? { ...r, costoServicio: Number(nuevoCosto) } : r
      )
    );

    // También actualizamos reservasFiltradas para que se vea inmediatamente
    setReservasFiltradas(prev => 
      prev.map(r => 
        r.id === reservaId ? { ...r, costoServicio: Number(nuevoCosto) } : r
      )
    );

    Swal.fire({
      title: "¡Actualizado!",
      text: "El costo del servicio ha sido modificado correctamente.",
      icon: "success",
      background: 'black',
      color: 'white',
      timer: 1800,
      showConfirmButton: false
    });
  } catch (error) {
    console.error("Error al actualizar costo:", error);
    Swal.fire({
      title: "Error",
      text: "No se pudo actualizar el costo. Intenta nuevamente.",
      icon: "error",
      background: 'black',
      color: 'white'
    });
  }
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
            <button id="editarTelefonoBtn" class="btn btn-info">Editar teléfono</button>
            <button id="reservarManualPrefillBtn" class="btn btn-cambio">Reserva nueva con datos del cliente</button>
            <button id="editarCostoBtn" class="btn btn-warning">Modificar costo</button>
          `,
          background: 'black',
          color: 'white',
          didRender: () => {
            document.getElementById('editarCostoBtn')?.addEventListener('click', () => {
            Swal.close();
            editarCostoTurno(reserva);
          });
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
            document.getElementById("reservarManualPrefillBtn")?.addEventListener("click", async () => {
              Swal.close();
              await irAReservaManualConCliente(reserva);
            });
            // 👇 NUEVO: vincula el botón "Editar teléfono" al flujo que lee el doc en "clientes" y sobreescribe SOLO el campo telefono
            document.getElementById('editarTelefonoBtn')?.addEventListener('click', async () => {
              Swal.close();
              await editarTelefonoSoloReserva(reserva);
            }, { once: true });

            // (Opcional) si también querés que funcione el de "Agregar otra reserva (mismo cliente)"
            document.getElementById('agregarReservaMismoClienteBtn')?.addEventListener('click', () => {
              Swal.close();
              agendarReservaMismoCliente(reserva);
            }, { once: true });
          },
        }).then(async (result) => {
          if (result.isConfirmed) {
            try { 
              // **Solicitar la forma de pago antes de continuar**
              const { isConfirmed, value: formaPago } = await Swal.fire({
                title: "Seleccionar Forma de Pago",
                html: `
                  <style>
                    /* Asegúrate de aplicar los estilos con mayor especificidad */
                    .swal2-radio {
                      display: flex;
                      flex-direction: column;
                      align-items: center !important;  /* Importante para que no sea sobrescrito */
                      background: black !important;   /* Fondo negro */
                      padding: 10px;
                      border-radius: 10px;
                    }
      
                    .swal2-radio label {
                      display: flex;
                      align-items: center;
                      gap: 8px;
                      font-size: 18px;
                      cursor: pointer;
                    }
      
                    .swal2-radio input {
                      accent-color: green;
                      transform: scale(1.2);
                    }
      
                    .swal2-radio label span {
                      color: white !important;  /* Texto blanco */
                      background: black !important;  /* Fondo negro */
                      padding: 4px 8px;
                      border-radius: 5px;
                    }
                  </style>
      
                  <div class="swal2-radio">
                    <label><input type="radio" name="formaPago" value="Efectivo"> <span>Efectivo</span></label>
                    <label><input type="radio" name="formaPago" value="Transferencia"> <span>Transferencia</span></label>
                    <label><input type="radio" name="formaPago" value="No_aplica"> <span>No aplica</span></label>
                  </div>
                `,
                showCancelButton: true,
                confirmButtonText: "Confirmar",
                background: "black",
                color: "white",
                preConfirm: () => {
                  const formaPagoSeleccionada = document.querySelector('input[name="formaPago"]:checked')?.value;
                  if (!formaPagoSeleccionada) {
                    Swal.showValidationMessage("Debe seleccionar una forma de pago.");
                  }
                  return formaPagoSeleccionada;
                }
              });
      
              if (!isConfirmed) return; // Si el usuario cancela, no se finaliza el turno
      
              // **Actualizar el estado del turno**
              await actualizarEstadoTurno(id, 'finalizado');      
              // **Agregar la forma de pago a la reserva**
              reserva.formaPago = formaPago;
    
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
    
    const editarCostoTurno = (reserva) => {
      Swal.fire({
        title: 'Modificar costo del servicio',
        html: `
          <div style="margin: 20px 0;">
            <p style="margin-bottom: 12px;">Servicio actual: <strong>${reserva.servicio || '—'}</strong></p>
            <label style="display: block; margin-bottom: 8px;">Nuevo costo ($):</label>
            <input 
              id="nuevoCostoInput" 
              class="swal2-input" 
              type="number" 
              value="${reserva.costoServicio || 0}" 
              min="0" 
              step="100"
              style="width: 180px; text-align: right;"
            >
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar costo',
        cancelButtonText: 'Cancelar',
        background: 'black',
        color: 'white',
        preConfirm: () => {
          const nuevoCosto = document.getElementById('nuevoCostoInput').value;
          if (!nuevoCosto || isNaN(nuevoCosto) || Number(nuevoCosto) < 0) {
            Swal.showValidationMessage('Ingrese un monto válido (número positivo)');
            return false;
          }
          return Number(nuevoCosto);
        }
      }).then((result) => {
        if (result.isConfirmed) {
          actualizarCostoServicio(reserva.id, result.value);
        }
      });
    };


    const navigate = useNavigate();
    
      const irAReservaManualConCliente = (reserva) => {
        // usamos EXCLUSIVAMENTE los campos que vienen en la reserva
        const cliente = {
          dni: (reserva.dni && String(reserva.dni).trim() !== "") ? reserva.dni : null,
          nombre: reserva.nombre || "",
          apellido: reserva.apellido || "",
          telefono: reserva.telefono || "", // puede venir vacío si la reserva vieja no lo tenía
        };
    
        const payload = { prefillCliente: cliente };
    
        // guardamos para prefill one-shot en /reservamanual (tu pantalla ya lo limpia al montar)
        sessionStorage.setItem("prefillClienteReservaManual", JSON.stringify(payload));
    
        navigate("/reservamanual", { state: payload });
      
      };
    
    const editarTelefonoSoloReserva = async (reserva) => {
      try {
        const { isConfirmed, value: nuevoTel } = await Swal.fire({
          title: 'Editar teléfono (esta reserva)',
          input: 'text',
          inputLabel: 'Número de teléfono',
          inputValue: reserva.telefono || '',
          showCancelButton: true,
          confirmButtonText: 'Guardar',
          background: 'black',
          color: 'white',
          preConfirm: (val) => {
            const limpio = (val || '').replace(/[^\d+]/g, ''); // solo dígitos y +
            if (!limpio) {
              Swal.showValidationMessage('Ingresá un número válido');
              return false;
            }
            return limpio;
          }
        });
    
        if (!isConfirmed) return;
    
        // 🔧 Actualiza SOLO el campo "telefono" en el doc de reservas (si no existía, lo crea)
        await updateDoc(doc(db, 'reservas', reserva.id), { telefono: nuevoTel });
    
        // 🧠 Refrescar estado local para que la UI muestre el cambio
        setReservasLocal(prev => prev.map(r => r.id === reserva.id ? { ...r, telefono: nuevoTel } : r));
        setReservas(prev => prev.map(r => r.id === reserva.id ? { ...r, telefono: nuevoTel } : r));
    
        await Swal.fire({
          title: 'Teléfono actualizado',
          text: 'Se actualizó el teléfono SOLO en esta reserva.',
          icon: 'success',
          background: 'black',
          color: 'white',
        });
      } catch (e) {
        console.error(e);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar el teléfono de la reserva.',
          icon: 'error',
          background: 'black',
          color: 'white',
        });
      }
    };

    // Función auxiliar para mostrar icono de recordatorio
  const getRecordatorioIcon = (reserva) => {
    if (reserva.recManiana) return "✓";
    if (reserva.recTarde) return "✓";
    return "—";
  };

  const formatearPrecio = (valor) => {
  if (!valor && valor !== 0) return "—";
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
};

  return (
    <div className="reservas-container">
      <div>
      <h3>Mis Reservas</h3>
      </div>

      <TextField
        label="Filtrar por fecha"
        type="date"
        value={fechaSeleccionada}
        onChange={manejarCambioFecha}
        InputLabelProps={{ shrink: true }}
        style={{ marginBottom: "20px" }}
      />

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
                  <TableCell>Costo</TableCell>
                  <TableCell>Profesional</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Aviso</TableCell>
                  <TableCell align="center">Recordatorio</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
          {reservasFiltradas
            .filter((reserva) => reserva.status) // Filtrar turnos finalizados
            .map((reserva) => (
              <TableRow key={reserva.id}>
                <TableCell>{formatearFecha(reserva.fecha)}</TableCell>
                <TableCell>{reserva.hora}</TableCell>
                <TableCell>{reserva.horaFin}</TableCell>
                <TableCell>{`${reserva.nombre} ${reserva.apellido}`}</TableCell>
                <TableCell>{reserva.servicio}</TableCell>
                <TableCell className="costo-cell">{formatearPrecio(reserva.costoServicio)}</TableCell>
                <TableCell>{reserva.nombrePeluquero}</TableCell>                  
                <TableCell>
                  <span className={`status-label status-${reserva.status?.toLowerCase().replace(" ", "-")}`}>
                    {reserva.status || "—"}
                  </span>
                </TableCell>
                <TableCell align="center">
                  <span className={`indicator ${reserva.aviso ? "success" : "danger"}`}>
                    {reserva.aviso ? "✓" : "✗"}
                  </span>
                </TableCell>
                <TableCell align="center">
                  <span className={`recordatorio ${reserva.recManiana ? "maniana" : reserva.recTarde ? "tarde" : "none"}`}>
                    {getRecordatorioIcon(reserva)}
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
              {reservasFiltradas
                .filter((reserva) => reserva.status)
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
                      <span>Costo:</span>
                      <p className="costo-card">{formatearPrecio(reserva.costoServicio)}</p>
                    </div>
                    <div className="card-row">
                      <span>Profesional:</span>
                      <p>{reserva.nombrePeluquero}</p>
                    </div>
                    <div className="card-row"><span>Estado:</span>
                      <p className={`status-${reserva.status?.toLowerCase().replace(" ", "-")}`}>
                        {reserva.status || "—"}
                      </p>
                    </div>
                    <div className="card-row">
                      <span>Aviso:</span>
                      <span className={`indicator ${reserva.aviso ? "success" : "danger"}`}>
                        {reserva.aviso ? "✓" : "✗"}
                      </span>
                    </div>
                    <div className="card-row">
                      <span>Recordatorio:</span>
                      <span className={`recordatorio ${reserva.recManiana ? "maniana" : reserva.recTarde ? "tarde" : "none"}`}>
                        {getRecordatorioIcon(reserva)}
                      </span>
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

export default ReservasDos;
