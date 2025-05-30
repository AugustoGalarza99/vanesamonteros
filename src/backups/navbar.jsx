import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebaseConfig'; // Asegúrate de tener configurada Firebase correctamente.
import { getDoc, doc } from 'firebase/firestore';
import './Navbar.css'; // Agregaremos los estilos luego
import { Link } from 'react-router-dom'; // Necesario cuando configures rutas
import logo from '../../../public/barber2.jpg'

function Navbar({ isPeluquero }) {
  const [user] = useAuthState(auth); // Verificamos si el usuario está autenticado
  const [isOpen, setIsOpen] = React.useState(false);  // Estado para manejar el menú desplegable

  // Función para alternar el estado del menú
  const toggleMenu = () => {
    setIsOpen(!isOpen);
    const menu = document.querySelector('.navbar-menu');
    menu.classList.toggle('open');
  };

    // Función para cerrar el menú cuando se hace clic en un enlace
    const closeMenu = () => {
      setIsOpen(false);
    };

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
      <Link to="/"><img src={logo} alt="Logo"/></Link>
      </div>
      <div className="navbar">
      <div className={`navbar-menu ${isOpen ? 'open' : ''}`}>
        <ul>
          <li><Link to="/" onClick={closeMenu}>Reservar turno</Link></li>
          <li><Link to="/estado" onClick={closeMenu}>Estado</Link></li>
          {/*<li><Link to="/productos" onClick={closeMenu}>Productos</Link></li>*/}
          {/* Mostrar la opción del Panel Peluquero solo si el usuario es peluquero */}
          {isPeluquero && (
              <>
                <li><Link to="/agenda" onClick={closeMenu}>Agenda</Link></li>
                <li><Link to="/servicios" onClick={closeMenu}>Servicios</Link></li>
                <li><Link to="/horarios" onClick={closeMenu}>Horarios</Link></li>
                <li><Link to="/reservamanual" onClick={closeMenu}>Reserva manual</Link></li>
              </>
          )}
        {user ? (
          <>
            
            <li><a onClick={() => {auth.signOut(); closeMenu(); }}>Cerrar Sesión</a></li>
          </>
        ) : (
          <li><Link to="/login" onClick={closeMenu}>Iniciar sesión</Link></li>
        )}
        </ul>
      </div>
      <div className="navbar-hamburguer" onClick={toggleMenu}>
  {isOpen ? (
    <span className="close-icon">✖</span> // X para cerrar
  ) : (
    <>
      <span className="bar"></span>
      <span className="bar"></span>
      <span className="bar"></span>
    </>
  )}
</div>
      </div>
    </nav>
  );
};

export default Navbar;







snapshot.forEach((docYear) => {
  const meses = docYear.data();
  Object.entries(meses).forEach(([mes, dias]) => {
    Object.entries(dias).forEach(([dia, detalles]) => {
      const servicios = detalles.servicios || {};
      // Aquí no filtramos por UID, simplemente los agregamos
      Object.values(servicios).forEach((servicio) => {
        datosCargados.push({
          ...servicio,
          fecha: new Date(servicio.fecha),
        });
      });
    });
  });
})