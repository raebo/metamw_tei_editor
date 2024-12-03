import { createSlice } from '@reduxjs/toolkit';

interface AuthState {
  user: {
    last_name: string,
    first_name: string,
  } | null
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginState(state, action) {
      state.user = {...state.user, ...action.payload }
      state.isAuthenticated = true;
    },
    logoutState(state) {
      state.user = null
      state.isAuthenticated = false;
    },
  },
});

export const { loginState, logoutState } = authSlice.actions;

export default authSlice.reducer;