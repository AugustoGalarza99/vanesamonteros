import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Swal from 'sweetalert2';
import './AgregarServicio.css';

const AgregarServicios = () => {
  const [nombreServicio, setNombreServicio] = useState('');
  const [duracion, setDuracion] = useState('');
  const [precio, setPrecio] = useState('');
  const [servicios, setServicios] = useState([]);
  const [editandoServicio, setEditandoServicio] = useState(null);
  const [editDuracion, setEditDuracion] = useState('');
  const [editPrecio, setEditPrecio] = useState('');
  const [uid, setUid] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
      else setUid(null);
    });
  }, []);

  // 🔹 Cargar servicios ordenados
  const fetchServicios = async () => {
    if (!uid) return;
    try {
      const q = query(collection(db, `profesionales/${uid}/servicios`), orderBy('orden', 'asc'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServicios(list);
    } catch (error) {
      console.error('Error al cargar los servicios:', error);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, [uid]);

  // 🔹 Agregar servicio con orden
  const handleAgregarServicio = async (e) => {
    e.preventDefault();
    if (!uid) return Swal.fire('Error', 'No se encontró un usuario logueado.', 'error');
    try {
      const newServicio = {
        nombre: nombreServicio,
        duracion: parseInt(duracion),
        precio: parseFloat(precio),
        orden: servicios.length, // último lugar
      };
      const docRef = await addDoc(collection(db, `profesionales/${uid}/servicios`), newServicio);
      setServicios([...servicios, { id: docRef.id, ...newServicio }]);
      Swal.fire('Servicio agregado correctamente', '', 'success');
      setNombreServicio(''); setDuracion(''); setPrecio('');
    } catch (error) {
      console.error('Error agregando servicio:', error);
      Swal.fire('Error al agregar el servicio', '', 'error');
    }
  };

  // 🔹 Eliminar servicio
  const handleEliminarServicio = async (id) => {
    if (!uid) return;
    const confirmacion = await Swal.fire({
      title: '¿Eliminar servicio?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#3498db',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: 'black',
      color: 'white',
    });

    if (confirmacion.isConfirmed) {
      try {
        await deleteDoc(doc(db, `profesionales/${uid}/servicios`, id));
        const nuevos = servicios.filter(s => s.id !== id).map((s, i) => ({ ...s, orden: i }));
        setServicios(nuevos);
        // 🔹 Actualizamos orden en Firestore
        nuevos.forEach(async (s, i) => {
          await updateDoc(doc(db, `profesionales/${uid}/servicios`, s.id), { orden: i });
        });
        Swal.fire('Servicio eliminado correctamente', '', 'success');
      } catch (error) {
        Swal.fire('Error al eliminar el servicio', '', 'error');
      }
    }
  };

  // 🔹 Mover servicio arriba o abajo
  const moverServicio = async (index, direccion) => {
    const nuevoOrden = [...servicios];
    const destino = index + direccion;

    if (destino < 0 || destino >= nuevoOrden.length) return;

    // Intercambiar posiciones
    [nuevoOrden[index], nuevoOrden[destino]] = [nuevoOrden[destino], nuevoOrden[index]];

    // Actualizar orden localmente
    const actualizados = nuevoOrden.map((s, i) => ({ ...s, orden: i }));
    setServicios(actualizados);

    // Guardar en Firestore
    for (let i = 0; i < actualizados.length; i++) {
      await updateDoc(doc(db, `profesionales/${uid}/servicios`, actualizados[i].id), { orden: i });
    }
  };

  // 🔹 Editar
  const handleEditarServicio = (servicio) => {
    setEditandoServicio(servicio.id);
    setEditDuracion(servicio.duracion);
    setEditPrecio(servicio.precio);
  };

  const handleGuardarCambios = async (id) => {
    if (!uid) return;
    try {
      const updated = {
        duracion: parseInt(editDuracion),
        precio: parseFloat(editPrecio)
      };
      await updateDoc(doc(db, `profesionales/${uid}/servicios`, id), updated);
      setServicios(servicios.map(s => s.id === id ? { ...s, ...updated } : s));
      setEditandoServicio(null);
      Swal.fire('Cambios guardados correctamente', '', 'success');
    } catch (error) {
      Swal.fire('Error al guardar cambios', '', 'error');
    }
  };

  return (
    <div className="servicios-container">
      <h2 className="servicios-titulo">Agregar Servicio</h2>

      <form onSubmit={handleAgregarServicio} className="servicio-form">
        <input className="servicio-input" type="text" placeholder="Nombre del servicio"
          value={nombreServicio} onChange={(e) => setNombreServicio(e.target.value)} required />
        <input className="servicio-input" type="number" placeholder="Duración (min)"
          value={duracion} onChange={(e) => setDuracion(e.target.value)} required />
        <input className="servicio-input" type="number" placeholder="Precio"
          value={precio} onChange={(e) => setPrecio(e.target.value)} required />
        <button type="submit" className="servicio-btn">Agregar Servicio</button>
      </form>

      <h3 className="servicio-subtitulo">Lista de Servicios</h3>
      <ul className="servicio-lista">
        {servicios.map((s, index) => (
          <li key={s.id} className="servicio-card">
            <div className="servicio-orden-buttons">
              <button onClick={() => moverServicio(index, -1)}>▲</button>
              <button onClick={() => moverServicio(index, 1)}>▼</button>
            </div>
            <strong className="servicio-nombre">{s.nombre}</strong>
            {editandoServicio === s.id ? (
              <>
                <div className="servicio-editar">
                  <span>Duración: <input type="number" value={editDuracion} onChange={(e) => setEditDuracion(e.target.value)} /></span>
                  <span>Precio: $<input type="number" value={editPrecio} onChange={(e) => setEditPrecio(e.target.value)} /></span>
                </div>
                <div className="servicio-actions">
                  <button onClick={() => handleGuardarCambios(s.id)}>Guardar</button>
                  <button onClick={() => handleEliminarServicio(s.id)}>Eliminar</button>
                </div>
              </>
            ) : (
              <>
                <div className="servicio-datos">Duración: {s.duracion} min · Precio: ${s.precio}</div>
                <div className="servicio-actions">
                  <button onClick={() => handleEditarServicio(s)}>Editar</button>
                  <button onClick={() => handleEliminarServicio(s.id)}>Eliminar</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AgregarServicios;
