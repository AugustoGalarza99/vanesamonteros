import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Ajusta el path de tu configuración de Firebase
import './AccesoCodigosAdmin.css'

const AccesoCodigosAdmin = () => {
  const [codigos, setCodigos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const obtenerCodigos = async () => {
      try {
        const codigosCollection = collection(db, 'codigos_verificacion');
        const querySnapshot = await getDocs(codigosCollection);

        const codigosData = [];
        querySnapshot.forEach((doc) => {
          const uid = doc.id;
          const data = doc.data();

          if (data.codigoVerificacion && data.nombre) {
            codigosData.push({
              uid,
              nombre: data.nombre,
              codigoVerificacion: data.codigoVerificacion,
            });
          }
        });

        setCodigos(codigosData);
      } catch (err) {
        setError('Error al cargar los códigos de verificación.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    obtenerCodigos();
  }, []);

  if (loading) {
    return <div>Cargando códigos de verificación...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="codigos-admin">
      <h2 className="codigos-title">Códigos de Verificación</h2>

      {loading ? (
        <p className="loader-codigos">Cargando códigos de verificación...</p>
      ) : error ? (
        <p className="error-codigos">{error}</p>
      ) : (
        <div className="codigos-grid">
          {codigos.map((codigo) => (
            <div key={codigo.uid} className="codigo-card">
              <h4>{codigo.nombre}</h4>
              <p className="codigo-texto">{codigo.codigoVerificacion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccesoCodigosAdmin;
