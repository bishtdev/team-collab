// TeamSetup.js
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { FiUsers, FiPlus, FiArrowRight, FiBriefcase, FiUserPlus, FiX } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TeamSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teams, setTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [showExistingUsers, setShowExistingUsers] = useState(false);
  const location = useLocation();

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

  const loadTeamMembers = async (teamId) => {
    try {
      const res = await api.get(`/teams/${teamId}/members`);
      setTeamMembers(res.data || []);
    } catch (err) {
      console.error('Failed to load team members', err);
      setTeamMembers([]);
    }
  };

  const loadAllUsers = async () => {
    try {
      const res = await api.get('/teams/users/all');
      setAllUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to load all users', err);
      setAllUsers([]);
    }
  };

  useEffect(() => {
    if (user) {
      loadTeams();
      loadAllUsers();
    }
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
      window.location.reload();
    } catch (err) {
      console.error('Set active team failed', err);
      setError(err.response?.data?.error || 'Failed to set active team');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (selectedUserId) {
      // Adding existing user
      try {
        setError('');
        const selectedUser = allUsers.find(u => u._id === selectedUserId);
        if (!selectedUser) {
          setError('Selected user not found');
          return;
        }

        await api.post(`/teams/${selectedTeam._id}/add-user`, {
          userId: selectedUserId
        });

        await loadTeamMembers(selectedTeam._id);
        await loadTeams(); // Refresh teams to update member count
        setSelectedUserId('');
        setShowAddUserModal(false);
      } catch (err) {
        console.error('Add user error:', err);
        setError(err.response?.data?.error || err.message || 'Failed to add user to team');
      }
    } else if (newUserEmail.trim() && newUserName.trim()) {
      // Creating new user
      try {
        setError('');
        await api.post(`/teams/${selectedTeam._id}/add-user`, {
          email: newUserEmail,
          name: newUserName
        });

        await loadTeamMembers(selectedTeam._id);
        await loadTeams(); // Refresh teams to update member count
        setNewUserEmail('');
        setNewUserName('');
        setShowAddUserModal(false);
      } catch (err) {
        console.error('Add user error:', err);
        setError(err.response?.data?.error || err.message || 'Failed to add user to team');
      }
    } else {
      setError('Please select an existing user or fill in all fields for a new user');
    }
  };

  const openAddUserModal = async (team) => {
    setSelectedTeam(team);
    setShowAddUserModal(true);
    setNewUserEmail('');
    setNewUserName('');
    setSelectedUserId('');
    setShowExistingUsers(false);
    setError('');
    await loadTeamMembers(team._id);
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

  return(
    <div className="max-w-4xl mx-auto mt-6 md:mt-10 p-4">
  <div className="flex items-center gap-3 mb-6 md:mb-8">
    <div className="p-3 bg-gray-800 rounded-full border border-gray-700">
      <FiUsers className="text-2xl text-gray-300" />
    </div>
    <h1 className="text-2xl md:text-3xl font-bold text-white">
      Team Management
    </h1>
  </div>

  {error && (
    <div className="mb-6 p-3 bg-gray-800 border border-gray-700 text-red-400 rounded-lg text-sm">
      {error}
    </div>
  )}

  <div className="mb-8 md:mb-10">
    <h2 className="text-xl font-semibold mb-4 text-gray-300">Your Teams</h2>
    {isLoading ? (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-500"></div>
      </div>
    ) : teams.length === 0 ? (
      <Card className="text-center py-8 bg-gray-900 border border-gray-800">
        <CardContent className="pt-6">
          <FiBriefcase className="mx-auto text-4xl text-gray-600 mb-4" />
          <p className="text-gray-400">No teams created yet</p>
        </CardContent>
      </Card>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((t) => (
          <Card 
            key={t._id} 
            className={`bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all ${
              user?.teamId === t._id
                ? 'ring-1 ring-gray-500'
                : ''
            }`}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg text-white">{t.name}</CardTitle>
                  <CardDescription className="mt-2 text-gray-400">
                    {t.description}
                  </CardDescription>
                  <div className="mt-2 text-sm text-gray-500">
                    Members: {t.members ? t.members.length + 1 : 1}
                  </div>
                </div>
                {user?.teamId === t._id && (
                  <Badge className="bg-gray-800 text-gray-300 border border-gray-700">Active</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user?.role === 'ADMIN' && (
                  <Button
                    onClick={() => openAddUserModal(t)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <FiUserPlus className="w-4 h-4" />
                    <span>Add User</span>
                  </Button>
                )}
                {user?.teamId !== t._id && (
                  <Button
                    onClick={() => handleSetActive(t._id)}
                    size="sm"
                    className="flex items-center gap-1 bg-white text-gray-900 hover:bg-gray-200"
                  >
                    <span>Set Active</span>
                    <FiArrowRight className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={() => navigate('/projects')}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  View Projects
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )}
  </div>

  <Card className="bg-gray-900 border border-gray-800">
    <CardHeader>
      <CardTitle className="text-white">Create New Team</CardTitle>
    </CardHeader>
    <CardContent>
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <Label className="text-gray-300 mb-2">Team Name</Label>
          <Input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter team name"
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-600 focus:ring-gray-600"
          />
        </div>
        <div>
          <Label className="text-gray-300 mb-2">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-gray-600"
            placeholder="Describe your team"
            rows={3}
          />
        </div>
        <Button type="submit" className="w-full bg-white text-gray-900 hover:bg-gray-200">
          <FiPlus className="w-5 h-5 mr-2" />
          <span>Create Team</span>
        </Button>
      </form>
    </CardContent>
  </Card>

  {/* Add User Dialog */}
  <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
    <DialogContent className="max-w-md bg-gray-900 border border-gray-800 text-white">
      <DialogHeader>
        <DialogTitle>Add User to {selectedTeam?.name}</DialogTitle>
        <DialogDescription className="text-gray-400">
          Add a new user to your team or select an existing user
        </DialogDescription>
      </DialogHeader>
      
      {error && (
        <div className="mb-4 p-3 bg-gray-800 border border-gray-700 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleAddUser} className="space-y-4">
        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant={showExistingUsers ? "default" : "outline"}
            size="sm"
            className={`${showExistingUsers ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
            onClick={() => {
              setShowExistingUsers(true);
              setSelectedUserId('');
              setNewUserEmail('');
              setNewUserName('');
            }}
          >
            Select Existing User
          </Button>
          <Button
            type="button"
            variant={!showExistingUsers ? "default" : "outline"}
            size="sm"
            className={`${!showExistingUsers ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'}`}
            onClick={() => {
              setShowExistingUsers(false);
              setSelectedUserId('');
              setNewUserEmail('');
              setNewUserName('');
            }}
          >
            Create New User
          </Button>
        </div>

        {showExistingUsers ? (
          <div>
            <Label className="text-gray-300 mb-2">Select User</Label>
            <Select onValueChange={setSelectedUserId} value={selectedUserId}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800 text-gray-300">
                {allUsers
                  .filter(user => !teamMembers.some(member => member._id === user._id))
                  .map(user => (
                    <SelectItem 
                      key={user._id} 
                      value={user._id}
                      className="hover:bg-gray-800"
                    >
                      {user.name} ({user.email}) - {user.role}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {allUsers.filter(user => !teamMembers.some(member => member._id === user._id)).length === 0 && (
              <p className="text-sm text-gray-500 mt-2">All users are already in this team</p>
            )}
          </div>
        ) : (
          <>
            <div>
              <Label className="text-gray-300">User Name</Label>
              <Input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Enter user name"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Email</Label>
              <Input
                type="email"
                required
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Enter user email"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </>
        )}
        
        {teamMembers.length > 0 && (
          <div>
            <Label className="text-gray-300 mb-2">Current Team Members</Label>
            <div className="max-h-32 overflow-y-auto bg-gray-800/50 rounded-lg p-2 border border-gray-700">
              {teamMembers.map((member) => (
                <div key={member._id} className="flex items-center justify-between py-1 px-2 hover:bg-gray-800/30 rounded">
                  <span className="text-sm text-gray-300">
                    {member.name} ({member.email})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
            onClick={() => setShowAddUserModal(false)}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className="bg-white text-gray-900 hover:bg-gray-200"
          >
            Add User
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</div>
  );
};

export default TeamSetup;