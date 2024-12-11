import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './BottomNavbar.css';
import { FiHome, FiHelpCircle, FiUser, FiMoreVertical } from 'react-icons/fi';

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
          <FiHome size={24} />
        </Link>
        <Link to="/estado" className="nav-icon">
          <FiHelpCircle size={24} />
        </Link>
        {user ? (
          <div className="nav-icon" onClick={toggleMenu}>
            <FiMoreVertical size={24} />
          </div>
        ) : (
          <Link to="/login" className="nav-icon">
            <FiUser size={24} />
          </Link>
        )}
      </nav>

      {isMenuOpen && (
        <div className="dropdown-menu">
          <ul>
            <li><Link to="/" onClick={() => setIsMenuOpen(false)}>Reservar turno</Link></li>
            <li><Link to="/estado" onClick={() => setIsMenuOpen(false)}>Estado</Link></li>
            {isPeluquero && (
              <>
                <li><Link to="/agenda" onClick={() => setIsMenuOpen(false)}>Agenda</Link></li>
                <li><Link to="/servicios" onClick={() => setIsMenuOpen(false)}>Servicios</Link></li>
                <li><Link to="/horarios" onClick={() => setIsMenuOpen(false)}>Horarios</Link></li>
                <li><Link to="/reservamanual" onClick={() => setIsMenuOpen(false)}>Reserva manual</Link></li>
              </>
            )}
            <li><a onClick={() => { auth.signOut(); setIsMenuOpen(false); }}>Cerrar Sesión</a></li>
          </ul>
        </div>
      )}
    </>
  );
}

export default BottomNavbar;
