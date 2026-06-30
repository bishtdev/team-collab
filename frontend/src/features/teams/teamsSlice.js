import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as teamService from '../../services/teamService';
import { extractError } from '../../services/helpers';

export const fetchTeams = createAsyncThunk('teams/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await teamService.fetchTeams();
    return res.data.teams || [];
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const createTeam = createAsyncThunk('teams/create', async (data, { rejectWithValue }) => {
  try {
    await teamService.createTeam(data);
    return true;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const setActiveTeam = createAsyncThunk('teams/setActive', async (teamId, { rejectWithValue }) => {
  try {
    await teamService.setActiveTeam(teamId);
    return teamId;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const fetchTeamMembers = createAsyncThunk('teams/fetchMembers', async (teamId, { rejectWithValue }) => {
  try {
    const res = await teamService.fetchTeamMembers(teamId);
    return { teamId, members: res.data || [] };
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const addUserToTeam = createAsyncThunk('teams/addUser', async ({ teamId, data }, { rejectWithValue }) => {
  try {
    await teamService.addUserToTeam(teamId, data);
    return true;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const changeMemberRole = createAsyncThunk('teams/changeRole', async ({ teamId, userId, role }, { rejectWithValue }) => {
  try {
    await teamService.changeMemberRole(teamId, userId, role);
    return { teamId, userId, role };
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const removeMember = createAsyncThunk('teams/removeMember', async ({ teamId, userId }, { rejectWithValue }) => {
  try {
    await teamService.removeMember(teamId, userId);
    return { teamId, userId };
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const transferOwnership = createAsyncThunk('teams/transferOwnership', async ({ teamId, newAdminId }, { rejectWithValue }) => {
  try {
    await teamService.transferOwnership(teamId, newAdminId);
    return { teamId, newAdminId };
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const fetchAllUsers = createAsyncThunk('teams/fetchAllUsers', async (_, { rejectWithValue }) => {
  try {
    const res = await teamService.fetchAllUsers();
    return res.data.users || [];
  } catch (err) {
    const errMsg = extractError(err);
    if (err.response?.status !== 403) {
      return rejectWithValue(errMsg);
    }
    return [];
  }
});

const teamsSlice = createSlice({
  name: 'teams',
  initialState: {
    items: [],
    allUsers: [],
    currentMembers: [],
    isLoading: false,
    isMutating: false,
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchTeams.fulfilled, (state, action) => { state.isLoading = false; state.items = action.payload; })
      .addCase(fetchTeams.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(createTeam.pending, (state) => { state.isMutating = true; state.error = null; })
      .addCase(createTeam.fulfilled, (state) => { state.isMutating = false; })
      .addCase(createTeam.rejected, (state, action) => { state.isMutating = false; state.error = action.payload; })
      .addCase(setActiveTeam.pending, (state) => { state.isMutating = true; state.error = null; })
      .addCase(setActiveTeam.fulfilled, (state) => { state.isMutating = false; })
      .addCase(setActiveTeam.rejected, (state, action) => { state.isMutating = false; state.error = action.payload; })
      .addCase(fetchTeamMembers.fulfilled, (state, action) => { state.currentMembers = action.payload.members; })
      .addCase(addUserToTeam.pending, (state) => { state.isMutating = true; state.error = null; })
      .addCase(addUserToTeam.fulfilled, (state) => { state.isMutating = false; })
      .addCase(addUserToTeam.rejected, (state, action) => { state.isMutating = false; state.error = action.payload; })
      .addCase(fetchAllUsers.fulfilled, (state, action) => { state.allUsers = action.payload; });
  },
});

export const { clearError } = teamsSlice.actions;
export default teamsSlice.reducer;
