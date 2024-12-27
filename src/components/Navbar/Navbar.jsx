import React from 'react';
import './Navbar.css'; // Agregaremos los estilos luego
import { Link } from 'react-router-dom'; // Necesario cuando configures rutas
import logo from '../../../public/vanesamonteros.png'


function Navbar() { 

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        {/*<p className='tu-logo'>Tu logo</p>*/}
      <Link to="/"><img src={logo} alt="Logo"/></Link>
      </div>
      <div className='div-titulo'>
        <h1 className='titulo-h1'>Monteros Vanesa <br />Espacio </h1>
      </div>
    </nav>
  );
};

export default Navbar;
