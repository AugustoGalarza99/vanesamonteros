import React, { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa'; // Asegúrate de tener instalada la librería react-icons
import './ScrollButton.css'

const ScrollButton = () => {
    const [visible, setVisible] = useState(false);

    // Mostrar el botón solo cuando el usuario haya hecho scroll hacia abajo
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setVisible(true);
            } else {
                setVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    // Función para hacer scroll hacia arriba
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        visible && (
            <button onClick={scrollToTop} className="scroll-to-top">
                <FaArrowUp />
            </button>
        )
    );
};

export default ScrollButton;
