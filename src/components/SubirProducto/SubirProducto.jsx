import React, { useState, useEffect } from "react";
import { db, storage } from "../../firebaseConfig";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Swal from 'sweetalert2';
import './SubirProducto.css'

const PRODUCT_LIMIT = 4; // Límite de productos, ajusta según planes

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
      Swal.fire({
          title: 'Error al cargar el producto',
          text: `Has alcanzado el límite de ${PRODUCT_LIMIT} productos.`,
          icon: 'error',
          background: 'black',
          color: 'white',
          confirmButtonText: 'Ok'
      });
      return;
    }

    if (!nombre || !detalle || !precio || !imagen) {
      Swal.fire({
          title: 'Error',
          text: 'Todos los campos son obligatorios',
          icon: 'error',
          background: 'black',
          color: 'white',
          confirmButtonText: 'Ok'
      });
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

      Swal.fire({
          title: 'Carga exitosa',
          text: 'Agregaste un nuevo producto, los cambios se veran reflejados proximamente',
          icon: 'success',
          background: 'black', 
          color: 'white', 
          confirmButtonText: 'Ok'
      });
      setNombre("");
      setDetalle("");
      setPrecio("");
      setImagen(null);
    } catch (error) {
      console.error("Error al subir el producto:", error);
      Swal.fire({
          title: 'Error',
          text: 'Hubo un error en la carga del producto. Por favor intentalo nuevamente',
          icon: 'error',
          background: 'black',
          color: 'white',
          confirmButtonText: 'Ok'
      });
    }
  };

  return (
    <div>
      <h2>Subir Producto</h2>
      <form onSubmit={handleSubmit} className="form-reserva">
        <div className="div-productos">
          <input
            className="input-gral2"
            placeholder="Nombre del producto"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div className="div-productos">
          <textarea
            className="input-gral2"
            placeholder="Detalle del producto"
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            required
          />
        </div>
        <div className="div-productos">
          <input
            placeholder="Precio"
            className="input-gral2"
            type="number"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
          />
        </div>
        <div className="div-productos">
          <input className="input-gral2" type="file" onChange={handleFileChange} required />
        </div>
        <button className="button-producto" type="submit">Subir Producto</button>
        <p>Productos subidos: {productosCount}/{PRODUCT_LIMIT}</p>
      </form>
    </div>
  );
};

export default SubirProducto;
