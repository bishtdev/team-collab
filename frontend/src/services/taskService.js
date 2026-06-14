import api from './api';

export const fetchTasks = (projectId) => api.get(`/tasks?projectId=${projectId}`);
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const fetchSubtasks = (taskId) => api.get(`/tasks/${taskId}/subtasks`);
export const createSubtask = (taskId, data) => api.post(`/tasks/${taskId}/subtasks`, data);
export const updateSubtask = (taskId, subtaskId, data) => api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, data);
export const deleteSubtask = (taskId, subtaskId) => api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
export const fetchComments = (taskId, page = 1, limit = 20) => api.get(`/tasks/${taskId}/comments?page=${page}&limit=${limit}`);
export const createComment = (taskId, data) => api.post(`/tasks/${taskId}/comments`, data);
export const fetchActivities = (taskId, page = 1, limit = 20) => api.get(`/tasks/${taskId}/activities?page=${page}&limit=${limit}`);
