import React from "react";
import Administrativo from "../components/Administrativo/Administrativo";
import DemorasProfesionales from "../components/DemorasProfesional/DemorasProfesional";
import AccesoCodigos from "../components/AccesoCodigos/AccesoCodigos"

const Administracion = () => {
  return (
    <div>
        <DemorasProfesionales />
        <AccesoCodigos />
        <Administrativo />
    </div>
  );
};

export default Administracion;