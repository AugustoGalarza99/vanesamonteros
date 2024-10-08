import React, { useState } from 'react';
import GeneradorCodigo from '../GeneradorCodigo/GeneradorCodigo';
import BloquearHorario from '../BloquearHorario/BloquearHorario';
import FullCalendarDemo from '../FullCalendarDemo/FullCalendarDemo';
import AgregarServicios from '../AgregarServicios/AgregarServicios';
import WorkScheduleConfig from '../WorkScheduleConfig/WorkScheduleConfig';
import AgregarTurnoManual from '../AgendarTurnoManual/AgendarTurnoManual'; // Componente para turnos manuales
import TurnDurationConfig from '../TurnDurationConfig/TurnDurationConfig';

const PanelPeluquero = () => {
    const [blockedTimes, setBlockedTimes] = useState([]); // Estado para horarios bloqueados
    const [extraShifts, setExtraShifts] = useState([]);   // Estado para turnos extra

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
            
            {/* Componente para bloquear horarios */}
            <BloquearHorario onAddBlockedTime={handleAddBlockedTime} />

            {/* Componente para agregar turnos extra manualmente */}
            <AgregarTurnoManual onAddExtraShift={handleAddExtraShift} />

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
