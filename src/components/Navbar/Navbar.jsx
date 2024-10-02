// src/components/Navbar.js
import React, { useState } from 'react';
import './Navbar.css'; // Agregaremos los estilos luego
import { Link } from 'react-router-dom'; // Necesario cuando configures rutas

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <h1>Peluquería</h1>
      </div>
      <div className={`navbar-menu ${isOpen ? 'open' : ''}`}>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/reservar-turno">Reservar Turno</Link></li>
          <li><Link to="/estado">Estado</Link></li>
          <li><Link to="/productos">Productos</Link></li>
          <li><Link to="/login">Iniciar Sesión</Link></li>
        </ul>
      </div>
      <div className="navbar-hamburguer" onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>
    </nav>
  );
};

export default Navbar;
