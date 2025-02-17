import React from 'react';
import EstadoPeluquero from '../components/EstadoPeluquero/EstadoPeluquero';
import EstadoDemoras from '../components/EstadoDemoras/EstadoDemoras';


const Estado = () => {
  return (
    <div className='div-estado'>
        <EstadoPeluquero />
        <EstadoDemoras />
    </div>
  );
};

export default Estado;