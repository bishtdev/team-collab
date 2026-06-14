import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as taskService from '../../services/taskService';
import { extractError } from '../../services/helpers';

export const fetchComments = createAsyncThunk('comments/fetch', async ({ taskId, page = 1, limit = 20 }, { rejectWithValue }) => {
  try {
    const res = await taskService.fetchComments(taskId, page, limit);
    return { taskId, ...res.data, page };
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const createComment = createAsyncThunk('comments/create', async ({ taskId, data }, { rejectWithValue }) => {
  try {
    await taskService.createComment(taskId, data);
    return { taskId };
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

const commentsSlice = createSlice({
  name: 'comments',
  initialState: {},
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state, action) => {
        const { taskId } = action.meta.arg;
        if (!state[taskId]) state[taskId] = { items: [], isLoading: true, error: null, pagination: { total: 0 } };
        else state[taskId].isLoading = true;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        const { taskId, comments: fetched, pagination, page } = action.payload;
        const entry = state[taskId];
        if (page === 1) {
          entry.items = fetched || [];
        } else {
          entry.items = [...entry.items, ...(fetched || [])];
        }
        entry.pagination = pagination;
        entry.isLoading = false;
        entry.error = null;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        const { taskId } = action.meta.arg;
        if (state[taskId]) { state[taskId].isLoading = false; state[taskId].error = action.payload; }
      })
      .addCase(createComment.fulfilled, (state, action) => {
        delete state[action.payload.taskId];
      });
  },
});

export default commentsSlice.reducer;
