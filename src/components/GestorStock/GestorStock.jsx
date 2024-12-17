import React, { useState } from "react";
import { db, storage } from "../../firebaseConfig"; // Asegúrate de tener configurado Firestore y Storage
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { TextField, Button } from "@mui/material";

const GestorStock = () => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [foto, setFoto] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const subirProducto = async () => {
    try {
      if (!nombre || !precio || !cantidad || !foto) {
        setMensaje("Todos los campos son obligatorios.");
        return;
      }

      const storageRef = ref(storage, `productos/${foto.name}`);
      await uploadBytes(storageRef, foto);
      const urlFoto = await getDownloadURL(storageRef);

      const producto = {
        nombre,
        descripcion,
        precio: parseFloat(precio),
        cantidad: parseInt(cantidad, 10),
        foto: urlFoto,
      };

      await addDoc(collection(db, "productos"), producto);
      setMensaje("Producto agregado exitosamente.");
      setNombre("");
      setDescripcion("");
      setPrecio("");
      setCantidad("");
      setFoto(null);
    } catch (error) {
      console.error("Error al agregar producto:", error);
      setMensaje("Error al agregar producto. Intenta nuevamente.");
    }
  };
  return (
    <div>
      <h2>Gestor de Stock</h2>
      <TextField
        label="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        fullWidth
      />
      <TextField
        label="Descripción"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        fullWidth
      />
      <TextField
        label="Precio"
        type="number"
        value={precio}
        onChange={(e) => setPrecio(e.target.value)}
        fullWidth
      />
      <TextField
        label="Cantidad"
        type="number"
        value={cantidad}
        onChange={(e) => setCantidad(e.target.value)}
        fullWidth
      />
      <input
        type="file"
        onChange={(e) => setFoto(e.target.files[0])}
        accept="image/*"
      />
      <Button variant="contained" color="primary" onClick={subirProducto}>
        Agregar Producto
      </Button>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
};

export default GestorStock;
