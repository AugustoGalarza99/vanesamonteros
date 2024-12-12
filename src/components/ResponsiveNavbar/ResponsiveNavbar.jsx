import React from 'react';
import { useMediaQuery } from 'react-responsive';
import BottomNavbar from '../BottomNavbar/BottomNavbar';
import DesktopNavbar from '../DesktopNavbar/DesktopNavbar';

function ResponsiveNavbar({ isPeluquero }) {
  const isDesktop = useMediaQuery({ query: '(min-width: 1000px)' });

  return (
    <>
      {isDesktop ? (
        <DesktopNavbar isPeluquero={isPeluquero} />
      ) : (
        <BottomNavbar isPeluquero={isPeluquero} />
      )}
    </>
  );
}

export default ResponsiveNavbar;
