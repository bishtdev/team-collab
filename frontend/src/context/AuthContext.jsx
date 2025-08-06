import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut 
} from 'firebase/auth';
import { auth } from '../firebase.js';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
  try {
    const token = await fbUser.getIdToken();
    const res = await api.post(
      '/auth/sync',
      {}, // empty body so existing teamId/role is preserved
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    setUser(res.data);
  } catch (err) {
    console.error('Backend sync error:', err);
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

  const signup = async (name, email, password, role) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;
    await updateProfile(fbUser, { displayName: name });

    const token = await fbUser.getIdToken();
    const res = await api.post('/auth/sync', 
      { name, role, teamId: null },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setUser(res.data);
    return res.data;
  };

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle the rest
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, signup, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};