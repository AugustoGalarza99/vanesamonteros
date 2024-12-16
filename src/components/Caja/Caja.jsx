import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig"; // Configuración de Firebase
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { startOfWeek, endOfWeek } from "date-fns";
import { collection, getDocs } from "firebase/firestore"; // Importar Firestore

// Registrar Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const Caja = () => {
  const [datos, setDatos] = useState([]); // Almacena todos los datos cargados de Firebase
  const [filtro, setFiltro] = useState("mes"); // Filtro de visualización: día, semana, mes
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date()); // Fecha actual seleccionada

  // Cargar datos de Firebase al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const snapshot = await getDocs(collection(db, "control")); // Usar getDocs y collection
        let datosCargados = [];

        snapshot.forEach((docYear) => {
          const meses = docYear.data();
          Object.entries(meses).forEach(([mes, dias]) => {
            Object.entries(dias).forEach(([dia, detalles]) => {
              const servicios = detalles.servicios || {};
              Object.values(servicios).forEach((servicio) => {
                datosCargados.push({
                  ...servicio,
                  fecha: new Date(servicio.fecha),
                });
              });
            });
          });
        });

        setDatos(datosCargados); // Guardar datos localmente
      } catch (error) {
        console.error("Error cargando datos: ", error);
      }
    };

    cargarDatos();
  }, []);

  // Filtros
  const filtrarPorDia = (fecha) => {
    return datos.filter(
      (item) => item.fecha.toDateString() === fecha.toDateString()
    );
  };

  const filtrarPorSemana = (fecha) => {
    const inicioSemana = startOfWeek(fecha);
    const finSemana = endOfWeek(fecha);
    return datos.filter(
      (item) => item.fecha >= inicioSemana && item.fecha <= finSemana
    );
  };

  const filtrarPorMes = (fecha) => {
    return datos.filter(
      (item) =>
        item.fecha.getFullYear() === fecha.getFullYear() &&
        item.fecha.getMonth() === fecha.getMonth()
    );
  };

  // Procesar datos para el gráfico
  const procesarDatosParaGrafico = (datosFiltrados) => {
    const ingresosPorServicio = {};

    datosFiltrados.forEach((servicio) => {
      const { servicio: nombreServicio, precio } = servicio;
      if (ingresosPorServicio[nombreServicio]) {
        ingresosPorServicio[nombreServicio] += precio;
      } else {
        ingresosPorServicio[nombreServicio] = precio;
      }
    });

    return {
      labels: Object.keys(ingresosPorServicio),
      datasets: [
        {
          label: "Ingresos por Servicio",
          data: Object.values(ingresosPorServicio),
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"], // Colores
        },
      ],
    };
  };

  // Filtrar datos según el rango seleccionado
  const datosFiltrados =
    filtro === "dia"
      ? filtrarPorDia(fechaSeleccionada)
      : filtro === "semana"
      ? filtrarPorSemana(fechaSeleccionada)
      : filtrarPorMes(fechaSeleccionada);

  // Datos procesados para el gráfico
  const datosGrafico = procesarDatosParaGrafico(datosFiltrados);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Control de Caja</h1>
      <FormControl style={{ margin: "10px", minWidth: "200px" }}>
        <InputLabel>Rango</InputLabel>
        <Select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <MenuItem value="dia">Día</MenuItem>
          <MenuItem value="semana">Semana</MenuItem>
          <MenuItem value="mes">Mes</MenuItem>
        </Select>
      </FormControl>
      <Pie data={datosGrafico} />
    </div>
  );
};

export default Caja;
