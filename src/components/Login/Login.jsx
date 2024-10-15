// Login.jsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import './Login.css'

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/agenda'); // Redirige al panel del peluquero después del inicio de sesión
    } catch (error) {
      setError('Error en el inicio de sesión. Verifica tus credenciales.');
    }
  };

  return (
    <section>
    <div className="form-box">
    <div className="form-value">      
      <form className='forms' onSubmit={handleLogin}>
      <h2>Inicia Sesión</h2>
      {error && <p>{error}</p>}
      <div className="input-box">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label>Usuario</label>
        </div>
        <div className="input-box">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label>Contraseña</label>
        </div>
        <button className='button-inicio' type="submit">Iniciar Sesión</button>
      </form>
    </div>
    </div>
    </section>
  );
};

export default Login;
