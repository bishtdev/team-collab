import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import { fetchTeams, fetchAllUsers, fetchTeamMembers, setActiveTeam, clearError } from '../features/teams/teamsSlice';
import CreateTeamModal from '../components/modals/CreateTeamModal';
import AddUserToTeamModal from '../components/modals/AddUserToTeamModal';
import { FiUsers, FiPlus, FiArrowRight, FiBriefcase, FiUserPlus } from 'react-icons/fi';

const TeamSetup = () => {
  const dispatch = useDispatch();
  const { user, refreshUser } = useAuth();
  const { canAddTeamMember } = usePermissions();
  const navigate = useNavigate();

  const { items: teams, allUsers, currentMembers, isLoading, isMutating, error } = useSelector(state => state.teams);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchTeams());
      dispatch(fetchAllUsers());
    }
  }, [user, dispatch]);

  const openAddUserModal = async (team) => {
    setSelectedTeam(team);
    dispatch(clearError());
    dispatch(fetchTeamMembers(team._id));
    setShowAddUserModal(true);
  };

  const handleSetActive = async (teamId) => {
    await dispatch(setActiveTeam(teamId)).unwrap();
    await dispatch(fetchTeams());
    await refreshUser();
    navigate('/projects');
  };

  const handleCreateSuccess = () => {
    dispatch(fetchTeams());
    dispatch(fetchAllUsers());
  };

  const handleAddUserSuccess = () => {
    if (selectedTeam) {
      dispatch(fetchTeamMembers(selectedTeam._id));
    }
    dispatch(fetchTeams());
    dispatch(fetchAllUsers());
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
                    disabled={isMutating}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white text-gray-900 hover:bg-gray-100 rounded-xl transition-colors text-xs font-medium disabled:opacity-50"
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

      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <AddUserToTeamModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        team={selectedTeam}
        allUsers={allUsers}
        teamMembers={currentMembers}
        onSuccess={handleAddUserSuccess}
      />
    </div>
  );
};

export default TeamSetup;
