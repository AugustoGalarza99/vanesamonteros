// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import ReservaPage from './pages/ReservaPage';

const Home = () => <h2>Inicio (Calendario de Turnos)</h2>;
const Estado = () => <h2>Estado del Peluquero</h2>;
const Productos = () => <h2>Productos</h2>;
const Login = () => <h2>Iniciar Sesión</h2>;

function App() {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path='/reservar-turno' element={<ReservaPage />} />
          <Route path="/estado" element={<Estado />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
