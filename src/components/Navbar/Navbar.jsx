import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebaseConfig'; // Asegúrate de tener configurada Firebase correctamente.
import { getDoc, doc } from 'firebase/firestore';
import './Navbar.css'; // Agregaremos los estilos luego
import { Link } from 'react-router-dom'; // Necesario cuando configures rutas

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  const [user] = useAuthState(auth); // Hook para verificar si hay un usuario autenticado
  const [isPeluquero, setIsPeluquero] = useState(false);

  // Función para verificar si el usuario es peluquero
  const checkIfPeluquero = async (user) => {
    if (user) {
      const userRef = doc(db, 'users', user.uid); // Asegúrate de que los usuarios estén guardados en 'users' collection
      const userDoc = await getDoc(userRef);
      if (userDoc.exists() && userDoc.data().rol === 'peluquero') {
        setIsPeluquero(true);
      }
    }
  };

  useEffect(() => {
    if (user) {
      checkIfPeluquero(user);
    }
  }, [user]);

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
