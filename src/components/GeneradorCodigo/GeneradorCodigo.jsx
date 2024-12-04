// src/components/GeneradorCodigo/GeneradorCodigo.jsx
import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Asegúrate de que la ruta sea correcta
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebaseConfig'; // Asegúrate de importar correctamente
import './GeneradorCodigo.css';

const GeneradorCodigo = () => {
    const [codigo, setCodigo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [user] = useAuthState(auth); // Obtener el usuario autenticado

    // Función para generar y almacenar el código
    const generarCodigo = async () => {
        if (!user) {
            console.error("El usuario no está autenticado.");
            return;
        }

        setLoading(true);
        const codigoGenerado = Math.floor(100000 + Math.random() * 900000); // Código aleatorio de 6 dígitos
        setCodigo(codigoGenerado); // Mostrar el código generado al peluquero

        try {
            // Guardar el código en Firestore bajo la uid del usuario
            const userDocRef = doc(db, 'codigos_verificacion', user.uid);
            await setDoc(userDocRef, {
                codigoVerificacion: codigoGenerado,
            });
            console.log("Código guardado en Firebase para el usuario:", user.uid);
        } catch (error) {
            console.error("Error al guardar el código en Firebase:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="code">
            <h3>Mi agenda</h3>
            <button className="button-codigo" onClick={generarCodigo} disabled={loading}>
                {loading ? 'Generando...' : 'Generar Código'}
            </button>
            {codigo && (
                <div className="div-code">
                    <p><strong>Código generado:</strong> {codigo}</p>
                    <p>Este código debe ser compartido con el cliente para su verificación.</p>
                </div>
            )}
        </div>
    );
};

export default GeneradorCodigo;

