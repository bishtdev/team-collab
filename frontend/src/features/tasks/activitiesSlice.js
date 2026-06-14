import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as taskService from '../../services/taskService';
import { extractError } from '../../services/helpers';

export const fetchActivities = createAsyncThunk('activities/fetch', async ({ taskId, page = 1, limit = 20 }, { rejectWithValue }) => {
  try {
    const res = await taskService.fetchActivities(taskId, page, limit);
    return { taskId, ...res.data, page };
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

const activitiesSlice = createSlice({
  name: 'activities',
  initialState: {},
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state, action) => {
        const { taskId } = action.meta.arg;
        if (!state[taskId]) state[taskId] = { items: [], isLoading: true, error: null, pagination: { total: 0 } };
        else state[taskId].isLoading = true;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        const { taskId, activities: fetched, pagination, page } = action.payload;
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
      .addCase(fetchActivities.rejected, (state, action) => {
        const { taskId } = action.meta.arg;
        if (state[taskId]) { state[taskId].isLoading = false; state[taskId].error = action.payload; }
      });
  },
});

export default activitiesSlice.reducer;
