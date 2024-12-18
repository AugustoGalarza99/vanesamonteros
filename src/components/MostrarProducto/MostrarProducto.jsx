import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import "./MostrarProducto.css"; // Archivo CSS para estilos

const MostrarProductos = () => {
  const [productos, setProductos] = useState([]); // Inicia como un array vacío


  const cargarProductosDesdeFirebase = async () => {
    try {
      const productosSnapshot = await getDocs(collection(db, "productos"));
      const productosData = productosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      if (productosData.length > 0) {
        console.log("Productos cargados desde Firebase:", productosData);
        // Guardar datos en localStorage
        localStorage.setItem("productos", JSON.stringify(productosData));
        localStorage.setItem("productosTimestamp", Date.now());
        setProductos(productosData);
      } else {
        console.warn("No se encontraron productos en Firebase.");
      }
    } catch (error) {
      console.error("Error al cargar productos desde Firebase:", error);
    }
  };
  

  const verificarActualizacion = async () => {
    const productosLocales = JSON.parse(localStorage.getItem("productos")) || [];
    
    // Si no hay datos locales o son inválidos, cargar desde Firebase.
    if (!productosLocales.length || !Array.isArray(productosLocales)) {
      console.log("No hay datos locales o son inválidos, cargando desde Firebase...");
      await cargarProductosDesdeFirebase();
      return;
    }
  
    console.log("Verificando si hay cambios en Firebase...");
  
    try {
      const productosSnapshot = await getDocs(collection(db, "productos"));
      const productosData = productosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      // Detectar cambios entre Firebase y los datos locales.
      const hayCambios =
        productosLocales.length !== productosData.length ||
        productosData.some((productoFirebase, index) => {
          const productoLocal = productosLocales[index];
          return (
            !productoLocal ||
            productoFirebase.nombre !== productoLocal.nombre ||
            productoFirebase.precio !== productoLocal.precio ||
            productoFirebase.imageUrl !== productoLocal.imageUrl
          );
        });
  
      if (hayCambios) {
        console.log("Se detectaron cambios en los productos, actualizando datos locales...");
        localStorage.setItem("productos", JSON.stringify(productosData));
        localStorage.setItem("productosTimestamp", Date.now());
        setProductos(productosData);
      } else {
        console.log("Los datos locales están actualizados, usando datos locales.");
        setProductos(productosLocales);
      }
    } catch (error) {
      console.error("Error al verificar cambios en Firebase:", error);
    }
  };
  
  
  

  useEffect(() => {
    verificarActualizacion();
  }, []);

  useEffect(() => {
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
  const unDiaEnMs = 24 * 60 * 60 * 1000;

  if (tiempoTranscurrido > unDiaEnMs) {
    console.log("Datos locales desactualizados, verificando cambios...");
    await cargarProductosDesdeFirebase();
  } else {
    console.log("Usando datos locales.");
    setProductos(productosLocales);
  }
};

  
    verificarActualizacion();
  }, []);
  

  return (
    <div className="productos-container">
      <h2 className="productos-title">Productos</h2>
      <div className="productos-grid">
        {productos.length > 0 ? (
          productos.map((producto) => {
            if (!producto.imageUrl || !producto.nombre || !producto.precio) {
              console.warn("Producto inválido detectado:", producto);
              return null;
            }
  
            return (
              <div key={producto.id} className="producto-card">
                <img
                  src={producto.imageUrl}
                  alt={producto.nombre}
                  className="producto-image"
                />
                <div className="producto-info">
                  <h3 className="producto-title">{producto.nombre}</h3>
                  <p className="producto-description">
                    {producto.detalle?.slice(0, 100) || "Sin descripción"}.
                  </p>
                  <p className="producto-price">${producto.precio.toFixed(2)}</p>
                </div>
              </div>
            );
          })
        ) : (
          <p>No hay productos disponibles.</p>
        )}
      </div>
    </div>
  );
  
};

export default MostrarProductos;
