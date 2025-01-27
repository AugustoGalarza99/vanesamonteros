// src/App.js
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig'; // Asegúrate de que la ruta sea correcta
import Navbar from './components/Navbar/Navbar';
import ReservaPage from './pages/ReservaPage';
import Peluquero from './pages/Peluquero';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import LoginPeluquero from './pages/Login';
import Estado from './pages/Estado';
import ReservaManual from './pages/ReservaManual';
import Horarios from './pages/Horarios';
import Servicios from './pages/Servicios';
import Loader from './components/Loader/Loader';
import ResponsiveNavbar from './components/ResponsiveNavbar/ResponsiveNavbar';
import { RoleProvider } from './RoleContext';
import './App.css';
import Finanzas from './pages/Finanzas';
import Productos from './pages/Productos';
import Administracion from './pages/Administracion';
import FloatingWhatsAppButton from './components/Whatsapp/Whatsapp';
import Turnos from './pages/Turnos';
import ReservasDoss from './pages/ReservasDos';


// Componentes simples para las páginas
const NotFound = () => {
  return <h2>Página no encontrada</h2>;
};

function App() {
  const [user, loadingAuth] = useAuthState(auth);  // Monitoreamos el estado de autenticación
  const [isPeluquero, setIsPeluquero] = useState(null); // Estado para verificar si es peluquero

  const checkIfPeluquero = async (user) => {
    try {
      const peluqueroRef = doc(db, 'peluqueros', user.uid);
      const peluqueroSnap = await getDoc(peluqueroRef);
  
      if (peluqueroSnap.exists()) {
        setIsPeluquero(true);
        return;
      }
  
      const adminRef = doc(db, 'administradores', user.uid);
      const adminSnap = await getDoc(adminRef);
  
      if (adminSnap.exists()) {
        setIsPeluquero(true); // Usuario es administrador
      } else {
        setIsPeluquero(null); // Usuario no pertenece a ninguna colección
      }
    } catch (error) {
      console.error("Error verificando rol del usuario:", error);
      setIsPeluquero(null);
    }
  };

  useEffect(() => {
    if (user) {
      checkIfPeluquero(user);
    } else {
      setIsPeluquero(null); // Reiniciar en caso de que no haya usuario
    }
  }, [user]);

  if (loadingAuth) {
    return <div><Loader /> </div>; // O cualquier otro indicador de carga
  }

  return (
    <RoleProvider>
    <Router /*basename='/juan'*/>
    <FloatingWhatsAppButton />
      <div className="app-layout">    
      <ResponsiveNavbar isPeluquero={isPeluquero} />
      <div className="app-content">
        <Routes>
          <Route path='/' element={<ReservaPage />} />
          <Route path="/estado" element={<Estado />} />
          {/*<Route path="/productos" element={<Productos />} />*/}
          <Route path="/login" element={<LoginPeluquero />} />

          {/* Ruta protegida para el panel del peluquero */}
          <Route path="/finanzas" element={<ProtectedRoute requiredRole={["administrador", "peluquero"]}><Finanzas /></ProtectedRoute>} />
          {/*<Route path="/agenda" element={<ProtectedRoute requiredRole="peluquero"><Peluquero /></ProtectedRoute>} />*/}
          <Route path="/agenda" element={<ProtectedRoute requiredRole="peluquero"><ReservasDoss /></ProtectedRoute>} />
          <Route path="/reservamanual" element={<ProtectedRoute requiredRole={["administrador", "peluquero"]}><ReservaManual /></ProtectedRoute>} />
          <Route path="/horarios" element={<ProtectedRoute requiredRole="peluquero"><Horarios /></ProtectedRoute>} />
          <Route path="/servicios" element={<ProtectedRoute requiredRole="peluquero"><Servicios /></ProtectedRoute>} />
          <Route path="/administracion" element={<ProtectedRoute requiredRole={["administrador", "peluquero"]}><Administracion /></ProtectedRoute>} />
          <Route path="/gestionreservas" element={<ProtectedRoute requiredRole="administrador"><Turnos /></ProtectedRoute>} />

          {/* Si el usuario intenta ir a una ruta que no existe */}
          <Route path="*" element={<NotFound />} />
        </Routes>        
      </div>
      </div> 
    </Router>
    </RoleProvider>
  );
}

export default App;
