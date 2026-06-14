import api from './api';

export const syncUser = (token) =>
  api.post('/auth/sync', {}, { headers: { Authorization: `Bearer ${token}` } });

export const syncUserWithData = (data, token) =>
  api.post('/auth/sync', data, { headers: { Authorization: `Bearer ${token}` } });
