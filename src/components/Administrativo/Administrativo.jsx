import React, { Suspense, lazy } from "react";
import { useRole } from "../../RoleContext";
import CambiarContraseña from "../CambiarContraseña/CambiarContraseña";
import './Administrativo.css';

// Lazy load para componentes que solo se usan en el rol "administrador"
const SubirProducto = lazy(() => import("../SubirProducto/SubirProducto"));
const AdminProductos = lazy(() => import("../AdminProductos/AdminProductos"));

const Administrativo = () => {
  const { role } = useRole(); // Obtener el rol del usuario desde el contexto

  return (
    <div>
      <h2 className="h2-panel">Panel de Administración</h2>

      {/* Componente visible para todos los roles, incluido peluquero */}
      {(role === "peluquero" || role === "administrador") && (
        <CambiarContraseña />
      )}

      {/* Componentes visibles solo para el rol administrador */}
      {role === "administrador" && (
        <Suspense fallback={<div>Cargando...</div>}>
          <SubirProducto />
          <AdminProductos />
        </Suspense>
      )}
    </div>
  );
};

export default Administrativo;
