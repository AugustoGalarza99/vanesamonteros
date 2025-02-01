import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth'; // Importar el hook de autenticación
import { auth } from '../firebaseConfig'; // Importar configuración de Firebase
import Reservas from '../components/Reservas/Reservas';


const Turnos = () => {
  const [user] = useAuthState(auth); // Obtener el usuario autenticado
  const uidPeluquero = user ? user.uid : null;

  /*console.log("UID Peluquero:", uidPeluquero); // Verifica si el UID se obtiene correctamente*/

  return (
    <div>
      {uidPeluquero ? (
        <Reservas uidPeluquero={uidPeluquero} />
      ) : (
        <p>No estás autenticado. Inicia sesión como peluquero.</p>
      )}
    </div>
  );
};


export default Turnos;