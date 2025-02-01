import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth'; // Importar el hook de autenticación
import { auth } from '../firebaseConfig'; // Importar configuración de Firebase
import Caja from '../components/Caja/Caja'; // Importar el componente Caja

const Finanzas = () => {
  const [user] = useAuthState(auth); // Obtener el usuario autenticado
  const uidPeluquero = user ? user.uid : null;

  /*console.log("UID Peluquero:", uidPeluquero); // Verifica si el UID se obtiene correctamente*/

  return (
    <div>
      {uidPeluquero ? (
        <Caja uidPeluquero={uidPeluquero} />
      ) : (
        <p>No estás autenticado. Inicia sesión como peluquero.</p>
      )}
    </div>
  );
};


export default Finanzas;
