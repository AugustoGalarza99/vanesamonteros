import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import Swal from 'sweetalert2';
import './AgregarServicio.css'

const AgregarServicios = () => {
    const [nombreServicio, setNombreServicio] = useState('');
    const [duracion, setDuracion] = useState('');
    const [precio, setPrecio] = useState('');
    const [servicios, setServicios] = useState([]);
    const [editandoServicio, setEditandoServicio] = useState(null);
    const [editDuracion, setEditDuracion] = useState('');
    const [editPrecio, setEditPrecio] = useState('');

    // Cargar servicios al montar, solo si servicios está vacío
    const fetchServicios = async () => {
        if (servicios.length === 0) {
            console.log('Fetching servicios from Firebase'); // <-- Log de control
            const serviciosSnapshot = await getDocs(collection(db, 'servicios'));
            const serviciosList = serviciosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setServicios(serviciosList);
        }
    };

    useEffect(() => {
        fetchServicios();
    }, []);

    // Agregar servicio sin recargar desde Firebase
    const handleAgregarServicio = async (e) => {
        e.preventDefault();
        console.log('Adding new servicio to Firebase'); // <-- Log de control
        try {
            const newServicio = {
                nombre: nombreServicio,
                duracion: parseInt(duracion),
                precio: parseFloat(precio)
            };
            const docRef = await addDoc(collection(db, 'servicios'), newServicio);
            setServicios([...servicios, { id: docRef.id, ...newServicio }]); // Actualizamos servicios en el frontend
            Swal.fire({
                title: 'Servicio agregado correctamente',
                text: 'Para modificar precios, duracion de tiempo o eliminar servicio revisa la seccion inferior',
                icon: 'success',
                background: 'black', 
                color: 'white', 
                confirmButtonText: 'Ok'
            });
            setNombreServicio(''); setDuracion(''); setPrecio('');
        } catch (error) {
            console.error('Error agregando servicio:', error);
            Swal.fire({
                title: 'Error al agregar el servicio',
                icon: 'error',
                background: 'black', 
                color: 'white', 
                confirmButtonText: 'Ok'
            });
        }
    };

    // Eliminar servicio sin recargar desde Firebase
    const handleEliminarServicio = async (id) => {
        console.log(`Deleting servicio with ID: ${id} from Firebase`); // <-- Log de control
        try {
            await deleteDoc(doc(db, 'servicios', id));
            setServicios(servicios.filter(servicio => servicio.id !== id)); // Actualizamos servicios en el frontend
            Swal.fire({
                title: 'Servicio eliminado correctamente',
                icon: 'success',
                background: 'black', 
                color: 'white', 
                confirmButtonText: 'Ok'
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

    // Guardar cambios en la edición sin recargar desde Firebase
    const handleGuardarCambios = async (id) => {
        console.log(`Updating servicio with ID: ${id} in Firebase`); // <-- Log de control
        try {
            const updatedServicio = {
                duracion: parseInt(editDuracion),
                precio: parseFloat(editPrecio)
            };
            await updateDoc(doc(db, 'servicios', id), updatedServicio);
            setServicios(servicios.map(servicio =>
                servicio.id === id ? { ...servicio, ...updatedServicio } : servicio
            )); // Actualizamos servicios en el frontend
            setEditandoServicio(null); // Salir del modo edición
            Swal.fire({
                title: 'Cambios guardados correctamente',
                icon: 'success',
                background: 'black', 
                color: 'white', 
                confirmButtonText: 'Ok'
            });
        } catch (error) {
            console.error('Error guardando cambios del servicio:', error);
            Swal.fire('Error al guardar cambios', '', 'error');
        }
    };

    return (
        <div>
            <h2>Agregar Servicio</h2>
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
