import api from './api';

export const fetchTeams = () => api.get('/teams');
export const createTeam = (data) => api.post('/teams', data);
export const setActiveTeam = (teamId) => api.patch('/teams/select', { teamId });
export const fetchTeamMembers = (teamId) => api.get(`/teams/${teamId}/members`);
export const addUserToTeam = (teamId, data) => api.post(`/teams/${teamId}/add-user`, data);
export const fetchAllUsers = () => api.get('/teams/users/all');
export const fetchTeamUsers = () => api.get('/users/team');
