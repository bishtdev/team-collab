import { configureStore } from '@reduxjs/toolkit';
import projectsReducer from '../features/projects/projectsSlice';
import tasksReducer from '../features/tasks/tasksSlice';
import teamsReducer from '../features/teams/teamsSlice';
import chatReducer from '../features/chat/chatSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import authReducer from '../features/auth/authSlice';
import uiReducer from '../features/ui/uiSlice';
import subtasksReducer from '../features/tasks/subtasksSlice';
import commentsReducer from '../features/tasks/commentsSlice';
import activitiesReducer from '../features/tasks/activitiesSlice';

export const store = configureStore({
  reducer: {
    projects: projectsReducer,
    tasks: tasksReducer,
    teams: teamsReducer,
    chat: chatReducer,
    notifications: notificationsReducer,
    auth: authReducer,
    ui: uiReducer,
    subtasks: subtasksReducer,
    comments: commentsReducer,
    activities: activitiesReducer,
  },
});
