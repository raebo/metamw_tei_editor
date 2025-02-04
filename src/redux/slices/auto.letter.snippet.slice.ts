import { createSlice } from '@reduxjs/toolkit'
import { SnippetReference } from "../../services/mappings/autoAnnoMappings";

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
  snippetFormContainer: {
    form: string
    buttons: string
    actionButtonDisabled?: boolean
  }
  snippetReferences: {
    items: SnippetReference[] | []
    showReferences: boolean
    referenceFormActive: boolean
  }
  letter: {
    id: string | null,
    reloadStatus?: boolean
    reloadSnippetsStatus?: boolean
    contentChanged?: boolean
  } | null
  job: {
    id:string | null,
    reloadStatus: boolean
  } | null
}

const initialState: AutoLetterSnippetState = {
  snippet: null,
  snippetFormContainer: {
    form: "BLANK_FORM",
    buttons: "BLANK_BUTTONS",
    actionButtonDisabled: true
  },
  snippetReferences: {
    items: [],
    showReferences: false,
    referenceFormActive: true
  },
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
}

const autoLetterSnippetSlice = createSlice({
  name: 'autoLetterSnippet',
  initialState,
  reducers: {
    setAutoAnnoSnippet(state, action) {
      if (!state.snippet) {
        state.snippet = { ...action.payload.snippet }
      } else {
        state.snippet = { ...state.snippet, ...action.payload.snippet }
      }

      if (state.snippet?.id) {
        state.job = { id: "", reloadStatus: false }
        state.letter = { id: "", reloadStatus: false }
      }
    },
    setAutoSnippetFormContainer(state, action) {
      if (!state.snippetFormContainer) {
        state.snippetFormContainer = { ...action.payload.snippetFormContainer }
      } else {
        state.snippetFormContainer = { ...state.snippetFormContainer, ...action.payload.snippetFormContainer}
      }
    },
    clearSnippetState(state) {
      state.snippet= null
      state.snippetFormContainer= { form: "BLANK_FORM", buttons: "BLANK_BUTTONS" }
    },

    setAutoAnnoLetter(state, action) {
      if (!state.letter) {
        state.letter = { ...action.payload.letter}
      } else {
        state.letter = { ...state.letter, ...action.payload.letter}
      }
    },
    setSnippetReferences(state, action) {
      state.snippetReferences= action.payload.references
    },
    setSnippetReferenceFormActive(state, action) {
      state.snippetReferences.referenceFormActive = action.payload.referenceFormActive
    }
  },
})

export const { setAutoAnnoSnippet, setAutoSnippetFormContainer, setSnippetReferenceFormActive, clearSnippetState, setAutoAnnoLetter, setSnippetReferences } = autoLetterSnippetSlice.actions

export default autoLetterSnippetSlice.reducer
