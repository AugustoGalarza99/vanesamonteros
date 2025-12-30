import React from 'react';
import { useRole } from '../../RoleContext';
import { auth } from '../../firebaseConfig';
import { Link } from 'react-router-dom';
import './DesktopNavbar.css';
import {
  FiHome, FiUser, FiInfo, FiClock, FiXCircle,
  FiClipboard, FiBriefcase, FiPieChart, FiTool
} from 'react-icons/fi';
import { RxCalendar } from "react-icons/rx";
import Loader from '../Loader/Loader';

function DesktopNavbar() {
  const { user, role, loading } = useRole();

  if (loading) {
    return <nav className="desktop-navbar collapsed"><Loader /></nav>;
  }

  return (
    <nav className="desktop-navbar collapsed">
      <ul className="ul-nav">

        <li>
          <Link to="/">
            <FiHome size={22} />
            <span className="nav-text">Inicio</span>
          </Link>
        </li>

        <li>
          <Link to="/estado">
            <FiInfo size={22} />
            <span className="nav-text">Estado</span>
          </Link>
        </li>

        {role === 'peluquero' && (
          <>
            <li>
              <Link to="/agenda">
                <FiClipboard size={22} />
                <span className="nav-text">Agenda</span>
              </Link>
            </li>
            <li>
              <Link to="/servicios">
                <FiBriefcase size={22} />
                <span className="nav-text">Servicios</span>
              </Link>
            </li>
            <li>
              <Link to="/horarios">
                <FiClock size={22} />
                <span className="nav-text">Horarios</span>
              </Link>
            </li>
            <li>
              <Link to="/reservamanual">
                <RxCalendar size={22} />
                <span className="nav-text">Reserva manual</span>
              </Link>
            </li>
            <li>
              <Link to="/finanzas">
                <FiPieChart size={22} />
                <span className="nav-text">Finanzas</span>
              </Link>
            </li>
            <li>
              <Link to="/miperfil">
                <FiUser size={22} />
                <span className="nav-text">Mi perfil</span>
              </Link>
            </li>
          </>
        )}

        {role === 'administrador' && (
          <>
            <li>
              <Link to="/reservamanual">
                <RxCalendar size={22} />
                <span className="nav-text">Reserva manual</span>
              </Link>
            </li>
            <li>
              <Link to="/finanzas">
                <FiPieChart size={22} />
                <span className="nav-text">Finanzas</span>
              </Link>
            </li>
            <li>
              <Link to="/gestionreservas">
                <FiTool size={22} />
                <span className="nav-text">Gestión Reservas</span>
              </Link>
            </li>
            <li>
              <Link to="/administracion">
                <FiUser size={22} />
                <span className="nav-text">Administración</span>
              </Link>
            </li>
          </>
        )}

        {user ? (
          <li>
            <a onClick={() => auth.signOut()}>
              <FiXCircle size={22} />
              <span className="nav-text">Cerrar sesión</span>
            </a>
          </li>
        ) : (
          <li>
            <Link to="/login">
              <FiUser size={22} />
              <span className="nav-text">Iniciar sesión</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default DesktopNavbar;
