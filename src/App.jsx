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

// Componentes simples para las páginas
const Home = () => <h2>Inicio (Calendario de Turnos)</h2>;
const Productos = () => <h2>Productos</h2>;

function App() {
  const [user, loadingAuth] = useAuthState(auth);  // Monitoreamos el estado de autenticación
  const [isPeluquero, setIsPeluquero] = useState(null); // Estado para verificar si es peluquero

  const checkIfPeluquero = async (user) => {
    const docRef = doc(db, 'peluqueros', user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setIsPeluquero(true);
    } else {
      setIsPeluquero(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkIfPeluquero(user);
    } else {
      setIsPeluquero(null); // Reiniciar en caso de que no haya usuario
    }
  }, [user]);

  return (
    <Router>
      <Navbar isPeluquero={isPeluquero} /> {/* Pasamos el estado isPeluquero al Navbar */}
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path='/reservar-turno' element={<ReservaPage />} />
          <Route path="/estado" element={<Estado />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/login" element={<LoginPeluquero />} />

          {/* Ruta protegida para el panel del peluquero */}
          <Route path="/panelpeluquero" element={
            <ProtectedRoute isPeluquero={isPeluquero}>
              <Peluquero />
            </ProtectedRoute>
          } />

          {/* Si el usuario intenta ir a una ruta que no existe */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
