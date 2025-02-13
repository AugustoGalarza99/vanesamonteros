import React from "react";
import RegistroDemora from "../components/RegistroDemora/RegistroDemora";
import Administrativo from "../components/Administrativo/Administrativo";
import AccesoCodigos from "../components/AccesoCodigos/AccesoCodigos";
import GeneradorCodigo from "../components/GeneradorCodigo/GeneradorCodigo";



const MiPerfil = () => {
  return (
    <div>
        <RegistroDemora />
        <GeneradorCodigo />
        <AccesoCodigos />        
        <Administrativo />
    </div>
  );
};

export default MiPerfil;