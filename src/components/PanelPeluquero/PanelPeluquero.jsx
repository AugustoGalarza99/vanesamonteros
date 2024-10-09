import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import GeneradorCodigo from '../GeneradorCodigo/GeneradorCodigo';

import FullCalendarDemo from '../FullCalendarDemo/FullCalendarDemo';
import AgregarServicios from '../AgregarServicios/AgregarServicios';
import WorkScheduleConfig from '../WorkScheduleConfig/WorkScheduleConfig';



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

    // Función para agregar horarios bloqueados desde BloquearHorario
    const handleAddBlockedTime = (bloqueo) => {
        setBlockedTimes([...blockedTimes, bloqueo]);
    };

    // Función para agregar turnos extra desde AgregarTurnoManual
    const handleAddExtraShift = (turnoExtra) => {
        setExtraShifts([...extraShifts, turnoExtra]);
    };

    return (
        <div>
            <h1>Panel del Peluquero</h1>
            <AgregarServicios />
            <WorkScheduleConfig />
 
            {/* Pasar los eventos bloqueados y turnos extra a FullCalendarDemo */}
            <FullCalendarDemo 
                blockedTimes={blockedTimes} 
                extraShifts={extraShifts} 
            />
            <GeneradorCodigo />
        </div>
    );
};

export default PanelPeluquero;
