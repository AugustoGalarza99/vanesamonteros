import React, { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa";
import "./ScrollButton.css";

const ScrollButton = () => {
  const [visible, setVisible] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(0);

  useEffect(() => {
    // Obtener la altura del navbar una vez que el componente ha cargado
    const navbar = document.querySelector(".navbar");
    if (navbar) {
      setNavbarHeight(navbar.offsetHeight); // Guardamos la altura del navbar
    }

    const toggleVisibility = () => {
      // Verificar si el desplazamiento es mayor que la altura del navbar
      if (window.pageYOffset > navbarHeight) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [navbarHeight]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <button 
      className={`scroll-to-top ${visible ? "show" : ""}`}
      onClick={scrollToTop}
      aria-label="Scroll to top"
    >
      <FaArrowUp />
    </button>
  );
};

export default ScrollButton;
