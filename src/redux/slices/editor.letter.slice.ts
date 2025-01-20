import { createSlice } from "@reduxjs/toolkit";

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
      console.log("setEditorTabNumber: ", action.payload.tabNumber);
      state.tabNumber = action.payload.tabNumber
    },
    setEditorSearchValue(state, action) {
      state.searchValue = action.payload.searchValue
    }
  }
})

export const { setEditorLetter, setEditorTabLetter, setEditorTabNumber, setEditorSearchValue } = EditorLetterSlice.actions

export default EditorLetterSlice.reducer
