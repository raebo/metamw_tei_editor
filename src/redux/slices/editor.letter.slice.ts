import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PinnedLetter } from "../../services/mappings/editorMappings";

interface EditorLetterSlice {
  letter: {
    id: number | null
    name: string | null
    viewMode: 'CODE' | 'WYSIWYG' | null
  },
  tabLetter: {
    id: number | null
    name: string | null
    contentChanged: boolean | null
    isPinned: boolean | null // remote pinned letters are pinned
    viewMode: 'CODE' | 'WYSIWYG' | null
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
  changeLetterViewMode: boolean
}

const initialState: EditorLetterSlice = {
  letter: {
    id: null,
    name: null,
    viewMode: null
  },
  tabLetter: {
    id: null,
    name: null,
    contentChanged: null,
    isPinned: null,
    viewMode: null
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
  },
  changeLetterViewMode: false
}

const EditorLetterSlice = createSlice({
  name: 'editorLetter',
  initialState,
  reducers: {
    enableChangeLetterViewMode(state) {
      state.changeLetterViewMode = true
    },
    disableChangeLetterViewMode(state) {
      state.changeLetterViewMode = false
    },
    setEditorLetter(state, action) {
      if (!state.letter) {
        state.letter = {...action.payload.letter}
      } else {
        state.letter = {...state.letter, ...action.payload.letter}
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
    setEditorPinnedLetterViewMode(state, action: PayloadAction<{ id: number, viewMode: "CODE" | "WYSIWYG" }>) {
      const letter = state.pinnedLetters.find(item => item.id === action.payload.id);
      if (letter) {
        letter.viewMode = action.payload.viewMode;
      }
    },
    addLetterToPinned(state, action) {
      if (!state.pinnedLetters.includes(action.payload.pinnedLetter)) {
        state.pinnedLetters = [...state.pinnedLetters, action.payload.pinnedLetter];
      }
    },
    setContentTextIsMarked(state, action) {
      state.content.textIsMarked = action.payload.textIsMarked
    },
    setNodeClicked(state, action) {
      state.content.nodeClicked = action.payload.nodeClicked
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
  {
    enableChangeLetterViewMode,
    disableChangeLetterViewMode,
    setEditorLetter,
    setContentTextIsMarked,
    setEditorSelectedItem,
    setEditorTabNumber,
    setEditorSearchValue,
    setEditorPinnedLetters,
    setEditorPinnedLetterViewMode,
    setReloadLetterContent,
    setDialogType,
    setLetterReference,
    setNodeClicked,
  } = EditorLetterSlice.actions

export default EditorLetterSlice.reducer
