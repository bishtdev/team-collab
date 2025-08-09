import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signup(name, email, password, role);
      navigate('/projects');
    } catch (err) {
      setError(err.message || 'Signup failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-2 p-8 bg-gray-900 border border-gray-800 rounded-lg">
  <h2 className="text-2xl font-bold text-white mb-6">Sign Up</h2>
  {error && <div className="text-red-400 mb-4 p-3 bg-gray-800 rounded-lg text-sm">{error}</div>}
  
  <form onSubmit={handleSignup} className="space-y-5">
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
      <input
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-1 focus:ring-gray-600 focus:border-gray-600"
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-1 focus:ring-gray-600 focus:border-gray-600"
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
      <input
        type="password"
        required
        minLength={6}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-1 focus:ring-gray-600 focus:border-gray-600"
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-1 focus:ring-gray-600 focus:border-gray-600"
      >
        <option value="MEMBER">Member</option>
        <option value="MANAGER">Manager</option>
        <option value="ADMIN">Admin</option>
      </select>
    </div>
    
    <button
      type="submit"
      className="w-full px-4 py-3 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-200 transition-colors"
    >
      Sign Up
    </button>
  </form>
  
  <div className="mt-6 text-center text-sm text-gray-400">
    Already have an account?{' '}
    <a href="/login" className="text-blue-400 hover:text-blue-300 underline">
      Login
    </a>
  </div>
</div>
  );
};

export default Signup
