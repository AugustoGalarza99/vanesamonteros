import React, { useState, useEffect } from "react";
import { db, storage } from "../../firebaseConfig";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const PRODUCT_LIMIT = 10; // Límite de productos, ajusta según planes

const SubirProducto = () => {
  const [nombre, setNombre] = useState("");
  const [detalle, setDetalle] = useState("");
  const [precio, setPrecio] = useState("");
  const [imagen, setImagen] = useState(null);
  const [productosCount, setProductosCount] = useState(0);

  // Obtener la cantidad actual de productos
  useEffect(() => {
    const fetchProductos = async () => {
      const productosSnapshot = await getDocs(collection(db, "productos"));
      setProductosCount(productosSnapshot.size); // Cantidad de productos en Firestore
    };
    fetchProductos();
  }, []);

  const handleFileChange = (e) => {
    setImagen(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (productosCount >= PRODUCT_LIMIT) {
      alert(`Has alcanzado el límite de ${PRODUCT_LIMIT} productos.`);
      return;
    }

    if (!nombre || !detalle || !precio || !imagen) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    try {
      // Subir imagen a Firebase Storage
      const storageRef = ref(storage, `productos/${imagen.name}`);
      await uploadBytes(storageRef, imagen);
      const imageUrl = await getDownloadURL(storageRef);

      // Guardar datos en Firestore
      const productosCollection = collection(db, "productos");
      await addDoc(productosCollection, {
        nombre,
        detalle,
        precio: parseFloat(precio),
        imageUrl,
      });

      alert("Producto subido correctamente.");
      setNombre("");
      setDetalle("");
      setPrecio("");
      setImagen(null);
    } catch (error) {
      console.error("Error al subir el producto:", error);
      alert("Hubo un error al subir el producto. Por favor, inténtalo de nuevo.");
    }
  };

  return (
    <div>
      <h2>Subir Producto</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre:</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Detalle:</label>
          <textarea
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Precio:</label>
          <input
            type="number"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Imagen:</label>
          <input type="file" onChange={handleFileChange} required />
        </div>
        <button type="submit">Subir Producto</button>
        <p>Productos subidos: {productosCount}/{PRODUCT_LIMIT}</p>
      </form>
    </div>
  );
};

export default SubirProducto;
