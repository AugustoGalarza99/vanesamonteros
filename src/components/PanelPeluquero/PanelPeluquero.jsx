// PanelPeluquero.jsx
import React from 'react';
import GeneradorCodigo from '../GeneradorCodigo/GeneradorCodigo';
import BloquearHorario from '../BloquearHorario/BloquearHorario';
import FullCalendarDemo from '../FullCalendarDemo/FullCalendarDemo';
import AgregarServicios from '../AgregarServicios/AgregarServicios';

const PanelPeluquero = () => {
    return (
        <div>
            <h1>Panel del Peluquero</h1>
            <AgregarServicios />
            <BloquearHorario />
            <FullCalendarDemo />
            {/* Asegúrate de pasar el número de teléfono del cliente que se está gestionando */}
            <GeneradorCodigo />
        </div>
    );
};

export default PanelPeluquero;
