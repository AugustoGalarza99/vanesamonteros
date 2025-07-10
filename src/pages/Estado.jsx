import React from 'react';
import EstadoPeluquero from '../components/EstadoPeluquero/EstadoPeluquero';
import EstadoDemoras from '../components/EstadoDemoras/EstadoDemoras';
import RecomendacionesClientes from "../components/RecomendacionesClientes/RecomendacionesClientes"


const Estado = () => {
  return (
    <div className='div-estado'>
        <EstadoPeluquero />
        <EstadoDemoras />
        <RecomendacionesClientes />
    </div>
  );
};

export default Estado;