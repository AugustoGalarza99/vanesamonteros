import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import GeneradorCodigo from '../GeneradorCodigo/GeneradorCodigo';
import FullCalendarDemo from '../FullCalendarDemo/FullCalendarDemo';
import AgregarServicios from '../AgregarServicios/AgregarServicios';
import WorkScheduleConfig from '../WorkScheduleConfig/WorkScheduleConfig';
import TurnosExtraForm from '../TurnosExtrasForm/TurnosExtrasForm';

const PanelPeluquero = () => {
    const [blockedTimes, setBlockedTimes] = useState([]); // Estado para horarios bloqueados
    const [extraShifts, setExtraShifts] = useState([]);   // Estado para turnos extra
    const [uidPeluquero, setUidPeluquero] = useState(null);

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          setUidPeluquero(user.uid); // Obtenemos el UID del peluquero autenticado
        } else {
          console.log('No hay usuario autenticado.');
        }
      }, []);



    return (
        <div>
            <h1>Panel del Peluquero</h1>
            <FullCalendarDemo 
                blockedTimes={blockedTimes} 
                extraShifts={extraShifts} 
            />
            {/*<TurnosExtraForm  />*/}

            <AgregarServicios />
            <WorkScheduleConfig />
        </div>
    );
};

export default PanelPeluquero;
