import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth'; // Importar hooks de autenticación
import { auth } from '../firebaseConfig'; // Importar la configuración de Firebase
import WorkScheduleConfig from '../components/WorkScheduleConfig/WorkScheduleConfig';
import TurnoConfig from '../components/TurnoConfig/TurnoConfig';
import WorkScheduleManager from '../components/WorkScheduleManager/WorkScheduleManager';


const Horarios = () => {
    const [user] = useAuthState(auth); // Obtener el usuario autenticado

  // Solo pasamos uidPeluquero si el usuario está autenticado
  const uidPeluquero = user ? user.uid : null;
  return (
    <div>

     {/* {uidPeluquero ? (
        <WorkScheduleManager uidPeluquero={uidPeluquero}/>
      ) : (
        <p>No estás autenticado. Inicia sesión como peluquero.</p>
      )}


        {uidPeluquero && <TurnoConfig uidPeluquero={uidPeluquero} />}*/}

        {uidPeluquero ? (
        <WorkScheduleConfig uidPeluquero={uidPeluquero}/>
      ) : (
        <p>No estás autenticado. Inicia sesión como peluquero.</p>
      )}
    </div>
  );
};

export default Horarios;