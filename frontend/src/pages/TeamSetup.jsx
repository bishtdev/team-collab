import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TeamSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [team, setTeam] = useState(null);
  const [error, setError] = useState('');

  const loadTeam = async () => {
    try {
      const res = await api.get('/teams/me');
      setTeam(res.data);
    } catch (err) {
      // no team yet
    }
  };

  useEffect(() => {
    if (user) loadTeam();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/teams', { name, description });
      setTeam(res.data.team);
      // redirect to projects afterward
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create team');
    }
  };

  if (!user) return <div>Loading...</div>;

  if (team) {
    return (
      <div className="max-w-lg mx-auto mt-16 p-6 bg-white dark:bg-gray-800 rounded shadow">
        <h2 className="text-xl font-bold mb-2">Your Team</h2>
        <div className="mb-2">
          <div><strong>Name:</strong> {team.name}</div>
          <div><strong>Description:</strong> {team.description}</div>
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Go to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white dark:bg-gray-800 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Set Up Your Team</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Team Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            rows={3}
          />
        </div>
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">
          Create Team
        </button>
      </form>
    </div>
  );
};

export default TeamSetup;
