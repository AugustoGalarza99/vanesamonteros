// src/components/ClienteApp.js
import React from 'react';
import { useParams } from 'react-router-dom';

function ClienteApp() {
    const { cliente } = useParams(); // Captura el nombre del cliente desde la URL

    return (
        <div>
            <h1>Bienvenido a la app de {cliente}</h1>
            {/* Aquí puedes personalizar la interfaz y cargar datos específicos para el cliente */}
        </div>
    );
}

export default ClienteApp;
