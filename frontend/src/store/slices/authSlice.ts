import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authApi, type AuthResponse } from '../services/auth';

interface AuthState {
  user: AuthResponse['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: Boolean(localStorage.getItem('token')),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    // Handle API loading states
    builder.addMatcher(
      authApi.endpoints.login.matchPending,
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );
    builder.addMatcher(
      authApi.endpoints.register.matchPending,
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );

    // Handle API success states
    builder.addMatcher(
      authApi.endpoints.login.matchFulfilled,
      (state, { payload }) => {
        state.user = payload.data.user;
        state.token = payload.data.token;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        localStorage.setItem('token', payload.data.token);
      }
    );
    builder.addMatcher(
      authApi.endpoints.register.matchFulfilled,
      (state, { payload }) => {
        state.user = payload.data.user;
        state.token = payload.data.token;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        localStorage.setItem('token', payload.data.token);
      }
    );
    builder.addMatcher(
      authApi.endpoints.getProfile.matchFulfilled,
      (state, { payload }) => {
        state.user = payload.data;
        state.loading = false;
        state.error = null;
      }
    );

    // Handle API error states
    builder.addMatcher(
      authApi.endpoints.login.matchRejected,
      (state, { error }) => {
        state.loading = false;
        state.error = error.message || 'An error occurred';
      }
    );
    builder.addMatcher(
      authApi.endpoints.register.matchRejected,
      (state, { error }) => {
        state.loading = false;
        state.error = error.message || 'An error occurred';
      }
    );
    builder.addMatcher(
      authApi.endpoints.getProfile.matchRejected,
      (state, { error }) => {
        state.loading = false;
        state.error = error.message || 'An error occurred';
      }
    );
  },
});

export const { setError, logout } = authSlice.actions;
export default authSlice.reducer;