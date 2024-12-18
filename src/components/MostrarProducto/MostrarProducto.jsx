import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const MostrarProductos = () => {
  const [productos, setProductos] = useState([]);
  const navigate = useNavigate();

  // Función para cargar datos desde Firebase y guardar en Local Storage
  const cargarProductosDesdeFirebase = async () => {
    try {
      const productosSnapshot = await getDocs(collection(db, "productos"));
      const productosData = productosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Guardar datos en Local Storage
      localStorage.setItem("productos", JSON.stringify(productosData));
      localStorage.setItem("productosTimestamp", Date.now()); // Guardar marca de tiempo
      setProductos(productosData);
    } catch (error) {
      console.error("Error al cargar productos desde Firebase:", error);
    }
  };

  // Función para verificar si los datos locales están actualizados
  const verificarActualizacion = async () => {
    const productosLocales = JSON.parse(localStorage.getItem("productos")) || [];
    const timestampLocal = parseInt(localStorage.getItem("productosTimestamp"), 10) || 0;

    // Si no hay datos locales, cargar desde Firebase
    if (!productosLocales.length) {
      await cargarProductosDesdeFirebase();
      return;
    }

    // Verificar si los datos locales están desactualizados (1 día de antigüedad)
    const tiempoActual = Date.now();
    const tiempoTranscurrido = tiempoActual - timestampLocal;
    const unDiaEnMs = 24 * 60 * 60 * 1000; // 1 día en milisegundos

    if (tiempoTranscurrido > unDiaEnMs) {
      console.log("Datos locales desactualizados, verificando cambios...");
      const productosSnapshot = await getDocs(collection(db, "productos"));
      const productosData = productosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Comparar datos locales con datos de Firebase
      const hayCambios = productosLocales.length !== productosData.length || productosData.some((productoFirebase, index) => {
        const productoLocal = productosLocales[index];
        return (
          !productoLocal ||
          productoFirebase.nombre !== productoLocal.nombre ||
          productoFirebase.precio !== productoLocal.precio ||
          productoFirebase.imageUrl !== productoLocal.imageUrl
        );
      });

      if (hayCambios) {
        console.log("Se detectaron cambios en los productos, actualizando...");
        // Guardar nuevos datos en Local Storage
        localStorage.setItem("productos", JSON.stringify(productosData));
        localStorage.setItem("productosTimestamp", Date.now());
        setProductos(productosData);
      } else {
        console.log("Los datos locales están actualizados.");
        setProductos(productosLocales);
      }
    } else {
      console.log("Usando datos locales.");
      setProductos(productosLocales);
    }
  };

  useEffect(() => {
    verificarActualizacion();
  }, []);

  const handleVerDetalle = (id) => {
    navigate(`/productos/${id}`); // Navegar a la vista de detalle
  };

  return (
    <div>
      <h2>Productos</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {productos.map((producto) => (
          <div
            key={producto.id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
            onClick={() => handleVerDetalle(producto.id)}
          >
            <img
              src={producto.imageUrl}
              alt={producto.nombre}
              style={{ width: "100px", height: "100px", objectFit: "cover" }}
            />
            <h3>{producto.nombre}</h3>
            <p>${producto.precio.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MostrarProductos;
