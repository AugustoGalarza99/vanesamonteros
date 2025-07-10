import React from "react";
import RegistroDemora from "../components/RegistroDemora/RegistroDemora";
import Administrativo from "../components/Administrativo/Administrativo";
import AccesoCodigos from "../components/AccesoCodigos/AccesoCodigos";
import PanelAdministrativo from "../components/PanelAdministrativo/PanelAdministrativo";



const MiPerfil = () => {
  return (
    <div>
      <PanelAdministrativo titulo="Demoras">
        <RegistroDemora />
      </PanelAdministrativo>
      <PanelAdministrativo titulo="Codigo de verificación">
        <AccesoCodigos />
      </PanelAdministrativo>
      <PanelAdministrativo titulo="Mi perfil">   
        <Administrativo />
      </PanelAdministrativo> 
    </div>
  );
};

export default MiPerfil;