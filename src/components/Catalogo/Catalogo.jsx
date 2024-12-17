import React, { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const Catalogo = () => {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const cargarProductos = async () => {
      const snapshot = await getDocs(collection(db, "productos"));
      const listaProductos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProductos(listaProductos);
    };

    cargarProductos();
  }, []);

  return (
    <div>
      <h1>Catálogo de Productos</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {productos.map((producto) => (
          <div key={producto.id} style={{ border: "1px solid #ccc", padding: "10px" }}>
            <img
              src={producto.foto}
              alt={producto.nombre}
              style={{ width: "100px", height: "100px", objectFit: "cover" }}
            />
            <h3>{producto.nombre}</h3>
            <p>{producto.descripcion}</p>
            <p>Precio: ${producto.precio.toFixed(2)}</p>
            <p>Stock: {producto.cantidad}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Catalogo;
