// src/components/ProtectedRoute.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, fallback = <div>Loading...</div> }) => {
  const { user, loading } = useAuth();
  if (loading) return fallback;
  if (!user) return <div>You must login</div>;
  return children;
};

export default ProtectedRoute;
