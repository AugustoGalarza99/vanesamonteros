import React from "react";
import RegistroDemora from "../components/RegistroDemora/RegistroDemora";
import Administrativo from "../components/Administrativo/Administrativo";
import AccesoCodigos from "../components/AccesoCodigos/AccesoCodigos";
import PanelAdministrativo from "../components/PanelAdministrativo/PanelAdministrativo";
import PerfilProfesional from "../components/PerfilProfesional/PrefilProfesional";



const MiPerfil = () => {
  return (
    <div>
      <PerfilProfesional/>
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