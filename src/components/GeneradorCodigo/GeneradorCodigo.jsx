// src/components/GeneradorCodigo/GeneradorCodigo.jsx
import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Asegúrate de que la ruta sea correcta
import './GeneradorCodigo.css'

const GeneradorCodigo = () => {
    const [codigo, setCodigo] = useState(null);
    const [loading, setLoading] = useState(false);

    // Función para generar y almacenar el código
    const generarCodigo = async () => {
        setLoading(true);
        const codigoGenerado = Math.floor(100000 + Math.random() * 900000); // Código aleatorio de 6 dígitos
        setCodigo(codigoGenerado); // Mostrar el código generado al peluquero

        try {
            // Guardar el código en Firestore
            await setDoc(doc(db, 'codigos_verificacion', 'codigo_actual'), {
                codigoVerificacion: codigoGenerado,
            });
            console.log("Código guardado en Firebase");
        } catch (error) {
            console.error("Error al guardar el código en Firebase:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='code'>
            <h3>Mi agenda</h3>
            <button className='button-codigo' onClick={generarCodigo} disabled={loading}>
                {loading ? 'Generando...' : 'Generar Código'}
            </button>
            {codigo && (
                <div className='div-code'>
                    <p><strong>Código generado:</strong> {codigo}</p>
                    <p>Este código debe ser compartido con el cliente para su verificación.</p>
                </div>
            )}
        </div>
    );
};

export default GeneradorCodigo;
