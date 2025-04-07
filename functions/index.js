const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

const gmailEmail = "agendasmartapp@gmail.com";
const gmailPassword = "ohnz ewgs rtdw rlyo";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

// Función para enviar email
const sendEmail = async (subject, message) => {
  const mailOptions = {
    from: '"Agenda Smart" <agendasmartapp@gmail.com>',
    to: ["augustogalarza15@gmail.com", "monterosvanesa@gmail.com",],
    replyTo: "agendasmartapp@gmail.com",  // Agrega esta línea
    subject: subject,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error enviando correo:", error);
  }
};

// Función para validar si la fecha es hoy o futura
const isFutureDate = (fechaStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Quitar la hora para comparar solo fecha

  const [año, mes, dia] = fechaStr.split("-").map(Number);
  const fechaReserva = new Date(año, mes - 1, dia);

  return fechaReserva >= today;
};

// Detectar nueva reserva
exports.onNewReservation = functions.firestore
  .document("reservas/{reservaId}")
  .onCreate((snap, context) => {
    const data = snap.data();

    if (!isFutureDate(data.fecha)) {
      return null;
    }

    const message = `📅 Fecha: ${data.fecha}\n⏰ Hora: ${data.hora}\n👤 Cliente: ${data.nombre} ${data.apellido}\n📞 Teléfono: ${data.telefono}\n💈 Servicio: ${data.servicio}`;
    return sendEmail("Nueva Reserva Creada", message);
  });

// Detectar eliminación de reserva
exports.onDeleteReservation = functions.firestore
  .document("reservas/{reservaId}")
  .onDelete((snap, context) => {
    const data = snap.data();

    if (!isFutureDate(data.fecha)) {
      return null;
    }

    const message = `❌ RESERVA ELIMINADA\n📅 Fecha: ${data.fecha}\n⏰ Hora: ${data.hora}\n👤 Cliente: ${data.nombre} ${data.apellido}\n📞 Teléfono: ${data.telefono}\n💈 Servicio: ${data.servicio}`;
    return sendEmail("Reserva Eliminada", message);
  });
