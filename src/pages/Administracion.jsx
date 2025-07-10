import React from "react";
import Administrativo from "../components/Administrativo/Administrativo";
import RegistroDemoraAdmin from "../components/RegistroDemoraAdmin/RegistroDemoraAdmin";
import AccesoCodigosAdmin from "../components/AccesoCodigosAdmin/AccesoCodigosAdmin";
import RecomendacionesAdmin from "../components/RecomendacionesAdmin/RecomendacionesAdmin";
import PanelAdministrativo from "../components/PanelAdministrativo/PanelAdministrativo";

const Administracion = () => {
  return (
    <div>
      <PanelAdministrativo titulo="Demoras">
        <RegistroDemoraAdmin />
      </PanelAdministrativo>
      <PanelAdministrativo titulo="Codigos de verificación">
        <AccesoCodigosAdmin />
      </PanelAdministrativo>
      <PanelAdministrativo titulo="Recomendaciones">
        <RecomendacionesAdmin />
      </PanelAdministrativo>
      <PanelAdministrativo titulo="Mi perfil">
        <Administrativo />
      </PanelAdministrativo>
    </div>
  );
};

export default Administracion;