// src/components/ProtectedRoute.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, fallback = <div>Loading...</div> }) => {
  const { user, loading, firebaseUser } = useAuth();
  
  if (loading) return fallback;
  
  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user) {
    return (
      <div className="text-center p-4">
        <p>Unable to connect to server. Please try again later.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return children;
};

export default ProtectedRoute;
