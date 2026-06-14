import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    globalError: null,
  },
  reducers: {
    setGlobalError(state, action) {
      state.globalError = action.payload;
    },
    clearGlobalError(state) {
      state.globalError = null;
    },
  },
});

export const { setGlobalError, clearGlobalError } = uiSlice.actions;
export default uiSlice.reducer;
