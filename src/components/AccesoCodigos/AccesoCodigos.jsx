import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Ajusta el path de tu configuración de Firebase
import './AccesoCodigos.css'

const AccesoCodigos = () => {
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
    <div className='codigos'>
      <h3>Códigos de Verificación</h3>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Código de Verificación</th>
          </tr>
        </thead>
        <tbody>
          {codigos.map((codigo) => (
            <tr key={codigo.uid}>
              <td>{codigo.nombre}</td>
              <td>{codigo.codigoVerificacion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AccesoCodigos;
