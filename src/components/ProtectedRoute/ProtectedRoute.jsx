// src/components/ProtectedRoute/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebaseConfig';
import Loader from '../Loader/Loader';

const ProtectedRoute = ({ isPeluquero, children }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div><Loader /></div>; // Muestra un loader mientras se carga
  }

  // Verificar si el usuario está autenticado
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Esperar a que se confirme si es peluquero
  if (isPeluquero === null) {
    return <div><Loader /></div>; // Puedes mostrar un loader o algo similar
  }

  // Si no es peluquero, redirigir
  if (!isPeluquero) {
    return <Navigate to="/" />;
  }

  return children; // Si todo está bien, renderiza el contenido protegido
};

export default ProtectedRoute;
