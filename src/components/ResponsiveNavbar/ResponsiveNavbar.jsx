import React from 'react';
import { useMediaQuery } from 'react-responsive';
import BottomNavbar from '../BottomNavbar/BottomNavbar';
import DesktopNavbar from '../DesktopNavbar/DesktopNavbar';
import './ResponsiveNavbar.css';

function ResponsiveNavbar({ isPeluquero }) {
  const isDesktop = useMediaQuery({ query: '(min-width: 1000px)' });

  return (
    <div className="responsive-navbar">
      {isDesktop ? (
        <DesktopNavbar isPeluquero={isPeluquero} />
      ) : (
        <BottomNavbar isPeluquero={isPeluquero} />
      )}
    </div>
  );
}

export default ResponsiveNavbar;
