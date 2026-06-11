// pages/TeamSetup.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import CreateTeamModal from '../components/modals/CreateTeamModal';
import AddUserToTeamModal from '../components/modals/AddUserToTeamModal';
import { FiUsers, FiPlus, FiArrowRight, FiBriefcase, FiUserPlus } from 'react-icons/fi';

const TeamSetup = () => {
  const { user, refreshUser } = useAuth();
  const { canManageTeam, canAddTeamMember, role } = usePermissions();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // For add-user modal
  const [teamMembers, setTeamMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/teams');
      setTeams(res.data.teams || []);
    } catch (err) {
      console.error('Failed to load teams', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      // Only admins can access the getAllUsers endpoint
      // For non-admins, we'll use the team members list instead
      if (role === 'ADMIN') {
        const res = await api.get('/teams/users/all');
        setAllUsers(res.data.users || []);
      } else {
        setAllUsers([]);
      }
    } catch (err) {
      // Silently fail - user may not have permission
      setAllUsers([]);
    }
  };

  const loadTeamMembers = async (teamId) => {
    try {
      const res = await api.get(`/teams/${teamId}/members`);
      setTeamMembers(res.data || []);
    } catch (err) {
      setTeamMembers([]);
    }
  };

  useEffect(() => {
    if (user) {
      loadTeams();
      loadAllUsers();
    }
  }, [user]);

  const handleSetActive = async (teamId) => {
    try {
      await api.patch('/teams/select', { teamId });

      // Refresh teams list
      await loadTeams();

      await refreshUser();

      // Navigate to projects page
      // Note: We avoid window.location.reload() here because it causes
      // a full page reload and loses React state. The auth context will
      // pick up the new teamId on next interaction.
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set active team');
    }
  };

  const openAddUserModal = async (team) => {
    setSelectedTeam(team);
    setError('');
    await loadTeamMembers(team._id);
    setShowAddUserModal(true);
  };

  const handleAddUserSuccess = async () => {
    if (selectedTeam) {
      await loadTeamMembers(selectedTeam._id);
    }
    await loadTeams();
    await loadAllUsers();
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'MANAGER': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-800/60">
            <FiUsers className="text-xl text-gray-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Teams</h1>
            <p className="text-sm text-gray-500 mt-0.5">{teams.length} team{teams.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-medium transition-all text-sm shadow-lg shadow-white/5"
        >
          <FiPlus className="w-4 h-4" />
          <span className="hidden sm:inline">New Team</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Teams list */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800/50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-800/50 flex items-center justify-center">
            <FiBriefcase className="text-2xl text-gray-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-300">No teams yet</h3>
          <p className="text-gray-600 mt-2 text-sm">Create your first team to start collaborating</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 px-5 py-2.5 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-medium transition-all text-sm"
          >
            Create Your First Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((t) => (
            <div
              key={t._id}
              className={`p-5 bg-gray-900/60 rounded-2xl border transition-all duration-200 ${
                user?.teamId === t._id
                  ? 'border-white/20 ring-1 ring-white/10'
                  : 'border-gray-800/60 hover:border-gray-700/60'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{t.name}</h3>
                    {user?.teamId === t._id && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mt-1">{t.description || 'No description'}</p>
                </div>
              </div>

              {/* Members preview */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex -space-x-2">
                  {(t.members || []).slice(0, 5).map((m, i) => (
                    <div
                      key={m._id || i}
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-semibold text-white border-2 border-gray-900"
                      title={m.name}
                    >
                      {m.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-600">
                  {t.members ? t.members.length : 0} member{(t.members?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {canAddTeamMember && (
                  <button
                    onClick={() => openAddUserModal(t)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-800/80 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-colors text-xs font-medium"
                  >
                    <FiUserPlus className="w-3.5 h-3.5" />
                    <span>Add User</span>
                  </button>
                )}
                {user?.teamId !== t._id && (
                  <button
                    onClick={() => handleSetActive(t._id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white text-gray-900 hover:bg-gray-100 rounded-xl transition-colors text-xs font-medium"
                  >
                    <span>Set Active</span>
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => navigate('/projects')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-800/80 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl transition-colors text-xs font-medium"
                >
                  View Projects
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => { loadTeams(); loadAllUsers(); }}
      />

      <AddUserToTeamModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        team={selectedTeam}
        allUsers={allUsers}
        teamMembers={teamMembers}
        onSuccess={handleAddUserSuccess}
      />
    </div>
  );
};

export default TeamSetup;
