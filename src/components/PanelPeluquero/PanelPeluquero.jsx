import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import FullCalendarDemo from '../FullCalendarDemo/FullCalendarDemo';
import GeneradorCodigo from '../GeneradorCodigo/GeneradorCodigo';
import CalendarioPeluquero from '../CalendarioPeluquero/CalendarioPeluquero';



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
            <GeneradorCodigo />
            {uidPeluquero ? (
                <CalendarioPeluquero uidPeluquero={uidPeluquero} />
            ) : (
                <p>Cargando el UID del peluquero...</p>
            )}
            {/*
            <FullCalendarDemo 
                blockedTimes={blockedTimes} 
                extraShifts={extraShifts} 
            />
            */}
        </div>
    );
};

export default PanelPeluquero;
