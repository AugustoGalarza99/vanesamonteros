import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Swal from 'sweetalert2';
import App from './App.jsx'
import './index.css'
import { RoleProvider } from './RoleContext.jsx'

// --- 👇 Bloque de verificación de versión ---
const checkForNewVersion = async () => {
  try {
    const res = await fetch('/meta.json', { cache: 'no-cache' });
    const data = await res.json();
    const current = localStorage.getItem('build_hash');

    if (current && current !== data.build) {
      console.log('⚡ Nueva versión detectada.');
      
      // Mostrar alerta al usuario con opción de recargar
      const { isConfirmed } = await Swal.fire({
        title: '¡Nueva versión disponible!',
        text: 'Hay una nueva versión de la app. Presioná "Actualizar".',
        icon: 'info',
        confirmButtonText: 'Actualizar',
        background: 'black',
        color: 'white',
      });

      if (isConfirmed) {
        localStorage.setItem('build_hash', data.build);
        window.location.reload();
      }
    } else if (!current) {
      // primera carga, guardamos hash
      localStorage.setItem('build_hash', data.build);
    }
  } catch (e) {
    console.warn('No se pudo verificar versión:', e);
  }
};

// chequear al cargar
checkForNewVersion();

// y volver a chequear cada 60 segundos
setInterval(checkForNewVersion, 60000);

// --- 👇 Detectar interacción del usuario ---
const recheckOnUserAction = () => {
  checkForNewVersion();
};

['click', 'focus', 'touchstart'].forEach(evt => {
  window.addEventListener(evt, recheckOnUserAction, { once: true });
});

window.addEventListener('focus', () => {
  ['click', 'focus', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, recheckOnUserAction, { once: true });
  });
});
// --- 👆 FIN ---
// --- 👆 FIN DEL BLOQUE ---

createRoot(document.getElementById('root')).render(
    <RoleProvider >
        <App />
    </RoleProvider>  
)
