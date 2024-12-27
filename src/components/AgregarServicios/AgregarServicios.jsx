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
            Swal.fire('Error al eliminar el servicio', '', 'error');
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
        <div>
            <h2 className='h2-service'>Agregar Servicio</h2>
            <form onSubmit={handleAgregarServicio} className='form-service'>
                <div className='div-service'>
                    <input
                        className='input-service'
                        type="text"
                        placeholder="Nombre del servicio"
                        value={nombreServicio}
                        onChange={(e) => setNombreServicio(e.target.value)}
                        required
                    />
                </div>
                <div className='div-service'>
                    <input
                        className='input-service'
                        type="number"
                        placeholder="Duración en minutos"
                        value={duracion}
                        onChange={(e) => setDuracion(e.target.value)}
                        required
                    />
                </div>
                <div className='div-service'>
                    <input
                        className='input-service'
                        type="number"
                        placeholder="Precio del servicio"
                        value={precio}
                        onChange={(e) => setPrecio(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className='button-service'>Agregar Servicio</button>
            </form>

            <h3>Lista de Servicios</h3>
            <ul>
                {servicios.map(servicio => (
                    <li key={servicio.id} className='li-service'>
                        <strong>{servicio.nombre}</strong>
                        {editandoServicio === servicio.id ? (
                            <>
                                <div className='div-config'>
                                    Duración: 
                                    <input 
                                        className='input-service'
                                        type="number" 
                                        value={editDuracion} 
                                        onChange={(e) => setEditDuracion(e.target.value)} 
                                    />
                                    Precio: $
                                    <input 
                                        className='input-service'
                                        type="number" 
                                        value={editPrecio} 
                                        onChange={(e) => setEditPrecio(e.target.value)} 
                                    />
                                </div>
                                <div>
                                    <button onClick={() => handleGuardarCambios(servicio.id)}>Guardar cambios</button>
                                    <button onClick={() => handleEliminarServicio(servicio.id)}>Eliminar</button>
                                </div>
                            </>
                        ) : (
                            <> 
                                <div>Duración: {servicio.duracion} minutos - Precio: ${servicio.precio}</div>
                                <div>
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
