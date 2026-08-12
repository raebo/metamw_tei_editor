import { createSlice } from '@reduxjs/toolkit';

interface AuthState {
  user: {
    id: number;
    login: string;
    firstName: string;
    lastName: string;
  } | null;
  isAuthenticated: boolean;
  settings?: {
    letterFontSize: number;
  };
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  settings: {
    letterFontSize: 100,
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoginState(state, action) {
      state.user = { ...state.user, ...action.payload.user };
      state.isAuthenticated = true;
    },
    setLogoutState(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
    setLetterFontSize(state, action) {
      if (state.settings) {
        state.settings.letterFontSize = action.payload.fontSize;
      } else {
        state.settings = {
          letterFontSize: action.payload.fontSize,
        };
      }
    },
  },
});

export const { setLoginState, setLogoutState, setLetterFontSize } = authSlice.actions;

export default authSlice.reducer;
