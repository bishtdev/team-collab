import api from './api';

// Invite API (roleRework + orgRework): tokenized, expiring, single-use invites.
// createInvite data: {email, orgId?, teamId?, role}. orgId preferred (Door 2 join).
// Raw token only travels in the email link; backend stores only its hash.
export const createInvite = (data) => api.post('/invites', data);
export const listInvites = (teamIdOrOrgId) => api.get('/invites', { params: { teamId: teamIdOrOrgId } });
export const listInvitesByOrg = (orgId) => api.get('/invites', { params: { orgId } });
export const revokeInvite = (id) => api.post(`/invites/${id}/revoke`);
export const validateInvite = (token) => api.get(`/invites/${token}/validate`);
export const acceptInvite = (token, data) => api.post(`/invites/${token}/accept`, data || {});

// Teams: orgId optional (scoped listing when provided, legacy global when omitted).
export const fetchTeams = (orgId) => api.get('/teams', orgId ? { params: { orgId } } : undefined);
export const createTeam = (data) => api.post('/teams', data); // {name, description, orgId?}
export const setActiveTeam = (teamId) => api.patch('/teams/select', { teamId });
export const fetchTeamMembers = (teamId) => api.get(`/teams/${teamId}/members`);
export const changeMemberRole = (teamId, userId, role) => api.patch(`/teams/${teamId}/members/${userId}/role`, { role });
export const removeMember = (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`);
export const transferOwnership = (teamId, newAdminId) => api.post(`/teams/${teamId}/transfer-ownership`, { newAdminId });
export const fetchMyMemberships = () => api.get('/teams/memberships');
export const fetchTeamUsers = () => api.get('/users/team');
