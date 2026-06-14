import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as taskService from '../../services/taskService';
import { extractError } from '../../services/helpers';

export const fetchTasks = createAsyncThunk('tasks/fetchAll', async (projectId, { rejectWithValue }) => {
  try {
    const res = await taskService.fetchTasks(projectId);
    return res.data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const createTask = createAsyncThunk('tasks/create', async (taskData, { rejectWithValue }) => {
  try {
    const res = await taskService.createTask(taskData);
    return res.data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const updateTask = createAsyncThunk('tasks/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await taskService.updateTask(id, data);
    return res.data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const deleteTask = createAsyncThunk('tasks/delete', async (taskId, { rejectWithValue }) => {
  try {
    await taskService.deleteTask(taskId);
    return taskId;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: [],
    subtasks: {},
    comments: {},
    activities: {},
    isLoading: false,
    isMutating: false,
    error: null,
  },
  reducers: {
    optimisticUpdateStatus(state, action) {
      const { taskId, newStatus } = action.payload;
      const task = state.items.find(t => t._id === taskId);
      if (task) {
        task.status = newStatus;
      }
    },
    revertTaskStatus(state, action) {
      const { taskId, originalStatus } = action.payload;
      const task = state.items.find(t => t._id === taskId);
      if (task) {
        task.status = originalStatus;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchTasks.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload; })
      .addCase(fetchTasks.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createTask.pending, (state) => { state.isMutating = true; state.error = null; })
      .addCase(createTask.fulfilled, (state, action) => { state.isMutating = false; state.items.push(action.payload); })
      .addCase(createTask.rejected, (state, action) => { state.isMutating = false; state.error = action.payload; })
      .addCase(updateTask.pending, (state) => { state.error = null; })
      .addCase(updateTask.fulfilled, (state, action) => {
        const idx = state.items.findIndex(t => t._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateTask.rejected, (state, action) => { state.error = action.payload; })
      .addCase(deleteTask.pending, (state) => { state.error = null; })
      .addCase(deleteTask.fulfilled, (state, action) => { state.items = state.items.filter(t => t._id !== action.payload); })
      .addCase(deleteTask.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const { optimisticUpdateStatus, revertTaskStatus } = tasksSlice.actions;
export default tasksSlice.reducer;
