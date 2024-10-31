// AgregarServicios.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig'; // Asegúrate de que esta sea la ruta correcta
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import './AgregarServicio.css'

const AgregarServicios = () => {
    const [nombreServicio, setNombreServicio] = useState('');
    const [duracion, setDuracion] = useState(''); // Duración en minutos
    const [precio, setPrecio] = useState(''); // Precio del servicio
    const [mensaje, setMensaje] = useState('');
    const [servicios, setServicios] = useState([]); // Estado para almacenar los servicios
    const [editandoServicio, setEditandoServicio] = useState(null); // Estado para almacenar el servicio que se está editando
    const [editDuracion, setEditDuracion] = useState('');
    const [editPrecio, setEditPrecio] = useState('');

    // Función para obtener los servicios de la base de datos
    const fetchServicios = async () => {
        console.log('Fetching servicios from Firebase'); // <-- Log de control
        const serviciosSnapshot = await getDocs(collection(db, 'servicios'));
        const serviciosList = serviciosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setServicios(serviciosList);
    };

    useEffect(() => {
        fetchServicios(); // Cargar los servicios al montar el componente
    }, []);

    // Función para agregar un nuevo servicio
    const handleAgregarServicio = async (e) => {
        e.preventDefault(); // Previene el comportamiento por defecto del formulario
        console.log('Adding new servicio to Firebase'); // <-- Log de control
        try {
            const serviciosRef = collection(db, 'servicios'); // Referencia a la colección de servicios
            await addDoc(serviciosRef, {
                nombre: nombreServicio,
                duracion: parseInt(duracion), // Convertir a número entero
                precio: parseFloat(precio) // Convertir a número flotante
            });
            Swal.fire({
                title: 'Servicio agregado correctamente',
                text: 'Para modificar precios, duracion de tiempo o eliminar servicio revisa la seccion inferior',
                icon: 'success',
                background: 'black', 
                color: 'white', 
                confirmButtonText: 'Ok'
            });
            setNombreServicio('');
            setDuracion('');
            setPrecio('');
            fetchServicios(); // Refrescar la lista de servicios
        } catch (error) {
            console.error('Error agregando servicio:', error);
            setMensaje('Error al agregar servicio.');
            Swal.fire({
                title: 'Error al agregar el servicio',
                icon: 'error',
                background: 'black', 
                color: 'white', 
                confirmButtonText: 'Ok'
            });
        }
    };

    // Función para eliminar un servicio
    const handleEliminarServicio = async (id) => {
        console.log(`Deleting servicio with ID: ${id} from Firebase`); // <-- Log de control
        try {
            await deleteDoc(doc(db, 'servicios', id));
            Swal.fire({
                title: 'Servicio eliminado correctamente',
                icon: 'success',
                background: 'black', 
                color: 'white', 
                confirmButtonText: 'Ok'
            });
            fetchServicios(); // Refrescar la lista de servicios
        } catch (error) {
            console.error('Error eliminando servicio:', error);
        }
    };

    // Función para habilitar la edición de un servicio
    const handleEditarServicio = (servicio) => {
        setEditandoServicio(servicio.id);
        setEditDuracion(servicio.duracion);
        setEditPrecio(servicio.precio);
    };

    // Función para guardar los cambios realizados
    const handleGuardarCambios = async (id) => {
        console.log(`Updating servicio with ID: ${id} in Firebase`); // <-- Log de control
        try {
            const servicioRef = doc(db, 'servicios', id);
            await updateDoc(servicioRef, { 
                duracion: parseInt(editDuracion), 
                precio: parseFloat(editPrecio) 
            });
            setEditandoServicio(null); // Finalizar edición
            fetchServicios(); // Refrescar la lista de servicios
        } catch (error) {
            console.error('Error guardando cambios del servicio:', error);
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
            {mensaje && <p>{mensaje}</p>} {/* Muestra mensaje de estado */}

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
