import api from './api';

export const fetchTeams = () => api.get('/teams');
export const createTeam = (data) => api.post('/teams', data);
export const setActiveTeam = (teamId) => api.patch('/teams/select', { teamId });
export const fetchTeamMembers = (teamId) => api.get(`/teams/${teamId}/members`);
export const addUserToTeam = (teamId, data) => api.post(`/teams/${teamId}/add-user`, data);
export const changeMemberRole = (teamId, userId, role) => api.patch(`/teams/${teamId}/members/${userId}/role`, { role });
export const removeMember = (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`);
export const transferOwnership = (teamId, newAdminId) => api.post(`/teams/${teamId}/transfer-ownership`, { newAdminId });
export const fetchMyMemberships = () => api.get('/teams/memberships');
export const fetchAllUsers = () => api.get('/teams/users/all');
export const fetchTeamUsers = () => api.get('/users/team');
