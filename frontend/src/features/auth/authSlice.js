import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authService from '../../services/authService';
import { extractError } from '../../services/helpers';

export const syncUser = createAsyncThunk('auth/sync', async ({ fbUser, data }, { rejectWithValue }) => {
  try {
    const token = await fbUser.getIdToken();
    const res = data ? await authService.syncUserWithData(data, token) : await authService.syncUser(token);
    return res.data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    firebaseUser: null,
    isLoading: true,
    error: null,
  },
  reducers: {
    setFirebaseUser(state, action) {
      state.firebaseUser = action.payload;
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.firebaseUser = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncUser.pending, (state) => { state.error = null; })
      .addCase(syncUser.fulfilled, (state, action) => { state.user = action.payload; state.isLoading = false; })
      .addCase(syncUser.rejected, (state, action) => { state.user = null; state.isLoading = false; state.error = action.payload; });
  },
});

export const { setFirebaseUser, setUser, setLoading, clearAuth } = authSlice.actions;
export default authSlice.reducer;
