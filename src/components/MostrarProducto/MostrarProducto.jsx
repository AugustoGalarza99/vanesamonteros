import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const MostrarProductos = () => {
  const [productos, setProductos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductos = async () => {
      const productosSnapshot = await getDocs(collection(db, "productos"));
      const productosData = productosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProductos(productosData);
    };
    fetchProductos();
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
