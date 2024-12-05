import { createSlice } from '@reduxjs/toolkit';

interface AutoLetterSnippetState {
  snippet: {
    id: string,
    xmlId: string,
    referenceName: string
  } | null
  job: {
    id:string
  } | null;
}

const initialState: AutoLetterSnippetState = {
  snippet: null,
  job: null
};

const autoLetterSnippetSlice = createSlice({
  name: 'autoLetterSnippet',
  initialState,
  reducers: {
    setCurrentSnippet(state, action) {
      if (!state.snippet) {
        state.snippet = { ...action.payload.snippet };
      } else {
        state.snippet = { ...state.snippet, ...action.payload.snippet };
      }

      // Update `job` if `snippet.id` exists
      if (state.snippet?.id) {
        state.job = { id: state.snippet.id };
      }

    },
    clearSnippetState(state) {
      state.snippet= null
      state.job = null
    },
  },
});

export const { setCurrentSnippet, clearSnippetState} = autoLetterSnippetSlice.actions;

export default autoLetterSnippetSlice.reducer;
