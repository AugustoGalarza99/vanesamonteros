// ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebaseConfig';

const ProtectedRoute = ({ isPeluquero, children }) => {
    const [user, loading] = useAuthState(auth);
  
    if (loading) return <p>Loading...</p>;
    if (!user || !isPeluquero) return <Navigate to="/login" />;
  
    return children;
  };
  
  export default ProtectedRoute;