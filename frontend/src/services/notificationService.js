import api from './api';

export const fetchNotifications = (page = 1, limit = 20) =>
  api.get(`/notifications?page=${page}&limit=${limit}`);
export const fetchUnreadCount = () => api.get('/notifications/unread-count');
export const markAsRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllAsRead = () => api.patch('/notifications/read-all');
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
export const clearAllNotifications = () => api.delete('/notifications');
