import axios from 'axios';
import { auth } from '../firebaseConfig';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://team-collab-backend-lcge.onrender.com/api'  // Replace with your actual backend URL
    : 'http://localhost:5000/api',
  withCredentials: true
});

api.interceptors.request.use(async (config) => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  } catch (error) {
    console.error('API interceptor error:', error);
    return Promise.reject(error);
  }
});

export default api;