import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import Swal from 'sweetalert2';
import "./AdminProductos.css";

const AdminProductos = () => {
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState(""); // Para buscar productos
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [nuevoPrecio, setNuevoPrecio] = useState({});

  const cargarProductosDesdeFirebase = async () => {
    try {
      const productosSnapshot = await getDocs(collection(db, "productos"));
      const productosData = productosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return productosData;
    } catch (error) {
      console.error("Error al cargar productos desde Firebase:", error);
      return [];
    }
  };

  // Cargar productos desde Firestore
  const cargarProductos = async (forzarDesdeFirebase = false) => {
    try {
      if (!forzarDesdeFirebase) {
        const productosLocales = JSON.parse(localStorage.getItem("adminProductos")) || [];
        const timestampLocal = parseInt(localStorage.getItem("adminProductosTimestamp"), 10) || 0;
  
        const unDiaEnMs = 24 * 60 * 60 * 1000;
        const tiempoActual = Date.now();
        const tiempoTranscurrido = tiempoActual - timestampLocal;
  
        if (productosLocales.length && tiempoTranscurrido < unDiaEnMs) {
          setProductos(productosLocales);
          setProductosFiltrados(productosLocales);
          return;
        }
      }
  
     /*console.log("Cargando productos desde Firebase...");*/
      const productosData = await cargarProductosDesdeFirebase();
  
      localStorage.setItem("adminProductos", JSON.stringify(productosData));
      localStorage.setItem("adminProductosTimestamp", Date.now());
  
      setProductos(productosData);
      setProductosFiltrados(productosData);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // Manejar búsqueda de productos
  useEffect(() => {
    if (filtro.trim() === "") {
      setProductosFiltrados(productos);
    } else {
      setProductosFiltrados(
        productos.filter((producto) =>
          producto.nombre.toLowerCase().includes(filtro.toLowerCase())
        )
      );
    }
  }, [filtro, productos]);

  // Manejar eliminación de productos
  const eliminarProducto = async (id) => {
    try {
      await deleteDoc(doc(db, "productos", id));
      Swal.fire({
        title: "Producto eliminado",
        text: "Haz eliminado el producto con éxito",
        icon: "success",
        background: "black",
        color: "white",
        confirmButtonText: "Ok",
      });
  
      const productosActualizados = await cargarProductosDesdeFirebase();
      localStorage.setItem("adminProductos", JSON.stringify(productosActualizados));
      localStorage.setItem("adminProductosTimestamp", Date.now());
      setProductos(productosActualizados);
      setProductosFiltrados(productosActualizados);
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      Swal.fire({
        title: "Error",
        text: "Error al intentar eliminar el producto",
        icon: "error",
        background: "black",
        color: "white",
        confirmButtonText: "Ok",
      });
    }
  };

  // Manejar actualización del precio
  const actualizarPrecio = async (id) => {
    try {
      const precio = parseFloat(nuevoPrecio[id]);
      if (isNaN(precio) || precio <= 0) {
        Swal.fire({
          title: "Error",
          text: "Introduce un precio válido",
          icon: "error",
          background: "black",
          color: "white",
          confirmButtonText: "Ok",
        });
        return;
      }
  
      await updateDoc(doc(db, "productos", id), { precio });
      Swal.fire({
        title: "Precio actualizado",
        text: "Haz actualizado el precio con éxito",
        icon: "success",
        background: "black",
        color: "white",
        confirmButtonText: "Ok",
      });
  
      const productosActualizados = await cargarProductosDesdeFirebase();
      localStorage.setItem("adminProductos", JSON.stringify(productosActualizados));
      localStorage.setItem("adminProductosTimestamp", Date.now());
      setProductos(productosActualizados);
      setProductosFiltrados(productosActualizados);
  
      setNuevoPrecio({ ...nuevoPrecio, [id]: "" });
    } catch (error) {
      console.error("Error al actualizar el precio:", error);
      Swal.fire({
        title: "Error",
        text: "Error al intentar modificar el precio",
        icon: "error",
        background: "black",
        color: "white",
        confirmButtonText: "Ok",
      });
    }
  };

  return (
    <div className="admin-productos-container">
      <h2>Administrar Productos</h2>

      {/* Barra de búsqueda */}
      <input
        type="text"
        className="admin-productos-search"
        placeholder="Buscar producto por nombre..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />

      {productosFiltrados.length > 0 ? (
        <div className="admin-productos-grid">
          {productosFiltrados.map((producto) => (
            <div key={producto.id} className="admin-producto-card">
              <h3 className="admin-producto-title">{producto.nombre}</h3>
              <p className="admin-producto-price">Precio: ${producto.precio.toFixed(2)}</p>
              <input
                type="number"
                className="admin-producto-input"
                placeholder="Nuevo precio"
                value={nuevoPrecio[producto.id] || ""}
                onChange={(e) =>
                  setNuevoPrecio({ ...nuevoPrecio, [producto.id]: e.target.value })
                }
              />
              <div className="admin-producto-buttons">
                <button
                  className="admin-producto-update"
                  onClick={() => actualizarPrecio(producto.id)}
                >
                  Cambiar Precio
                </button>
                <button
                  className="admin-producto-delete"
                  onClick={() => eliminarProducto(producto.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No se encontraron productos.</p>
      )}
    </div>
  );
};

export default AdminProductos;
