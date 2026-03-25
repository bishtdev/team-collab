import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { user, loading, firebaseUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 max-w-sm mx-4 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/10 flex items-center justify-center">
            <span className="text-xl">⚠️</span>
          </div>
          <h3 className="text-white font-semibold mb-2">Connection Error</h3>
          <p className="text-gray-500 text-sm mb-4">
            Unable to connect to the server. Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
