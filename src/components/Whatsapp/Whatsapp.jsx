import React from "react";
import "./Whatsapp.css";

const FloatingWhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/3572570774" // Reemplaza con tu número de WhatsApp
      className="whatsapp-float"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/5/5e/WhatsApp_icon.png" // Ícono de WhatsApp
        alt="WhatsApp"
        className="whatsapp-icon"
      />
    </a>
  );
};

export default FloatingWhatsAppButton;
