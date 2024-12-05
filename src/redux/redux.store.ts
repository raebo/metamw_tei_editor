import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/user.slice';
import spinnerLoadingReducer from './slices/spinner.loading.slice';
import autoLetterSnippetReducer from './slices/auto.letter.snippet.slice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    spinnerLoading: spinnerLoadingReducer,
    autoLetterSnippet: autoLetterSnippetReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

