import React from "react";
import Administrativo from "../components/Administrativo/Administrativo";
import RegistroDemoraAdmin from "../components/RegistroDemoraAdmin/RegistroDemoraAdmin";
import AccesoCodigosAdmin from "../components/AccesoCodigosAdmin/AccesoCodigosAdmin";

const Administracion = () => {
  return (
    <div>
        <RegistroDemoraAdmin />
        <AccesoCodigosAdmin />
        <Administrativo />
    </div>
  );
};

export default Administracion;