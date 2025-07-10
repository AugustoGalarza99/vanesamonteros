import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig"; // Asegúrate de importar auth
import GeneradorCodigo from "../GeneradorCodigo/GeneradorCodigo";

const AccesoCodigos = () => {
  const [codigo, setCodigo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const obtenerCodigo = async () => {
      try {
        const user = auth.currentUser; // Obtener usuario autenticado
        if (!user) {
          setError("Usuario no autenticado.");
          setLoading(false);
          return;
        }
        const docRef = doc(db, "codigos_verificacion", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCodigo(docSnap.data());
        } else {
          setError("No se encontró un código de verificación.");
        }
      } catch (err) {
        setError("Error al cargar el código de verificación.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    obtenerCodigo();
  }, []);

  if (loading) {
    return <div>Cargando código de verificación...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="codigos-admin">
      <h2 className="codigos-title">Tu Código de Verificación</h2>
      <div className="codigos-grid">
        <div className="codigo-card">
          <h4>{codigo?.nombre}</h4>
          <p className="codigo-texto"><strong>Código:</strong> {codigo?.codigoVerificacion}</p>
        </div>
      </div>
      <GeneradorCodigo/>
    </div>
  );
};

export default AccesoCodigos;
