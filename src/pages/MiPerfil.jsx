import React from "react";
import RegistroDemora from "../components/RegistroDemora/RegistroDemora";
import Administrativo from "../components/Administrativo/Administrativo";
import AccesoCodigos from "../components/AccesoCodigos/AccesoCodigos";
import PanelAdministrativo from "../components/PanelAdministrativo/PanelAdministrativo";
import PerfilProfesional from "../components/PerfilProfesional/PrefilProfesional";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';
import BloqueoAgenda from "../components/BloqueoAgenda/BloqueoAgenda.JSX";



const MiPerfil = () => {
  const [user] = useAuthState(auth);

  return (
    <div>      
        <PerfilProfesional />
      <PanelAdministrativo titulo="Demoras">
        <RegistroDemora />
      </PanelAdministrativo>
      <PanelAdministrativo titulo="Codigo de verificación">
        <AccesoCodigos />
      </PanelAdministrativo>
      <PanelAdministrativo titulo="Vacaciones / Feriados">
        <BloqueoAgenda />
      </PanelAdministrativo>
      <PanelAdministrativo titulo="Mi perfil">   
        <Administrativo />
      </PanelAdministrativo> 
    </div>
  );
};

export default MiPerfil;
