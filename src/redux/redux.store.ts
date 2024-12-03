import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/user.slice';
import spinnerLoadingReducer from './slices/spinner.loading.slice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    spinnerLoading: spinnerLoadingReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

