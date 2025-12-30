import React from 'react';
import { useRole } from '../../RoleContext';
import { auth } from '../../firebaseConfig';
import { Link } from 'react-router-dom';
import './DesktopNavbar2.css';
import { Home, User, Info, Clock, XCircle, Clipboard, Briefcase, PieChart, Calendar, Wrench} from 'lucide-react';
import Loader from '../Loader/Loader';

function DesktopNavbar2() {
  const { user, role, loading } = useRole();

  if (loading) {
    return (
      <nav className="desktop-navbar">
        <Loader />
      </nav>
    );
  }

  return (
    <nav className="desktop-navbar2">
      <ul className="nav-right-to-left">

        {/* LOGIN / LOGOUT → siempre primero (extremo derecho) */}
        {user ? (
          <li>
            <button
              className="logout-btn"
              onClick={() => auth.signOut()}
            >
              <XCircle size={20} />
              <span>Cerrar sesión</span>
            </button>
          </li>
        ) : (
          <li>
            <Link to="/login">
              <User size={20} />
              <span>Iniciar sesión</span>
            </Link>
          </li>
        )}

        {/* ADMIN */}
        {role === 'administrador' && (
          <>
            <li>
              <Link to="/administracion">
                <User size={20} />
                <span>Administración</span>
              </Link>
            </li>
            <li>
              <Link to="/gestionreservas">
                <Wrench size={20} />
                <span>Gestión reservas</span>
              </Link>
            </li>
            <li>
              <Link to="/finanzas">
                <PieChart size={20} />
                <span>Finanzas</span>
              </Link>
            </li>
            <li>
              <Link to="/reservamanual">
                <Calendar size={20} />
                <span>Reserva manual</span>
              </Link>
            </li>
          </>
        )}

        {/* PELUQUERO */}
        {role === 'peluquero' && (
          <>
            <li>
              <Link to="/miperfil">
                <User size={20} />
                <span>Mi perfil</span>
              </Link>
            </li>
            <li>
              <Link to="/finanzas">
                <PieChart size={20} />
                <span>Finanzas</span>
              </Link>
            </li>
            <li>
              <Link to="/reservamanual">
                <Calendar size={20} />
                <span>Reserva manual</span>
              </Link>
            </li>
            <li>
              <Link to="/horarios">
                <Clock size={20} />
                <span>Horarios</span>
              </Link>
            </li>
            <li>
              <Link to="/servicios">
                <Briefcase size={20} />
                <span>Servicios</span>
              </Link>
            </li>
            <li>
              <Link to="/agenda">
                <Clipboard size={20} />
                <span>Agenda</span>
              </Link>
            </li>
          </>
        )}

        {/* LINKS GENERALES */}
        <li>
          <Link to="/estado">
            <Info size={20} />
            <span>Estado</span>
          </Link>
        </li>

        <li>
          <Link to="/">
            <Home size={20} />
            <span>Inicio</span>
          </Link>
        </li>

      </ul>
    </nav>
  );
}

export default DesktopNavbar2;
