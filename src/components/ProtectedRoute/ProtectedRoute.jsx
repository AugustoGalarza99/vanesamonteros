// src/components/ProtectedRoute/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useRole } from "../../context/RoleContext";
import Loader from "../Loader/Loader";

const ProtectedRoute = ({ requiredRole, children }) => {
  const { user, role, loading } = useRole(); // Obtener usuario y rol desde el contexto

  if (loading) {
    return <div><Loader /></div>; // Loader mientras se carga usuario/rol
  }

  if (!user) {
    return <Navigate to="/login" />; // Redirigir si no está autenticado
  }

  if (!Array.isArray(requiredRole)) {
    requiredRole = [requiredRole]; // Asegurar que `requiredRole` sea un array
  }

  if (!requiredRole.includes(role)) {
    return <Navigate to="/" />; // Redirigir si el rol no coincide
  }

  return children; // Renderizar contenido si todo está correcto
};

export default ProtectedRoute;
