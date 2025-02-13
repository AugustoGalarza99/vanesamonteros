import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig"; // Asegúrate de importar auth

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
    <div className="codigos">
      <h3>Tu Código de Verificación</h3>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Código de Verificación</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{codigo?.nombre}</td>
            <td>{codigo?.codigoVerificacion}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AccesoCodigos;
