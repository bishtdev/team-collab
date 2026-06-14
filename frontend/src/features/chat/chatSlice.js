import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as messageService from '../../services/messageService';
import { extractError } from '../../services/helpers';

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async ({ teamId, page = 1, limit = 50 }, { rejectWithValue }) => {
  try {
    const res = await messageService.fetchMessages(teamId, page, limit);
    return { ...res.data, page };
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
    pagination: { page: 1, hasMore: true, total: 0 },
    typingUsers: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
  },
  reducers: {
    addMessage(state, action) {
      state.messages.push(action.payload);
    },
    setTypingUser(state, action) {
      const { userId, userName } = action.payload;
      if (!state.typingUsers.find(u => u.userId === userId)) {
        state.typingUsers.push({ userId, userName });
      }
    },
    removeTypingUser(state, action) {
      state.typingUsers = state.typingUsers.filter(u => u.userId !== action.payload);
    },
    clearChat(state) {
      state.messages = [];
      state.pagination = { page: 1, hasMore: true, total: 0 };
      state.typingUsers = [];
      state.isLoading = false;
      state.isLoadingMore = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state, action) => {
        const page = action.meta.arg.page || 1;
        if (page === 1) {
          state.isLoading = true;
        } else {
          state.isLoadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { messages, pagination, page } = action.payload;
        state.isLoading = false;
        state.isLoadingMore = false;
        if (page === 1) {
          state.messages = messages;
        } else {
          state.messages = [...messages, ...state.messages];
        }
        state.pagination = pagination;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;
        state.error = action.payload;
      });
  },
});

export const { addMessage, setTypingUser, removeTypingUser, clearChat } = chatSlice.actions;
export default chatSlice.reducer;
