// AgregarServicios.jsx
import React, { useState } from 'react';
import { db } from '../../firebaseConfig'; // Asegúrate de que esta sea la ruta correcta
import { collection, addDoc } from 'firebase/firestore';

const AgregarServicios = () => {
    const [nombreServicio, setNombreServicio] = useState('');
    const [duracion, setDuracion] = useState(''); // Duración en minutos
    const [mensaje, setMensaje] = useState('');

    const handleAgregarServicio = async (e) => {
        e.preventDefault(); // Previene el comportamiento por defecto del formulario
        try {
            const serviciosRef = collection(db, 'servicios'); // Referencia a la colección de servicios
            await addDoc(serviciosRef, {
                nombre: nombreServicio,
                duracion: parseInt(duracion) // Convertir a número entero
            });
            setMensaje('Servicio agregado exitosamente.');
            setNombreServicio('');
            setDuracion('');
        } catch (error) {
            console.error('Error agregando servicio:', error);
            setMensaje('Error al agregar servicio.');
        }
    };

    return (
        <div>
            <h2>Agregar Servicio</h2>
            <form onSubmit={handleAgregarServicio}>
                <div>
                    <input
                        type="text"
                        placeholder="Nombre del servicio"
                        value={nombreServicio}
                        onChange={(e) => setNombreServicio(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <input
                        type="number"
                        placeholder="Duración en minutos"
                        value={duracion}
                        onChange={(e) => setDuracion(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Agregar Servicio</button>
            </form>
            {mensaje && <p>{mensaje}</p>} {/* Muestra mensaje de estado */}
        </div>
    );
};

export default AgregarServicios;