import { createSlice } from "@reduxjs/toolkit";
import { PinnedLetter } from "../../services/mappings/editorMappings";

interface EditorLetterSlice {
  letter: {
    id: number | null
    name: string | null
  },
  tabLetter: {
    id: number | null
    name: string | null
  }
  tabNumber: number
  pinnedLetters: PinnedLetter[]
  searchValue: string | null
}

const initialState: EditorLetterSlice = {
  letter: {
    id: null,
    name: null
  },
  tabLetter: {
    id: null,
    name: null
  },
  tabNumber: 0,
  pinnedLetters: [],
  searchValue: null
}

const EditorLetterSlice = createSlice({
  name: 'editorLetter',
  initialState,
  reducers: {
    setEditorLetter(state, action) {
      if (!state.letter) {
        state.letter = {...action.payload.letter}
      } else {
        state.letter = {...state.letter, ...action.payload.letter}
      }
    },
    setEditorTabLetter(state, action) {
      if (!state.tabLetter) {
        state.tabLetter = { ...action.payload.tabLetter }
        state.tabNumber = { ...action.payload.tabNumber }
      } else {
        state.tabLetter = {...state.tabLetter, ...action.payload.tabLetter}
        state.tabNumber = { ...action.payload.tabNumber }
      }
    },
    setEditorTabNumber(state, action) {
      state.tabNumber = action.payload.tabNumber
    },
    setEditorSearchValue(state, action) {
      state.searchValue = action.payload.searchValue
    },
    setEditorPinnedLetters(state, action) {
      state.pinnedLetters = [...action.payload.pinnedLetters]
    },
    addLetterToPinned(state, action) {
      if (!state.pinnedLetters.includes(action.payload.pinnedLetter)) {
        let pinnedLetters = [...state.pinnedLetters]
        pinnedLetters.push(action.payload.pinnedLetter)

        state.pinnedLetters = pinnedLetters
      }
    },
    removeLetterFromPinned(state, action) {
      if (action.payload.pinnedLetter) {
        state.pinnedLetters = state.pinnedLetters.filter((pinnedLetter: PinnedLetter) => pinnedLetter.id !== action.payload.pinnedLetter.id)
      }
    }
  }
})

export const
  { setEditorLetter, setEditorTabLetter, setEditorTabNumber, addLetterToPinned, removeLetterFromPinned, setEditorSearchValue, setEditorPinnedLetters } = EditorLetterSlice.actions

export default EditorLetterSlice.reducer
