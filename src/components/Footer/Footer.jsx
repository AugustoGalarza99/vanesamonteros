import React from "react";
import { Link } from "react-router-dom"; // Si utilizas React Router para el enrutamiento
import './Footer.css'

const Footer = () => {
    return (
      <footer className="footer">
        <div className="footer-content">
          <p>
            <span>© {new Date().getFullYear()} Agenda Smart. Todos los derechos reservados.</span>
          </p>
          <p>
            <span>Desarrollado por </span>
            <a
              href="https://www.agendasmartapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Agenda Smart
            </a>
          </p>
        </div>
      </footer>
    );
  };
  
  export default Footer;