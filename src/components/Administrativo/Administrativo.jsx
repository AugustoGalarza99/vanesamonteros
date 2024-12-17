// src/pages/Administracion.jsx
import React from "react";
import { useRole } from "../../context/RoleCOntext";
import CambiarContraseña from "../CambiarContraseña/CambiarContraseña";
import GestorStock from "../GestorStock/GestorStock";

const Administrativo = () => {
  const { role } = useRole(); // Obtener el rol del usuario desde el contexto

  return (
    <div>
      <h1>Panel de Administración</h1>

      {/* Componente visible para todos los roles, incluido peluquero */}
      {(role === "peluquero" || role === "administrador") && (
        <CambiarContraseña />
      )}

      {/* Componente visible solo para el rol administrador */}
      {role === "administrador" && <GestorStock />}
    </div>
  );
};

export default Administrativo;
