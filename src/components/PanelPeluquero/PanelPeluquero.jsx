// PanelPeluquero.jsx
import React from 'react';
import GeneradorCodigo from '../GeneradorCodigo/GeneradorCodigo';
import BloquearHorario from '../BloquearHorario/BloquearHorario';
import FullCalendarDemo from '../FullCalendarDemo/FullCalendarDemo';

const PanelPeluquero = () => {
    return (
        <div>
            <h1>Panel del Peluquero</h1>
            <BloquearHorario />
            <FullCalendarDemo />
            {/* Asegúrate de pasar el número de teléfono del cliente que se está gestionando */}
            <GeneradorCodigo telefono="123456789" />
        </div>
    );
};

export default PanelPeluquero;
