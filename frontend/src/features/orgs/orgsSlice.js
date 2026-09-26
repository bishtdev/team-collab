import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as orgService from '../../services/orgService';
import { extractError } from '../../services/helpers';

// Fetch ONLY my orgs (backend isolation: membership query, no public directory).
export const fetchOrgs = createAsyncThunk('orgs/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await orgService.fetchOrgs();
    return res.data.orgs || [];
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

// Door 1: create workspace → caller becomes OWNER (self-serve, no script).
export const createOrg = createAsyncThunk('orgs/create', async (name, { rejectWithValue }) => {
  try {
    const res = await orgService.createOrg(name);
    return res.data; // {org, team}
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const selectOrg = createAsyncThunk('orgs/select', async (orgId, { rejectWithValue }) => {
  try {
    const res = await orgService.selectOrg(orgId);
    return res.data; // {user, org, myRole}
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

// Fresh object per reset — never hand out a shared reference to be mutated.
const makeInitialState = () => ({
  items: [], // my orgs with myRole
  activeOrgId: null, // UX pointer (mirrors User.lastActiveOrgId)
  // Lifecycle of the org list. 'idle' is what gates the lazy auto-load: a user
  // who genuinely belongs to zero orgs lands on 'succeeded', never back on
  // 'idle', so the loader cannot re-fire in a loop.
  status: 'idle', // idle | loading | succeeded | failed
  isLoading: false,
  isMutating: false,
  error: null,
});

const orgsSlice = createSlice({
  name: 'orgs',
  initialState: makeInitialState(),
  reducers: {
    setActiveOrg(state, action) {
      state.activeOrgId = action.payload;
    },
    clearOrgError(state) {
      state.error = null;
    },
    // Drop the previous account's workspaces (sign-out / account switch).
    resetOrgs() {
      return makeInitialState();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrgs.pending, (state) => {
        state.status = 'loading';
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrgs.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.isLoading = false;
        state.items = action.payload;
        // Auto-pick first org if none selected (onboarding redirect handles 0 case).
        if (!state.activeOrgId && action.payload.length > 0) {
          state.activeOrgId = action.payload[0]._id;
        }
      })
      .addCase(fetchOrgs.rejected, (state, action) => {
        state.status = 'failed';
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createOrg.pending, (state) => { state.isMutating = true; state.error = null; })
      .addCase(createOrg.fulfilled, (state, action) => {
        state.isMutating = false;
        if (action.payload.org) {
          state.items.push({ ...action.payload.org, myRole: 'OWNER' });
          state.activeOrgId = action.payload.org._id;
          state.status = 'succeeded'; // we now know our workspaces
        }
      })
      .addCase(createOrg.rejected, (state, action) => { state.isMutating = false; state.error = action.payload; })
      .addCase(selectOrg.fulfilled, (state, action) => {
        if (action.payload.org) state.activeOrgId = action.payload.org._id;
      });
  },
});

export const { setActiveOrg, clearOrgError, resetOrgs } = orgsSlice.actions;
export default orgsSlice.reducer;
