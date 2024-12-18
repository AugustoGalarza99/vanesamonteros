// src/pages/Administracion.jsx
import React from "react";
import { useRole } from "../../RoleContext";
import CambiarContraseña from "../CambiarContraseña/CambiarContraseña";
import SubirProducto from "../SubirProducto/SubirProducto";
import AdminProductos from "../AdminProductos/AdminProductos";
import './Administrativo.css'

const Administrativo = () => {
  const { role } = useRole(); // Obtener el rol del usuario desde el contexto

  return (
    <div>
      <h2 className="h2-panel">Panel de Administración</h2>

      {/* Componente visible para todos los roles, incluido peluquero */}
      {(role === "peluquero" || role === "administrador") && (
        <CambiarContraseña />
      )}

      {/* Componente visible solo para el rol administrador */}
      {role === "administrador" && <SubirProducto />}
      {role === "administrador" && <AdminProductos />}
    </div>
  );
};

export default Administrativo;
