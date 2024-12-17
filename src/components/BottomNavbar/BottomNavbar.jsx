import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './BottomNavbar.css';
import { FiHome, FiUser, FiMoreVertical, FiInfo, FiClock, FiXCircle, FiClipboard, FiBriefcase, FiPieChart, FiShoppingCart } from 'react-icons/fi';
import { RxCalendar } from "react-icons/rx";

function BottomNavbar({ isPeluquero }) {
  const [user] = useAuthState(auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const checkIfPeluquero = async (user) => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists() && userDoc.data().rol === 'peluquero') {
        isPeluquero(true);
      }
    }
  };

  useEffect(() => {
    if (user) {
      checkIfPeluquero(user);
    }
  }, [user]);

  return (
    <>
      <nav className="bottom-navbar">
        <Link to="/" className="nav-icon">
          <FiHome size={24} /> Reserva
        </Link>
        <Link to="/estado" className="nav-icon">
        <FiInfo size={24} /> Estado
        </Link>
        <Link to="/productos" className='nav-icon'> 
        <FiShoppingCart size={24} /> Productos
        </Link>
        {user ? (
          <div className="nav-icon" onClick={toggleMenu}>
            <FiMoreVertical size={24} /> Mas
          </div>
        ) : (
          <Link to="/login" className="nav-icon">
            <FiUser size={24} /> Login
          </Link>
        )}
      </nav>

      {isMenuOpen && (
        <div className="dropdown-menu">
          <ul>
            <li><Link to="/" onClick={() => setIsMenuOpen(false)}> <RxCalendar size={16} /> Reservar turno</Link></li>
            <li><Link to="/estado" onClick={() => setIsMenuOpen(false)}> <FiInfo size={16} /> Estado</Link></li>
            {isPeluquero && (
              <>
                <li><Link to="/agenda" onClick={() => setIsMenuOpen(false)}> <FiClipboard size={16} /> Agenda</Link></li>
                <li><Link to="/servicios" onClick={() => setIsMenuOpen(false)}> <FiBriefcase size={16} /> Servicios</Link></li>
                <li><Link to="/horarios" onClick={() => setIsMenuOpen(false)}> <FiClock size={16} /> Horarios</Link></li>
                <li><Link to="/reservamanual" onClick={() => setIsMenuOpen(false)}> <RxCalendar size={16} /> Reserva manual</Link></li>
                <li><Link to="/finanzas" onClick={() => setIsMenuOpen(false)}> <FiPieChart size={16} /> Finanzas</Link></li>
                <li><Link to="/administracion" onClick={() => setIsMenuOpen(false)}> <FiUser size={16} /> Administracion</Link></li>
              </>
            )}
            <li><a onClick={() => { auth.signOut(); setIsMenuOpen(false); }}> <FiXCircle size={16} /> Cerrar Sesión</a></li>
          </ul>
        </div>
      )}
    </>
  );
}

export default BottomNavbar;
