import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase.js';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // user info from backend
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null); // firebase auth object

 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log('Firebase User:', fbUser);
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          const res = await api.post('/auth/sync', 
            {
              name: fbUser.displayName || 'Unnamed',
              role: 'MEMBER',
              teamId: null,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log('Backend sync successful:', res.data);
          setUser(res.data);
        } catch (err) {
          console.error('Backend sync error:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status
          });
          // Don't reset user on network errors
          if (err.code !== 'ERR_NETWORK') {
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
