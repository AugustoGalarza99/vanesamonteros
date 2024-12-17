import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const DetalleProducto = () => {
  const { id } = useParams();
  const [producto, setProducto] = useState(null);

  useEffect(() => {
    const fetchProducto = async () => {
      const productoDoc = await getDoc(doc(db, "productos", id));
      if (productoDoc.exists()) {
        setProducto(productoDoc.data());
      } else {
        console.error("Producto no encontrado.");
      }
    };
    fetchProducto();
  }, [id]);

  if (!producto) {
    return <p>Cargando...</p>;
  }

  return (
    <div>
      <h2>{producto.nombre}</h2>
      <img
        src={producto.imageUrl}
        alt={producto.nombre}
        style={{ width: "200px", height: "200px", objectFit: "cover" }}
      />
      <p>Precio: ${producto.precio.toFixed(2)}</p>
      <p>{producto.detalle}</p>
    </div>
  );
};

export default DetalleProducto;
