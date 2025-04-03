import { createSlice } from '@reduxjs/toolkit';
import { AUTH_TOKEN_NAME } from "../../utils/auth";

interface AuthState {
  user: {
    id: number,
    login: string
    last_name: string,
    first_name: string,
  } | null
  isAuthenticated: boolean;
  token: string | null
  settings?: {
    letterFontSize: number
  }
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem(AUTH_TOKEN_NAME) ?? null,
  settings: {
    letterFontSize: 100
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginState(state, action) {
      state.user = {...state.user, ...action.payload.user}
      state.isAuthenticated = true;
      state.token = action.payload.token;
      localStorage.setItem(AUTH_TOKEN_NAME, action.payload.token)
    },
    logoutState(state) {
      state.user = null
      state.isAuthenticated = false;
      state.token = null;
      localStorage.removeItem(AUTH_TOKEN_NAME);
    },
    loginSetToken(state, action) {
      state.token = action.payload.token;
      localStorage.setItem(AUTH_TOKEN_NAME, action.payload.token);
    },
    setLetterFontSize(state, action) {
      if (state.settings) {
        state.settings.letterFontSize = action.payload.fontSize;
      } else {
        state.settings = {
          letterFontSize: action.payload.fontSize,
        };
      }
    }
  },
});

export const { loginState, loginSetToken, logoutState, setLetterFontSize } = authSlice.actions;

export default authSlice.reducer;
