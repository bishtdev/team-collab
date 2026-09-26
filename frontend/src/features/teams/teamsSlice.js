import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as teamService from '../../services/teamService';
import { extractError } from '../../services/helpers';

// orgId optional: scoped listing (isolation) when provided, legacy global when omitted.
export const fetchTeams = createAsyncThunk('teams/fetchAll', async (orgId, { rejectWithValue }) => {
  try {
    const res = await teamService.fetchTeams(orgId || undefined);
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

// Invite thunks (roleRework): admin creates/lists/revokes invites from TeamSetup UI.
export const createInvite = createAsyncThunk('teams/createInvite', async (data, { rejectWithValue }) => {
  try {
    const res = await teamService.createInvite(data);
    return res.data; // {invite, inviteLink}
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const fetchInvites = createAsyncThunk('teams/fetchInvites', async (teamId, { rejectWithValue }) => {
  try {
    const res = await teamService.listInvites(teamId);
    return { teamId, invites: res.data.invites || [] };
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const revokeInvite = createAsyncThunk('teams/revokeInvite', async (id, { rejectWithValue }) => {
  try {
    await teamService.revokeInvite(id);
    return id;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

const teamsSlice = createSlice({
  name: 'teams',
  initialState: {
    items: [],
    currentMembers: [],
    invites: [], // pending/accepted invites for selected team (admin UI)
    lastInviteLink: null, // copy-link fallback shown after createInvite
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
      .addCase(createInvite.pending, (state) => { state.isMutating = true; state.error = null; state.lastInviteLink = null; })
      .addCase(createInvite.fulfilled, (state, action) => { state.isMutating = false; state.lastInviteLink = action.payload.inviteLink || null; })
      .addCase(createInvite.rejected, (state, action) => { state.isMutating = false; state.error = action.payload; })
      .addCase(fetchInvites.fulfilled, (state, action) => { state.invites = action.payload.invites; })
      .addCase(revokeInvite.fulfilled, (state, action) => { state.invites = state.invites.filter((i) => i._id !== action.payload); });
  },
});

export const { clearError } = teamsSlice.actions;
export default teamsSlice.reducer;
