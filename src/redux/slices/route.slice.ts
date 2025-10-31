import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RouteState {
  currentPath: string;
  previousPath: string;
}

const initialState: RouteState = {
  currentPath: '/',
  previousPath: '/',
};

const routeSlice = createSlice({
  name: 'route',
  initialState,
  reducers: {
    setCurrentPath: (state, action: PayloadAction<string>) => {
      state.previousPath = state.currentPath;
      state.currentPath = action.payload;
    },
    clearPath: (state) => {
      state.currentPath = '/';
      state.previousPath = '/';
      localStorage.removeItem('lastVisitedPath');
    },
  },
});

export const { setCurrentPath, clearPath } = routeSlice.actions;
export default routeSlice.reducer;
