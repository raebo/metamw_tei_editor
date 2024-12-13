import { createSlice } from '@reduxjs/toolkit';

interface AutoLetterSnippetState {
  snippet: {
    id: number,
    xmlId: string,
    referenceName: string
    referenceKey: string
    referenceType: string
  } | null
  letter: {
    id: string | null,
    reloadStatus?: boolean
    reloadSnippetsStatus?: boolean
  } | null
  job: {
    id:string | null,
    reloadStatus: boolean
  } | null;
}

const initialState: AutoLetterSnippetState = {
  snippet: null,
  letter: {
    id: null,
    reloadStatus: false,
    reloadSnippetsStatus: true
  },
  job: {
    id: null,
    reloadStatus: true
  }
};

const autoLetterSnippetSlice = createSlice({
  name: 'autoLetterSnippet',
  initialState,
  reducers: {
    setAutoAnnoSnippet(state, action) {
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

    setAutoAnnoLetter(state, action) {
      if (!state.letter) {
        state.letter = { ...action.payload.letter}
      } else {
        state.letter = { ...state.letter, ...action.payload.letter};
      }
    },
  },
});

export const { setAutoAnnoSnippet, clearSnippetState, setAutoAnnoLetter} = autoLetterSnippetSlice.actions;

export default autoLetterSnippetSlice.reducer;
