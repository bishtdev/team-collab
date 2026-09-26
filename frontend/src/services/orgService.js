import api from './api';

// Org API (multi-company workspaces).
// - create: Door 1, any authed user becomes OWNER of a NEW isolated org (no script).
// - list: ONLY my orgs (backend filters by membership — no discovery of others).
export const fetchOrgs = () => api.get('/orgs');
export const createOrg = (name) => api.post('/orgs', { name });
export const getOrg = (orgId) => api.get(`/orgs/${orgId}`);
export const renameOrg = (orgId, name) => api.patch(`/orgs/${orgId}`, { name });
export const selectOrg = (orgId) => api.post(`/orgs/${orgId}/select`);
