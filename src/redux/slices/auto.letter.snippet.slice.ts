import { createSlice } from '@reduxjs/toolkit';

interface AutoLetterSnippetState {
  snippet: {
    id: string,
    xmlId: string,
    referenceName: string
    referenceKey: string
    referenceType: string
  } | null
  letter: {
    id: string | null,
    reloadStatus?: boolean
  } | null
  job: {
    id:string | null,
    reloadStatus?: boolean
  } | null;
}

const initialState: AutoLetterSnippetState = {
  snippet: null,
  letter: {
    id: null,
    reloadStatus: false
  },
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

      if (state.snippet?.id) {
        state.job = { id: "", reloadStatus: false };
        state.letter = { id: "", reloadStatus: false };
      }
    },
    clearSnippetState(state) {
      state.snippet= null
      state.job = null
    },

    setReloadStatus(state, action) {
      if (!state.letter) {
        state.letter = { ...action.payload.letter}
      } else {
        state.letter = { ...state.letter, ...action.payload.letter};
        console.log("setReloadStatus: ", state.letter)
      }
    }
  },
});

export const { setCurrentSnippet, clearSnippetState, setReloadStatus} = autoLetterSnippetSlice.actions;

export default autoLetterSnippetSlice.reducer;
