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
    <div className="max-w-md mx-auto mt-2 p-8 bg-gray-900 rounded-lg border border-gray-800">
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
      <p className="text-gray-400 mt-2">Sign in to your account to continue</p>
    </div>
  
    {error && (
      <div className="mb-6 p-3 bg-gray-800 border border-red-900 text-red-400 rounded-md text-sm">
        {error}
      </div>
    )}
  
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
          placeholder="your@email.com"
        />
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-300">Password</label>
          <a href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 hover:underline">
            Forgot password?
          </a>
        </div>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
          placeholder="••••••••"
        />
      </div>
      
      <button
        type="submit"
        className="w-full bg-white text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors focus:ring-2 focus:ring-gray-400"
      >
        Sign In
      </button>
    </form>
  
    <div className="mt-6 pt-6 border-t border-gray-800">
      <p className="text-sm text-gray-400 text-center">
        Don't have an account?{' '}
        <a href="/signup" className="font-medium text-blue-400 hover:text-blue-300 hover:underline">
          Sign up
        </a>
      </p>
    </div>
  </div>
  );
};

export default Login;
