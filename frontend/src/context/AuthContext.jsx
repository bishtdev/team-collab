// context/AuthContext.jsx
// Authentication context for the entire application.
//
// This context manages:
// - Firebase authentication state (login, signup, logout)
// - Backend user sync (ensures Firebase user exists in our MongoDB)
// - User data and loading states
//
// Flow:
// 1. User signs up/logs in via Firebase
// 2. onAuthStateChanged fires with the Firebase user
// 3. We sync the Firebase user with our backend (/api/auth/sync)
// 4. Backend creates/updates user in MongoDB and returns user data
// 5. We store the backend user data in state for the rest of the app
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

  // ---------------------------------------------------------------------------
  // Sync Firebase User with Backend
  // Called on auth state change to ensure our MongoDB has the user record.
  // Uses the Firebase ID token for authentication with our backend.
  // ---------------------------------------------------------------------------
  const syncUserWithBackend = useCallback(async (fbUser) => {
    try {
      const token = await fbUser.getIdToken();
      const res = await api.post(
        '/auth/sync',
        {}, // Empty body preserves existing teamId/role on re-login
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
      // Only clear user on real errors, not network issues
      if (err.code !== 'ERR_NETWORK') {
        setUser(null);
      }
      return null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Auth State Listener
  // Runs on mount and whenever Firebase auth state changes.
  // This is the single source of truth for whether a user is logged in.
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Refresh User Data
  // Re-syncs the current Firebase user with the backend to get updated data.
  // Useful after team changes (e.g., setting active team) without full page reload.
  // ---------------------------------------------------------------------------
  const refreshUser = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await syncUserWithBackend(currentUser);
    }
    return null;
  }, [syncUserWithBackend]);

  // ---------------------------------------------------------------------------
  // Signup
  // Creates a new Firebase user and syncs with our backend.
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Login
  // Signs in with Firebase. The onAuthStateChanged listener handles
  // the backend sync automatically.
  // ---------------------------------------------------------------------------
  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle the rest
  };

  // ---------------------------------------------------------------------------
  // Logout
  // Signs out of Firebase. The onAuthStateChanged listener clears user state.
  // ---------------------------------------------------------------------------
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      signup,
      login,
      logout,
      loading,
      refreshUser // New: allows components to refresh user data
    }}>
      {children}
    </AuthContext.Provider>
  );
};
