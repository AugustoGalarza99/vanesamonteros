// src/context/RoleContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";

// Crear el contexto
const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [user, loading] = useAuthState(auth); // Usuario autenticado
  const [role, setRole] = useState(null); // Almacenar el rol del usuario
  const [roleLoading, setRoleLoading] = useState(true); // Indicador de carga del rol

  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "peluqueros", user.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().rol); // Establecer el rol desde Firestore
          } else {
            console.error("Usuario no encontrado en la colección 'peluqueros'");
          }
        } catch (error) {
          console.error("Error obteniendo el rol del usuario:", error);
        }
      } else {
        setRole(null); // Si no hay usuario, limpiar el rol
      }
      setRoleLoading(false); // Finalizar la carga del rol
    };

    fetchRole();
  }, [user]);

  return (
    <RoleContext.Provider value={{ user, role, loading: loading || roleLoading }}>
      {children}
    </RoleContext.Provider>
  );
};

// Hook para usar el contexto
export const useRole = () => useContext(RoleContext);
