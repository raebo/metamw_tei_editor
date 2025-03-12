import { createSlice } from '@reduxjs/toolkit';

interface AuthState {
  user: {
    id: number,
    login: string
    last_name: string,
    first_name: string,
  } | null
  isAuthenticated: boolean;
  token: string | null
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem("token") ?? null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginState(state, action) {
      state.user = {...state.user, ...action.payload.user}
      state.isAuthenticated = true;
      state.token = action.payload.token;
      localStorage.setItem('token', action.payload.token)
    },
    logoutState(state) {
      state.user = null
      state.isAuthenticated = false;
      state.token = null;
      localStorage.removeItem('token');
    },
    loginSetToken(state, action) {
      state.token = action.payload.token;
      localStorage.setItem('token', action.payload.token);
    }
  },
});

export const { loginState, loginSetToken, logoutState } = authSlice.actions;

export default authSlice.reducer;
