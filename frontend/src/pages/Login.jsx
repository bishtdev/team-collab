import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate("/projects")
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
  <div className="text-center mb-8">
    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Welcome Back</h1>
    <p className="text-gray-600 dark:text-gray-300 mt-2">Sign in to your account to continue</p>
  </div>

  {error && (
    <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-md text-sm">
      {error}
    </div>
  )}

  <form onSubmit={handleSubmit} className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition duration-200"
        placeholder="your@email.com"
      />
    </div>
    
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
        <a href="/forgot-password" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Forgot password?</a>
      </div>
      <input
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition duration-200"
        placeholder="••••••••"
      />
    </div>
    
    <button
      type="submit"
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
    >
      Sign In
    </button>
  </form>

  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
      Don't have an account?{' '}
      <a href="/signup" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
        Sign up
      </a>
    </p>
  </div>
</div>
  );
};

export default Login;
