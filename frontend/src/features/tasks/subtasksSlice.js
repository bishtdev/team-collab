import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as taskService from '../../services/taskService';
import { extractError } from '../../services/helpers';

export const fetchSubtasks = createAsyncThunk('subtasks/fetch', async (taskId, { rejectWithValue }) => {
  try {
    const res = await taskService.fetchSubtasks(taskId);
    return { taskId, subtasks: res.data.subtasks || [] };
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const createSubtask = createAsyncThunk('subtasks/create', async ({ taskId, data }, { rejectWithValue }) => {
  try {
    const res = await taskService.createSubtask(taskId, data);
    return { taskId, subtask: res.data };
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const updateSubtask = createAsyncThunk('subtasks/update', async ({ taskId, subtaskId, data }, { rejectWithValue }) => {
  try {
    const res = await taskService.updateSubtask(taskId, subtaskId, data);
    return { taskId, subtask: res.data };
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const deleteSubtask = createAsyncThunk('subtasks/delete', async ({ taskId, subtaskId }, { rejectWithValue }) => {
  try {
    await taskService.deleteSubtask(taskId, subtaskId);
    return { taskId, subtaskId };
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

const subtasksSlice = createSlice({
  name: 'subtasks',
  initialState: {},
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubtasks.fulfilled, (state, action) => {
        state[action.payload.taskId] = {
          items: action.payload.subtasks,
          isLoading: false,
          error: null,
        };
      })
      .addCase(fetchSubtasks.rejected, (state, action) => {
        state[action.meta.arg] = { items: [], isLoading: false, error: action.payload };
      })
      .addCase(fetchSubtasks.pending, (state, action) => {
        if (!state[action.meta.arg]) state[action.meta.arg] = { items: [], isLoading: true, error: null };
        else state[action.meta.arg].isLoading = true;
      })
      .addCase(createSubtask.fulfilled, (state, action) => {
        const entry = state[action.payload.taskId];
        if (entry) entry.items.push(action.payload.subtask);
      })
      .addCase(updateSubtask.fulfilled, (state, action) => {
        const entry = state[action.payload.taskId];
        if (entry) {
          const idx = entry.items.findIndex(s => s._id === action.payload.subtask._id);
          if (idx !== -1) entry.items[idx] = action.payload.subtask;
        }
      })
      .addCase(deleteSubtask.fulfilled, (state, action) => {
        const entry = state[action.payload.taskId];
        if (entry) entry.items = entry.items.filter(s => s._id !== action.payload.subtaskId);
      });
  },
});

export default subtasksSlice.reducer;
