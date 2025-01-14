import React from 'react';
import { useRole } from '../../RoleContext';
import { auth } from '../../firebaseConfig';
import { Link } from 'react-router-dom';
import './DesktopNavbar.css';
import { FiHome, FiUser, FiInfo, FiClock, FiXCircle, FiClipboard, FiBriefcase, FiPieChart, FiShoppingCart, FiTool } from 'react-icons/fi';
import { RxCalendar } from "react-icons/rx";
import Loader from '../Loader/Loader';

function DesktopNavbar() {
  const { user, role, loading } = useRole();

  if (loading) {
    // Mostrar un indicador de carga si el rol aún se está determinando
    return <nav className="desktop-navbar"><Loader/></nav>;
  }

  return (
    <nav className="desktop-navbar">
      <ul>
        {/* Enlaces visibles para todos */}
        <li><Link to="/"><FiHome size={24} /> Inicio</Link></li>
        <li><Link to="/estado"><FiInfo size={24} /> Estado</Link></li>
        <li><Link to="/productos"><FiShoppingCart size={24} /> Productos</Link></li>

        {/* Enlaces para peluqueros */}
        {role === 'peluquero' && (
          <>
            <li><Link to="/agenda"><FiClipboard size={24} /> Agenda 1</Link></li>
            <li><Link to="/agendados"><FiClipboard size={24} /> Agenda 2</Link></li>
            <li><Link to="/servicios"><FiBriefcase size={24} /> Servicios</Link></li>
            <li><Link to="/horarios"><FiClock size={24} /> Horarios</Link></li>
            <li><Link to="/reservamanual"><RxCalendar size={24} /> Reserva manual</Link></li>
            <li><Link to="/finanzas"><FiPieChart size={24} /> Finanzas</Link></li>
            <li><Link to="/administracion"><FiUser size={24} /> Administración</Link></li>
          </>
        )}

        {/* Enlaces para administradores */}
        {role === 'administrador' && (
          <>
            <li><Link to="/reservamanual"><RxCalendar size={24} /> Reserva manual</Link></li>
            <li><Link to="/finanzas"><FiPieChart size={24} /> Finanzas</Link></li>
            <li><Link to="/administracion"><FiUser size={24} /> Administración</Link></li>
            <li><Link to="/gestionreservas"><FiTool size={24} /> Gestión Reservas</Link></li>
          </>
        )}

        {/* Botón de inicio de sesión o cierre de sesión */}
        {user ? (
          <li>
          <a
            onClick={() => {
              auth.signOut()
                .then(() => {
                  console.log('Sesión cerrada exitosamente.');
                })
                .catch((error) => {
                  console.error('Error al cerrar sesión:', error);
                });
            }}
          >
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
