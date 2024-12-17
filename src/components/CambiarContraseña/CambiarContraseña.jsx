import React, { useState } from "react";
import { getAuth, updatePassword } from "firebase/auth";
import { TextField, Button } from "@mui/material";

const CambiarContraseña = () => {
  const [nuevaContraseña, setNuevaContraseña] = useState("");
  const [mensaje, setMensaje] = useState("");

  const auth = getAuth();

  const cambiarContraseña = async () => {
    try {
      if (nuevaContraseña.length < 6) {
        setMensaje("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
      await updatePassword(auth.currentUser, nuevaContraseña);
      setMensaje("Contraseña actualizada exitosamente.");
    } catch (error) {
      console.error(error);
      setMensaje("Error al cambiar la contraseña. Intenta nuevamente.");
    }
  };

  return (
    <div>
      <h2>Cambiar Contraseña</h2>
      <TextField
        label="Nueva Contraseña"
        type="password"
        value={nuevaContraseña}
        onChange={(e) => setNuevaContraseña(e.target.value)}
        fullWidth
      />
      <Button variant="contained" color="primary" onClick={cambiarContraseña}>
        Cambiar Contraseña
      </Button>
      {mensaje && <p>{mensaje}</p>}
    </div>
  );
};

export default CambiarContraseña;
