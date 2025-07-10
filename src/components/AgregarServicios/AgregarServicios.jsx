import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebaseConfig'; // Asegúrate de importar `auth`
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; // Para obtener el usuario actual
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
    const [uid, setUid] = useState(null); // ID del usuario logueado

    // Obtenemos el usuario logueado
    useEffect(() => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setUid(user.uid);
            } else {
                setUid(null);
            }
        });
    }, []);

    // Cargar servicios al montar
    const fetchServicios = async () => {
        if (!uid) return;
        try {
            const serviciosSnapshot = await getDocs(collection(db, `profesionales/${uid}/servicios`));
            const serviciosList = serviciosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setServicios(serviciosList);
        } catch (error) {
            console.error('Error al cargar los servicios:', error);
        }
    };

    useEffect(() => {
        fetchServicios();
    }, [uid]);

    // Agregar servicio
    const handleAgregarServicio = async (e) => {
        e.preventDefault();
        if (!uid) {
            Swal.fire('Error', 'No se encontró un usuario logueado.', 'error');
            return;
        }
        try {
            const newServicio = {
                nombre: nombreServicio,
                duracion: parseInt(duracion),
                precio: parseFloat(precio)
            };
            const docRef = await addDoc(collection(db, `profesionales/${uid}/servicios`), newServicio);
            setServicios([...servicios, { id: docRef.id, ...newServicio }]);
            Swal.fire({
                    title: "Servicio agregado correctamente",
                    text: " ",
                    icon: "success",
                    background: "black",
                    color: "white",
                    confirmButtonText: "Ok",
                });
            setNombreServicio(''); setDuracion(''); setPrecio('');
        } catch (error) {
            console.error('Error agregando servicio:', error);
            Swal.fire('Error al agregar el servicio', '', 'error');
        }
    };

    // Eliminar servicio
    const handleEliminarServicio = async (id) => {
    if (!uid) return;

    const confirmacion = await Swal.fire({
        title: '¿Eliminar servicio?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c', // rojo
        cancelButtonColor: '#3498db', // azul
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: 'black',
        color: 'white',
    });

    if (confirmacion.isConfirmed) {
        try {
            await deleteDoc(doc(db, `profesionales/${uid}/servicios`, id));
            setServicios(servicios.filter(servicio => servicio.id !== id));
            Swal.fire({
                title: "Servicio eliminado correctamente",
                text: " ",
                icon: "success",
                background: "black",
                color: "white",
                confirmButtonText: "Ok",
            });
        } catch (error) {
            console.error('Error eliminando servicio:', error);
            Swal.fire({
                title: 'Error al eliminar el servicio',
                icon: 'error',
                background: "black",
                color: "white",
                confirmButtonText: "Cerrar"
            });
        }
    }
};



    // Habilitar edición de servicio
    const handleEditarServicio = (servicio) => {
        setEditandoServicio(servicio.id);
        setEditDuracion(servicio.duracion);
        setEditPrecio(servicio.precio);
    };

    // Guardar cambios en la edición
    const handleGuardarCambios = async (id) => {
        if (!uid) return;
        try {
            const updatedServicio = {
                duracion: parseInt(editDuracion),
                precio: parseFloat(editPrecio)
            };
            await updateDoc(doc(db, `profesionales/${uid}/servicios`, id), updatedServicio);
            setServicios(servicios.map(servicio =>
                servicio.id === id ? { ...servicio, ...updatedServicio } : servicio
            ));
            setEditandoServicio(null);
            Swal.fire({
                title: "Cambios guardados correctamente",
                text: " ",
                icon: "success",
                background: "black",
                color: "white",
                confirmButtonText: "Ok",
            })
        } catch (error) {
            console.error('Error guardando cambios del servicio:', error);
            Swal.fire('Error al guardar cambios', '', 'error');
        }
    };

    return (
    <div className="servicios-container">
        <h2 className="servicios-titulo">Agregar Servicio</h2>

        <form onSubmit={handleAgregarServicio} className="servicio-form">
        <input
            className="servicio-input"
            type="text"
            placeholder="Nombre del servicio"
            value={nombreServicio}
            onChange={(e) => setNombreServicio(e.target.value)}
            required
        />
        <input
            className="servicio-input"
            type="number"
            placeholder="Duración en minutos"
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            required
        />
        <input
            className="servicio-input"
            type="number"
            placeholder="Precio del servicio"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
        />
        <button type="submit" className="servicio-btn">
            Agregar Servicio
        </button>
        </form>

        <h3 className="servicio-subtitulo">Lista de Servicios</h3>
        <ul className="servicio-lista">
        {servicios.map((servicio) => (
            <li key={servicio.id} className="servicio-card">
            <strong className="servicio-nombre">{servicio.nombre}</strong>
            {editandoServicio === servicio.id ? (
                <>
                <div className="servicio-editar">
                    <span>
                    Duración:
                    <input
                        type="number"
                        value={editDuracion}
                        onChange={(e) => setEditDuracion(e.target.value)}
                    />
                    </span>
                    <span>
                    Precio: $
                    <input
                        type="number"
                        value={editPrecio}
                        onChange={(e) => setEditPrecio(e.target.value)}
                    />
                    </span>
                </div>
                <div className="servicio-actions">
                    <button onClick={() => handleGuardarCambios(servicio.id)}>Guardar</button>
                    <button onClick={() => handleEliminarServicio(servicio.id)}>Eliminar</button>
                </div>
                </>
            ) : (
                <>
                <div className="servicio-datos">
                    Duración: {servicio.duracion} min · Precio: ${servicio.precio}
                </div>
                <div className="servicio-actions">
                    <button onClick={() => handleEditarServicio(servicio)}>Editar</button>
                    <button onClick={() => handleEliminarServicio(servicio.id)}>Eliminar</button>
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
