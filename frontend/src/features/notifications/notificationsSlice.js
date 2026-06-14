import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as notificationService from '../../services/notificationService';
import { extractError } from '../../services/helpers';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
  try {
    const res = await notificationService.fetchNotifications(page, limit);
    return res.data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const fetchUnreadCount = createAsyncThunk('notifications/fetchUnreadCount', async (_, { rejectWithValue }) => {
  try {
    const res = await notificationService.fetchUnreadCount();
    return res.data.count;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const markAsRead = createAsyncThunk('notifications/markRead', async (id, { rejectWithValue }) => {
  try {
    await notificationService.markAsRead(id);
    return id;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const markAllAsRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try {
    await notificationService.markAllAsRead();
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const deleteNotification = createAsyncThunk('notifications/delete', async (id, { rejectWithValue }) => {
  try {
    await notificationService.deleteNotification(id);
    return id;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const clearAllNotifications = createAsyncThunk('notifications/clearAll', async (_, { rejectWithValue }) => {
  try {
    await notificationService.clearAllNotifications();
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
  },
  reducers: {
    addNotification(state, action) {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => { state.unreadCount = action.payload; })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const n = state.items.find(item => item._id === action.payload);
        if (n && !n.read) { n.read = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items.forEach(n => { n.read = true; });
        state.unreadCount = 0;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const removed = state.items.find(n => n._id === action.payload);
        if (removed && !removed.read) state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.items = state.items.filter(n => n._id !== action.payload);
      })
      .addCase(clearAllNotifications.fulfilled, (state) => { state.items = []; state.unreadCount = 0; });
  },
});

export const { addNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
