import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  role: 'MERCHANT_OWNER' | 'MERCHANT_ADMIN' | 'MERCHANT_DEV' | 'SUPER_ADMIN';
  merchantId?: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

// Load initial state from localStorage if available
const loadInitialState = (): AuthState => {
  try {
    const serializedState = localStorage.getItem('authState');
    if (serializedState) {
      const parsed = JSON.parse(serializedState);
      return {
        ...parsed,
        isInitialized: true,
      };
    }
  } catch (err) {
    console.error('Failed to load auth state from localStorage:', err);
  }
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isInitialized: true,
  };
};

const initialState: AuthState = loadInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken?: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      state.isAuthenticated = true;
      state.isInitialized = true;
      localStorage.setItem('authState', JSON.stringify({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }));
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      localStorage.removeItem('authState');
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
  },
});

export const { setCredentials, logout, setInitialized } = authSlice.actions;
export default authSlice.reducer;
