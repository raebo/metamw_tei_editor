import { createSlice } from '@reduxjs/toolkit';

interface AutoLetterSnippetState {
  snippet: {
    id: number,
    xmlId: string,
    referenceName: string
    referenceKey: string
    referenceType: string
    referenceNameChanged: string
    referenceKeyChanged: string
    referenceTypeChanged: string
  } | null
  snippetShow: {
    referenceName: string
    referenceKey: string
    referenceType: string
  } | null
  letter: {
    id: string | null,
    reloadStatus?: boolean
    reloadSnippetsStatus?: boolean
    contentChanged?: boolean
  } | null
  job: {
    id:string | null,
    reloadStatus: boolean
  } | null;
}

const initialState: AutoLetterSnippetState = {
  snippet: null,
  snippetShow: null,
  letter: {
    id: null,
    reloadStatus: true,
    reloadSnippetsStatus: true,
    contentChanged: false
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
    setAutoAnnoSnippetShow(state, action) {
      if (!state.snippetShow) {
        state.snippetShow = { ...action.payload.snippetShow };
      } else {
        state.snippetShow = { ...state.snippetShow, ...action.payload.snippetShow };
      }
    },
    clearSnippetState(state) {
      state.snippet= null
      state.snippetShow= null
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

export const { setAutoAnnoSnippet, setAutoAnnoSnippetShow, clearSnippetState, setAutoAnnoLetter} = autoLetterSnippetSlice.actions;

export default autoLetterSnippetSlice.reducer;
