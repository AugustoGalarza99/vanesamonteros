// src/components/ScrollButton/ScrollButton.jsx
import React, { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa'; // Importación correcta
import './ScrollButton.css';

const ScrollButton = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 10) {
                setVisible(true);
            } else {
                setVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

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
