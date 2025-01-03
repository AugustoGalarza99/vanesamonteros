// src/context/RoleContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "./firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";

// Crear el contexto
const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [user, loading] = useAuthState(auth); // Usuario autenticado
  const [role, setRole] = useState(null); // Almacenar el rol del usuario
  const [roleLoading, setRoleLoading] = useState(true); // Indicador de carga del rol

  console.log("Rol asignado:", role);


  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        try {
          // Intentar buscar en 'peluqueros'
          const peluqueroDoc = await getDoc(doc(db, "peluqueros", user.uid));
          if (peluqueroDoc.exists()) {
            setRole(peluqueroDoc.data().rol);
          } else {
            console.log("Usuario no encontrado en peluqueros. Buscando en administradores...");
            // Intentar buscar en 'administradores'
            const adminDoc = await getDoc(doc(db, "administradores", user.uid));
            if (adminDoc.exists()) {
              setRole(adminDoc.data().rol);
            } else {
              console.error("Usuario no encontrado en ninguna colección.");
              setRole(null); // No se encontró en ninguna colección
            }
          }
        } catch (error) {
          console.error("Error al obtener el rol del usuario:", error);
          setRole(null); // En caso de error, limpiar el rol
        }
      } else {
        setRole(null); // Si no hay usuario autenticado, limpiar el rol
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
