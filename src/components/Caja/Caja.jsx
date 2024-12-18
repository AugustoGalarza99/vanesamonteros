import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig"; // Configuración de Firebase
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { TextField, Table, TableHead, TableRow, TableCell, TableBody, MenuItem, Select, InputLabel, FormControl,} from "@mui/material";
import { LocalizationProvider, DatePicker,} from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import './Caja.css'

// Registrar Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const Caja = ({ uidPeluquero }) => {
  const [datos, setDatos] = useState([]); // Datos cargados de Firebase
  const [fechaInicio, setFechaInicio] = useState(new Date()); // Fecha desde
  const [fechaFin, setFechaFin] = useState(new Date()); // Fecha hasta
  const [rolUsuario, setRolUsuario] = useState("peluquero"); // Rol del usuario (por defecto peluquero)
  const [peluqueros, setPeluqueros] = useState([]); // Lista de peluqueros
  const [peluqueroSeleccionado, setPeluqueroSeleccionado] = useState(null); // Peluquero seleccionado

  // Obtener rol y datos del usuario (peluquero o administrador)
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const peluqueroDoc = await getDoc(doc(db, "peluqueros", uidPeluquero));
        if (peluqueroDoc.exists()) {
          const datosPeluquero = peluqueroDoc.data();
          setRolUsuario(datosPeluquero.rol || "peluquero"); // Establecer el rol
          // Si es administrador, cargar la lista de peluqueros
          if (datosPeluquero.rol === "administrador") {
            const peluquerosSnapshot = await getDocs(collection(db, "peluqueros"));
            const listaPeluqueros = peluquerosSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));
            setPeluqueros(listaPeluqueros);
            setPeluqueroSeleccionado("admin"); // Establecer valor por defecto para el admin
          } else {
            setPeluqueroSeleccionado(uidPeluquero); // Si es peluquero, se selecciona su propio UID
          }
        } else {
          console.error("No se encontró el peluquero en Firestore.");
          setRolUsuario("peluquero"); // Rol por defecto si no se encuentra
        }
      } catch (error) {
        console.error("Error cargando el peluquero:", error);
      }
    };

    cargarUsuario();
  }, [uidPeluquero]);

  // Cargar datos financieros de Firebase para el peluquero seleccionado o todos si es admin
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
                // Si es administrador, mostrar todos los peluqueros (todos los servicios)
                if (peluqueroSeleccionado === "admin" || servicio.uid === peluqueroSeleccionado) {
                  datosCargados.push({
                    ...servicio,
                    id: idServicio,
                    fecha: new Date(servicio.fecha),
                  });
                }
              });
            });
          });
        });
        setDatos(datosCargados); // Guardar datos localmente
      } catch (error) {
        console.error("Error cargando datos: ", error);
      }
    };

    if (peluqueroSeleccionado) {
      cargarDatos();
    }
  }, [peluqueroSeleccionado]); // Dependencia en peluqueroSeleccionado para cargar los datos cuando cambie

  // Filtrar datos por rango de fechas
  const filtrarPorFechas = (datos, inicio, fin) => {
    const inicioTimestamp = inicio.getTime();
    const finTimestamp = fin.getTime();

    return datos.filter((item) => {
      const fechaTimestamp = item.fecha.getTime();
      return fechaTimestamp >= inicioTimestamp && fechaTimestamp <= finTimestamp;
    });
  };

  const datosFiltrados = filtrarPorFechas(datos, fechaInicio, fechaFin);

  // Procesar datos para el gráfico y la tabla
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

  // Crear datos para el gráfico de torta
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

  // Calcular el total general de ingresos
  const totalIngresos = Object.values(ingresosPorServicio).reduce(
    (total, servicio) => total + servicio.ingresosTotales,
    0
  );

  const procesarDatosPorFecha = (datosFiltrados) => {
    const agrupadosPorFecha = {};
  
    datosFiltrados.forEach((servicio) => {
      const fechaStr = servicio.fecha.toISOString().split("T")[0]; // Obtener la fecha como "YYYY-MM-DD"
      const { servicio: nombreServicio, precio } = servicio;
      const precioValido = isNaN(precio) ? 0 : precio;
  
      if (!agrupadosPorFecha[fechaStr]) {
        agrupadosPorFecha[fechaStr] = {};
      }
  
      if (agrupadosPorFecha[fechaStr][nombreServicio]) {
        agrupadosPorFecha[fechaStr][nombreServicio].cantidad += 1;
        agrupadosPorFecha[fechaStr][nombreServicio].ingresosTotales += precioValido;
      } else {
        agrupadosPorFecha[fechaStr][nombreServicio] = {
          cantidad: 1,
          ingresosTotales: precioValido,
        };
      }
    });
  
    return agrupadosPorFecha;
  };
  
  const datosAgrupadosPorFecha = procesarDatosPorFecha(datosFiltrados);

  const opcionesGrafico = {
    responsive: true,
    maintainAspectRatio: false, // Permitir que se ajuste al tamaño del contenedor
  };
  

  return (
    <div className="caja-container">
      <h1 className="titulo">Control de Finanzas</h1>

      {/* Si es administrador, mostrar el desplegable de peluqueros */}
      {rolUsuario === "administrador" && peluqueros.length > 0 && (
        <FormControl fullWidth>
          <InputLabel id="select-peluquero-label">Seleccionar Peluquero</InputLabel>
          <Select
            labelId="select-peluquero-label"
            value={peluqueroSeleccionado}
            onChange={(e) => setPeluqueroSeleccionado(e.target.value)}
          >
            <MenuItem value="admin">Todos los peluqueros</MenuItem> {/* Opción para ver todos */}
            {peluqueros.map((peluquero) => (
              <MenuItem key={peluquero.id} value={peluquero.uid}>
                {peluquero.email}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Filtros de fecha */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <div className="fecha-filtros">
          <DatePicker
            label="Desde"
            value={fechaInicio}
            onChange={(newValue) => setFechaInicio(newValue)}
            renderInput={(params) => <TextField {...params} />}
          />
          <DatePicker
            label="Hasta"
            value={fechaFin}
            onChange={(newValue) => setFechaFin(newValue)}
            renderInput={(params) => <TextField {...params} />}
          />
        </div>
      </LocalizationProvider>

      {/* Verificar si hay datos en el gráfico */}
      <div className="grafico-container">
      {Object.keys(ingresosPorServicio).length > 0 ? (
        <Pie data={datosGrafico} options={opcionesGrafico}/>
      ) : (
        <p>No se encontraron datos para este filtro.</p>
      )}
      </div>
      {/* Mostrar ingresos en tabla */}
      <Table>
  <TableHead>
    <TableRow>
      <TableCell>Fecha</TableCell>
      <TableCell>Servicio</TableCell>
      <TableCell>Cantidad</TableCell>
      <TableCell>Ingresos Totales</TableCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {Object.entries(datosAgrupadosPorFecha).map(([fecha, servicios]) => (
      <React.Fragment key={fecha}>
        {/* Encabezado para cada fecha */}
        <TableRow>
          <TableCell colSpan={4} style={{ fontWeight: "bold" }}>
            {fecha}
          </TableCell>
        </TableRow>
        {/* Servicios de esa fecha */}
        {Object.entries(servicios).map(([servicio, { cantidad, ingresosTotales }]) => (
          <TableRow key={servicio}>
            <TableCell></TableCell>
            <TableCell>{servicio}</TableCell>
            <TableCell>{cantidad}</TableCell>
            <TableCell>${ingresosTotales.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </React.Fragment>
    ))}
  </TableBody>
</Table>


      {/* Total de ingresos */}
      <h2>Total de Ingresos: ${totalIngresos.toFixed(2)}</h2>
    </div>
  );
};

export default Caja;