import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as projectService from '../../services/projectService';
import * as teamService from '../../services/teamService';
import { extractError } from '../../services/helpers';

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await projectService.fetchProjects();
    return res.data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const fetchProjectById = createAsyncThunk('projects/fetchById', async (id, { rejectWithValue }) => {
  try {
    const res = await projectService.fetchProjectById(id);
    return res.data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const createProject = createAsyncThunk('projects/create', async (data, { rejectWithValue }) => {
  try {
    const res = await projectService.createProject(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const updateProject = createAsyncThunk('projects/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await projectService.updateProject(id, data);
    return res.data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const deleteProject = createAsyncThunk('projects/delete', async (id, { rejectWithValue }) => {
  try {
    await projectService.deleteProject(id);
    return id;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const fetchTeamUsers = createAsyncThunk('projects/fetchTeamUsers', async (_, { rejectWithValue }) => {
  try {
    const res = await teamService.fetchTeamUsers();
    return res.data.members || [];
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    items: [],
    currentProject: null,
    teamMembers: [],
    isLoading: false,
    isMutating: false,
    error: null,
  },
  reducers: {
    clearCurrentProject(state) {
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchProjects.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload; })
      .addCase(fetchProjects.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchProjectById.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchProjectById.fulfilled, (state, action) => { state.isLoading = false; state.currentProject = action.payload; })
      .addCase(fetchProjectById.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createProject.pending, (state) => { state.isMutating = true; state.error = null; })
      .addCase(createProject.fulfilled, (state, action) => { state.isMutating = false; state.items.push(action.payload); })
      .addCase(createProject.rejected, (state, action) => { state.isMutating = false; state.error = action.payload; })
      .addCase(updateProject.pending, (state) => { state.isMutating = true; state.error = null; })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.isMutating = false;
        const idx = state.items.findIndex(p => p._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateProject.rejected, (state, action) => { state.isMutating = false; state.error = action.payload; })
      .addCase(deleteProject.pending, (state) => { state.isMutating = true; state.error = null; })
      .addCase(deleteProject.fulfilled, (state, action) => { state.isMutating = false; state.items = state.items.filter(p => p._id !== action.payload); })
      .addCase(deleteProject.rejected, (state, action) => { state.isMutating = false; state.error = action.payload; })
      .addCase(fetchTeamUsers.pending, (state) => { state.error = null; })
      .addCase(fetchTeamUsers.fulfilled, (state, action) => { state.teamMembers = action.payload; })
      .addCase(fetchTeamUsers.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const { clearCurrentProject } = projectsSlice.actions;
export default projectsSlice.reducer;
