import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { refreshUserData } from "../../components/auth/authActions";
import { AuthUser } from "../../services/mappings/authMappings";

interface AuthState {
  user: {
    id: number,
    login: string
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
  // extraReducers: (builder) => {
  //   builder
  //     // Handle the fulfilled case
  //     .addCase(refreshUserData.fulfilled, (state, action: PayloadAction<AuthUser>) => {
  //       state.user = action.payload;
  //       state.isAuthenticated = true;
  //       // state.isLoading = false;
  //     })
  //     .addCase(refreshUserData.rejected, (state, action) => {
  //       if (action.payload) {
  //         console.error(action.payload); // Handle the rejection message (error)
  //       }
  //       state.user = null;
  //       state.isAuthenticated = false;
  //       // state.isLoading = false;
  //     })
  //     // Handle the pending case (optional)
  //     .addCase(refreshUserData.pending, (state) => {
  //       // state.isLoading = true; // Set loading state to true when the action is in progress
  //     });
  // },
});

export const { loginState, logoutState } = authSlice.actions;

export default authSlice.reducer;
