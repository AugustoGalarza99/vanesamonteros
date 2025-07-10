import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRole } from '../../RoleContext'; // Importar el contexto de roles
import { auth } from '../../firebaseConfig';
import './BottomNavbar.css';
import { FiHome, FiUser, FiMoreVertical, FiInfo, FiClock, FiXCircle, FiClipboard, FiBriefcase, FiPieChart, FiShoppingCart, FiTool,} from 'react-icons/fi';
import { RxCalendar } from 'react-icons/rx';

function BottomNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, role } = useRole(); // Obtener el usuario y el rol desde el contexto

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      /*console.log('Sesión cerrada.');*/
      setIsMenuOpen(false);
    });
  };

  return (
    <>
      <nav className="bottom-navbar">
        <Link to="/" className="nav-icon"><FiHome size={24} /> Reserva</Link>
        <Link to="/estado" className="nav-icon"><FiInfo size={24} /> Estado</Link>
        {/*<Link to="/productos" className="nav-icon"><FiShoppingCart size={24} /> Productos</Link>*/}
        {user ? (
          <div className="nav-icon" onClick={toggleMenu}>
            <FiMoreVertical size={24} /> Más</div>
        ) : (
          <Link to="/login" className="nav-icon"><FiUser size={24} /> Login</Link>
        )}
      </nav>

      {isMenuOpen && (
        <div className="dropdown-menu">
          <ul className='ul-nav'>
            <li><Link to="/" onClick={() => setIsMenuOpen(false)}><RxCalendar size={16} /> Reservar turno</Link></li>
            <li><Link to="/estado" onClick={() => setIsMenuOpen(false)}><FiInfo size={16} /> Estado</Link></li>
            {role === 'peluquero' && (
              <>
                {/*<li><Link to="/agenda" onClick={() => setIsMenuOpen(false)}><FiClipboard size={16} /> Agenda 1</Link></li>*/}
                <li><Link to="/agenda" onClick={() => setIsMenuOpen(false)}><FiClipboard size={16} /> Agenda</Link></li>
                <li><Link to="/servicios" onClick={() => setIsMenuOpen(false)}><FiBriefcase size={16} /> Servicios</Link></li>
                <li><Link to="/horarios" onClick={() => setIsMenuOpen(false)}><FiClock size={16} /> Horarios</Link></li>
                <li><Link to="/reservamanual" onClick={() => setIsMenuOpen(false)}><RxCalendar size={16} /> Reserva manual</Link></li>
                <li><Link to="/finanzas" onClick={() => setIsMenuOpen(false)}><FiPieChart size={16} /> Finanzas</Link></li>
                <li><Link to="/miperfil" onClick={() => setIsMenuOpen(false)}><FiUser size={16} /> Mi perfil</Link></li>
              </>
            )}
            {role === 'administrador' && (
              <>
                <li><Link to="/reservamanual" onClick={() => setIsMenuOpen(false)}><RxCalendar size={16} /> Reserva manual</Link></li>
                <li><Link to="/finanzas" onClick={() => setIsMenuOpen(false)}><FiPieChart size={16} /> Finanzas</Link></li>             
                <li><Link to="/gestionreservas" onClick={() => setIsMenuOpen(false)}><FiTool size={16} /> Gestión Reservas</Link></li>
                <li><Link to="/administracion" onClick={() => setIsMenuOpen(false)}><FiUser size={16} /> Administración</Link></li>
              </>
            )}
            <li><a onClick={handleLogout}><FiXCircle size={16} /> Cerrar Sesión</a></li>
          </ul>
        </div>
      )}
    </>
  );
}

export default BottomNavbar;
