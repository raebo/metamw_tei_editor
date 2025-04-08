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
    contentChanged: boolean | null
    isPinned: boolean | null // remote pinned letters are pinned
  },
  reloadLetterContent: boolean
  tabNumber: number
  pinnedLetters: PinnedLetter[]
  searchValue: string | null,
  content: {
    nodeClicked: boolean
    textIsMarked: boolean
  },
  selectedItem: {
    left: string | null,
    right: string | null,
  },
  dialogType: string | null,
  letterReference: {
    elementType: string | null,
    elementXmlId: string | null,
    elementKey: string | null
  }
}

const initialState: EditorLetterSlice = {
  letter: {
    id: null,
    name: null
  },
  tabLetter: {
    id: null,
    name: null,
    contentChanged: null,
    isPinned: null
  },
  reloadLetterContent: false,
  tabNumber: 0,
  pinnedLetters: [],
  searchValue: null,
  content: {
    nodeClicked: false,
    textIsMarked: false
  },
  selectedItem: {
    left: null,
    right: null
  },
  dialogType: null,
  letterReference: {
    elementType: null,
    elementXmlId: null,
    elementKey: null
  }
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
    setReloadLetterContent(state, action) {
      state.reloadLetterContent = action.payload.reloadLetterContent
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
    },
    setContentTextIsMarked(state, action) {
      state.content.textIsMarked = action.payload.textIsMarked
    },

    setNodeClicked(state, action) {
      state.content.nodeClicked= action.payload.nodeClicked
    },
    setEditorSelectedItem(state, action) {
      state.selectedItem = {...action.payload.selectedItem}
    },
    setDialogType(state, action) {
      state.dialogType = action.payload.dialogType
    },
    setLetterReference(state, action) {
      state.letterReference = { ...action.payload.letterReference }
    }
  }
})

export const
  { setEditorLetter,
    setContentTextIsMarked,
    setEditorSelectedItem,
    setEditorTabNumber,
    setEditorSearchValue,
    setEditorPinnedLetters,
    setReloadLetterContent,
    setDialogType,
    setLetterReference,
    setNodeClicked,
  } = EditorLetterSlice.actions

export default EditorLetterSlice.reducer
