import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import "./AdminProductos.css";

const AdminProductos = () => {
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState(""); // Para buscar productos
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [nuevoPrecio, setNuevoPrecio] = useState({});

  // Cargar productos desde Firestore
  const cargarProductos = async () => {
    try {
      const productosLocales = JSON.parse(localStorage.getItem("adminProductos")) || [];
      const timestampLocal = parseInt(localStorage.getItem("adminProductosTimestamp"), 10) || 0;

      const unDiaEnMs = 24 * 60 * 60 * 1000; // 1 día
      const tiempoActual = Date.now();
      const tiempoTranscurrido = tiempoActual - timestampLocal;

      if (productosLocales.length && tiempoTranscurrido < unDiaEnMs) {
        console.log("Usando productos locales.");
        setProductos(productosLocales);
        setProductosFiltrados(productosLocales);
      } else {
        console.log("Cargando productos desde Firebase...");
        const productosSnapshot = await getDocs(collection(db, "productos"));
        const productosData = productosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        localStorage.setItem("adminProductos", JSON.stringify(productosData));
        localStorage.setItem("adminProductosTimestamp", Date.now());

        setProductos(productosData);
        setProductosFiltrados(productosData);
      }
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
      alert("Producto eliminado correctamente.");
      cargarProductos(); // Recargar productos después de eliminar
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      alert("Hubo un error al eliminar el producto.");
    }
  };

  // Manejar actualización del precio
  const actualizarPrecio = async (id) => {
    try {
      const precio = parseFloat(nuevoPrecio[id]);
      if (isNaN(precio) || precio <= 0) {
        alert("Por favor, introduce un precio válido.");
        return;
      }

      await updateDoc(doc(db, "productos", id), { precio });
      alert("Precio actualizado correctamente.");
      setNuevoPrecio({ ...nuevoPrecio, [id]: "" }); // Limpiar campo de precio
      cargarProductos(); // Recargar productos después de actualizar
    } catch (error) {
      console.error("Error al actualizar el precio:", error);
      alert("Hubo un error al actualizar el precio.");
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
