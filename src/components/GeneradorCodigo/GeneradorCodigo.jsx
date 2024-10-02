// GeneradorCodigo.jsx
import React from 'react';

const GeneradorCodigo = ({ telefono }) => {
    const generarCodigo = () => {
        const codigo = Math.floor(100000 + Math.random() * 900000); // Código de 6 dígitos
        const mensaje = `Tu código de verificación es: ${codigo}`;
        const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <button onClick={generarCodigo}>
            Enviar Código de Verificación
        </button>
    );
};

export default GeneradorCodigo;
