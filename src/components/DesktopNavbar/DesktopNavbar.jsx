import React, { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './DesktopNavbar.css';
import { FiHome, FiUser, FiInfo, FiClock, FiXCircle, FiClipboard, FiBriefcase, FiPieChart, FiShoppingCart } from 'react-icons/fi';
import { RxCalendar } from "react-icons/rx";

function DesktopNavbar({ isPeluquero }) {
  const [user] = useAuthState(auth);

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
    <nav className="desktop-navbar">
      <ul>
        <li><Link to="/"><FiHome size={24} /> Inicio</Link></li>
        <li><Link to="/estado"><FiInfo size={24} /> Estado</Link></li>
        <li><Link to="/productos"><FiShoppingCart size={24} /> Productos</Link></li>
        {isPeluquero && (
          <>
            <li><Link to="/agenda"><FiClipboard size={24} /> Agenda</Link></li>
            <li><Link to="/servicios"><FiBriefcase size={24} /> Servicios</Link></li>
            <li><Link to="/horarios"><FiClock size={24} /> Horarios</Link></li>
            <li><Link to="/reservamanual"><RxCalendar size={24} /> Reserva manual</Link></li>
            <li><Link to="/finanzas"><FiPieChart size={24} /> Finanzas</Link></li>
            <li><Link to="/administracion"><FiUser size={24} /> Administracion</Link></li>
          </>
        )}
        {user ? (
          <li>
            <a onClick={() => auth.signOut()}>
              <FiXCircle size={24} /> Cerrar Sesión
            </a>
          </li>
        ) : (
          <li><Link to="/login"><FiUser size={24} /> Iniciar Sesión</Link></li>
        )}
      </ul>
    </nav>
  );
}

export default DesktopNavbar;
