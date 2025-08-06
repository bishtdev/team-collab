// TeamSetup.js
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { FiUsers, FiPlus, FiArrowRight, FiBriefcase } from 'react-icons/fi';

const TeamSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teams, setTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation()

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/teams');
      setTeams(res.data.teams || []);
      if (user?.teamId) {
        const current = (res.data.teams || []).find((t) => t._id === user.teamId);
        setActiveTeam(current);
      }
    } catch (err) {
      console.error('Failed to load teams', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadTeams();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not authenticated yet');
      const token = await currentUser.getIdToken();

      await api.post(
        '/teams',
        { name, description },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadTeams();
      setName('');
      setDescription('');
    } catch (err) {
      console.error('Team creation error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create team');
    }
  };

  const handleSetActive = async (teamId) => {
    try {
      await api.patch('/teams/select', { teamId });
      await loadTeams();
      navigate('/projects');
    } catch (err) {
      console.error('Set active team failed', err);
      setError(err.response?.data?.error || 'Failed to set active team');
    }
  };

   useEffect(() => {
    if (user) loadTeams();
  }, [user, location.pathname]);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6 md:mt-10 p-4 transition-all duration-300">
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          <FiUsers className="text-2xl text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Team Management
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-lg text-sm transition-all duration-300">
          {error}
        </div>
      )}

      <div className="mb-8 md:mb-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Your Teams</h2>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 transition-all duration-300">
            <FiBriefcase className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No teams created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((t) => (
              <div
                key={t._id}
                className={`p-5 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02] ${
                  user?.teamId === t._id
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-300 dark:border-blue-600'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">{t.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{t.description}</p>
                  </div>
                  {user?.teamId === t._id && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  {user?.teamId !== t._id && (
                    <button
                      onClick={() => handleSetActive(t._id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors shadow"
                    >
                      <span>Set Active</span>
                      <FiArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/projects')}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg transition-colors"
                  >
                    View Projects
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Create New Team</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Team Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition duration-300"
              placeholder="Enter team name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition duration-300"
              placeholder="Describe your team"
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-300 shadow hover:shadow-md"
          >
            <FiPlus className="w-5 h-5" />
            <span>Create Team</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeamSetup;