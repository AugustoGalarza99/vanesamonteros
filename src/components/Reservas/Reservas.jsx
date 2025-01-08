import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig"; // Configuración de Firebase
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import "./Reservas.css";

const Reservas = ({ uidPeluquero }) => {
  const [rolUsuario, setRolUsuario] = useState("peluquero");
  const [peluqueros, setPeluqueros] = useState([]);
  const [peluqueroSeleccionado, setPeluqueroSeleccionado] = useState(null);
  const [reservas, setReservas] = useState([]);

  // Obtener rol y datos del usuario
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        console.log("uidPeluquero recibido:", uidPeluquero);  // Agregado para depuración

        if (!uidPeluquero) {
          console.error("UID de peluquero no proporcionado.");
          return;
        }

        // Verificar si es un peluquero
        const peluqueroDoc = await getDoc(doc(db, "peluqueros", uidPeluquero));
        if (peluqueroDoc.exists()) {
          console.log("Es un peluquero, cargando datos de peluquero.");
          setRolUsuario("peluquero");
          setPeluqueroSeleccionado(uidPeluquero);
          return;
        }

        // Verificar si es un administrador
        const adminDoc = await getDoc(doc(db, "administradores", uidPeluquero));
        if (adminDoc.exists()) {
          console.log("Es un administrador, cargando datos de administradores.");
          setRolUsuario("administrador");
          const peluquerosSnapshot = await getDocs(collection(db, "peluqueros"));
          const listaPeluqueros = peluquerosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
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

  // Cargar reservas
  useEffect(() => {
    const cargarReservas = async () => {
      try {
        const snapshot = await getDocs(collection(db, "reservas"));
        let reservasCargadas = [];
        snapshot.forEach(docReserva => {
          const reserva = docReserva.data();
          if (
            peluqueroSeleccionado === "admin" ||
            reserva.uidPeluquero === peluqueroSeleccionado
          ) {
            reservasCargadas.push({
              ...reserva,
              id: docReserva.id,
            });
          }
        });
        setReservas(reservasCargadas);
      } catch (error) {
        console.error("Error cargando reservas:", error);
      }
    };

    if (peluqueroSeleccionado) {
      cargarReservas();
    }
  }, [peluqueroSeleccionado]);

  return (
    <div className="reservas-container">
      <h1>Gestión de Reservas</h1>

      {/* Selector para administrador */}
      {rolUsuario === "administrador" && peluqueros.length > 0 && (
        <FormControl fullWidth>
          <InputLabel id="select-peluquero-label">Seleccionar Profesional</InputLabel>
          <Select
            labelId="select-peluquero-label"
            value={peluqueroSeleccionado}
            onChange={e => setPeluqueroSeleccionado(e.target.value)}
          >
            <MenuItem value="admin">Todos los profesionales</MenuItem>
            {peluqueros.map(peluquero => (
              <MenuItem key={peluquero.id} value={peluquero.uid}>
                {peluquero.email}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Mostrar reservas */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Hora</TableCell>
            <TableCell>Cliente</TableCell>
            <TableCell>Servicio</TableCell>
            <TableCell>Profesional</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reservas.map(reserva => (
            <TableRow key={reserva.id}>
              <TableCell>{reserva.fecha}</TableCell>
              <TableCell>{reserva.hora}</TableCell>
              <TableCell>{reserva.cliente}</TableCell>
              <TableCell>{reserva.servicio}</TableCell>
              <TableCell>{reserva.nombrePeluquero}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Reservas;
