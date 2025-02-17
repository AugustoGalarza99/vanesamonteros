import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig"; // Configuración de Firebase
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { TextField, Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import './Caja.css'

// Registrar Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const Caja = ({ uidPeluquero }) => {
  const [datos, setDatos] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [rolUsuario, setRolUsuario] = useState("peluquero");
  const [peluqueros, setPeluqueros] = useState([]);
  const [peluqueroSeleccionado, setPeluqueroSeleccionado] = useState(null);

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const peluqueroDoc = await getDoc(doc(db, "peluqueros", uidPeluquero));
        if (peluqueroDoc.exists()) {
          setRolUsuario("peluquero");
          setPeluqueroSeleccionado(uidPeluquero);
          return;
        }

        const adminDoc = await getDoc(doc(db, "administradores", uidPeluquero));
        if (adminDoc.exists()) {
          setRolUsuario("administrador");

          const peluquerosSnapshot = await getDocs(collection(db, "peluqueros"));
          const listaPeluqueros = peluquerosSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setPeluqueros(listaPeluqueros);
          setPeluqueroSeleccionado("admin");
        } else {
          console.error("No se encontró el usuario en ninguna colección.");
          setRolUsuario("desconocido");
        }
      } catch (error) {
        console.error("Error cargando el usuario:", error);
      }
    };

    cargarUsuario();
  }, [uidPeluquero]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const snapshot = await getDocs(collection(db, "control"));
        let datosCargados = [];
        snapshot.forEach((docYear) => {
          const meses = docYear.data();
          Object.entries(meses).forEach(([mes, dias]) => {
            Object.entries(dias).forEach(([dia, detalles]) => {
              const servicios = detalles.servicios || {};
              Object.entries(servicios).forEach(([idServicio, servicio]) => {
                if (peluqueroSeleccionado === "admin" || servicio.uid === peluqueroSeleccionado) {
                  datosCargados.push({
                    ...servicio,
                    id: idServicio,
                    fecha: new Date(servicio.fecha + "T00:00:00"), // Asegura la zona horaria correcta
                  });
                }
              });
            });
          });
        });
        setDatos(datosCargados);
      } catch (error) {
        console.error("Error cargando datos: ", error);
      }
    };

    if (peluqueroSeleccionado) {
      cargarDatos();
    }
  }, [peluqueroSeleccionado]);

  const filtrarPorFechas = (datos, inicio, fin) => {
    const inicioTimestamp = inicio.getTime();
    const finTimestamp = fin.getTime();

    return datos.filter((item) => {
      const fechaTimestamp = item.fecha instanceof Date ? item.fecha.getTime() : new Date(item.fecha).getTime();
      return fechaTimestamp >= inicioTimestamp && fechaTimestamp <= finTimestamp;
    });
  };

  const datosFiltrados = filtrarPorFechas(datos, fechaInicio, fechaFin);

  const procesarDatos = (datosFiltrados) => {
    const ingresosPorServicio = {};

    datosFiltrados.forEach((servicio) => {
      const { servicio: nombreServicio, precio } = servicio;
      const precioValido = isNaN(precio) ? 0 : precio;

      if (ingresosPorServicio[nombreServicio]) {
        ingresosPorServicio[nombreServicio].cantidad += 1;
        ingresosPorServicio[nombreServicio].ingresosTotales += precioValido;
      } else {
        ingresosPorServicio[nombreServicio] = {
          cantidad: 1,
          ingresosTotales: precioValido,
        };
      }
    });

    return ingresosPorServicio;
  };

  const ingresosPorServicio = procesarDatos(datosFiltrados);

  const datosGrafico = {
    labels: Object.keys(ingresosPorServicio),
    datasets: [
      {
        label: "Ingresos por Servicio",
        data: Object.values(ingresosPorServicio).map((s) => s.ingresosTotales),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
        borderWidth: 1,
      },
    ],
  };

  const totalIngresos = Object.values(ingresosPorServicio).reduce(
    (total, servicio) => total + servicio.ingresosTotales,
    0
  );

  const opcionesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="caja-container">
      <h1 className="titulo">Control de Finanzas</h1>

      {rolUsuario === "administrador" && peluqueros.length > 0 && (
        <FormControl fullWidth>
          <InputLabel id="select-peluquero-label">Seleccionar Profesional</InputLabel>
          <Select
            labelId="select-peluquero-label"
            value={peluqueroSeleccionado}
            onChange={(e) => setPeluqueroSeleccionado(e.target.value)}
          >
            <MenuItem value="admin">Todos los profesionales</MenuItem>
            {peluqueros.map((peluquero) => (
              <MenuItem key={peluquero.id} value={peluquero.uid}>
                {peluquero.email}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <div className="fecha-filtros">
          <DatePicker label="Desde" value={fechaInicio} onChange={setFechaInicio} renderInput={(params) => <TextField {...params} />} />
          <DatePicker label="Hasta" value={fechaFin} onChange={setFechaFin} renderInput={(params) => <TextField {...params} />} />
        </div>
      </LocalizationProvider>

      <div className="grafico-container">
        {Object.keys(ingresosPorServicio).length > 0 ? (
          <Pie data={datosGrafico} options={opcionesGrafico} />
        ) : (
          <p>No se encontraron datos para este filtro.</p>
        )}
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Servicio</TableCell>
            <TableCell>Cantidad</TableCell>
            <TableCell>Ingresos Totales</TableCell>
            <TableCell>Método de Pago</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {datosFiltrados.map((servicio, index) => (
            <TableRow key={index}>
              <TableCell>{servicio.fecha.toLocaleDateString()}</TableCell>
              <TableCell>{servicio.servicio}</TableCell>
              <TableCell>1</TableCell>
              <TableCell>${servicio.precio.toFixed(2)}</TableCell>
              <TableCell>{servicio.formaPago}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <h2>Total de Ingresos: ${totalIngresos.toFixed(2)}</h2>
    </div>
  );
};

export default Caja;
