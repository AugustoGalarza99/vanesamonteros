// src/components/ScrollButton/ScrollButton.jsx
import React, { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa"; // Asegúrate de tener react-icons instalado
import "./ScrollButton.css";

const ScrollButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Mostrar el botón cuando el usuario hace scroll hacia abajo
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 20) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Función para hacer scroll hacia arriba
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    isVisible && (
      <button className="scroll-button" onClick={scrollToTop}>
        <FaArrowUp size={14} color="white" />
      </button>
    )
  );
};

export default ScrollButton;
