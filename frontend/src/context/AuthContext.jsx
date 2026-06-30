// context/AuthContext.jsx
// Authentication context for the entire application.
//
// This context manages:
// - Firebase authentication state (login, signup, logout)
// - Backend user sync (ensures Firebase user exists in our MongoDB)
// - User data and loading states
// - Real-time role sync via Socket.IO (Phase 4)
//
// Flow:
// 1. User signs up/logs in via Firebase
// 2. onAuthStateChanged fires with the Firebase user
// 3. We sync the Firebase user with our backend (/api/auth/sync)
// 4. Backend creates/updates user in MongoDB and returns user data
// 5. We store the backend user data in state for the rest of the app
// 6. Socket.io listener refreshes user on role changes in real time
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from 'firebase/auth';
import { auth } from '../firebaseConfig.js';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Backend user data (from MongoDB)
  const [loading, setLoading] = useState(true); // True while checking auth state
  const [firebaseUser, setFirebaseUser] = useState(null); // Firebase auth user

  // Sync Firebase user with backend. Only sends name; role and teamId are server-authoritative.
  const syncUserWithBackend = useCallback(async (fbUser) => {
    try {
      const token = await fbUser.getIdToken();
      const res = await api.post(
        '/auth/sync',
        {}, // Empty body — backend ignores role/teamId from client
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUser(res.data);
      return res.data;
    } catch (err) {
      console.error('Backend sync error:', err);
      if (err.code !== 'ERR_NETWORK') {
        setUser(null);
      }
      return null;
    }
  }, []);

  // Auth state listener — runs on Firebase auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await syncUserWithBackend(fbUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncUserWithBackend]);

  // Refresh user — re-syncs with backend (called after team switch or role change)
  const refreshUser = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await syncUserWithBackend(currentUser);
    }
    return null;
  }, [syncUserWithBackend]);

  // Signup — role is no longer sent to backend (server-authoritative)
  const signup = async (name, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;
    await updateProfile(fbUser, { displayName: name });

    const token = await fbUser.getIdToken();
    const res = await api.post('/auth/sync',
      { name }, // Only send name; role comes from team membership
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setUser(res.data);
    return res.data;
  };

  // Login
  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Logout
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      signup,
      login,
      logout,
      loading,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
