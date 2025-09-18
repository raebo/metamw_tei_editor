import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authentication.slice';
import spinnerLoadingReducer from './slices/spinner.loading.slice';
import autoLetterSnippetReducer from './slices/auto.letter.snippet.slice';
import editorLetterSliceReducer from './slices/editor.letter.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    spinnerLoading: spinnerLoadingReducer,
    autoLetterSnippet: autoLetterSnippetReducer,
    editorLetter: editorLetterSliceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
