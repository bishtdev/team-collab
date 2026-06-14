import api from './api';

export const fetchMessages = (teamId, page = 1, limit = 50) =>
  api.get(`/messages/${teamId}?page=${page}&limit=${limit}`);
