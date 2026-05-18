import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PinnedLetter } from '@src/services/mappings/editorMappings';
import type { ValidLeftClickNodeType } from '@src/constants/editor';

export interface ClickedEntityNode {
  xmlId: string | null;
  nodeType: string | null;
  nodeTypeValue: string | null;
}

interface EditorLetterSlice {
  letter: {
    id: number | null;
    name: string | null;
    viewMode: 'CODE' | 'WYSIWYG' | null;
    xmlContent: string | null;
    actOfWriting: {
      orderNumber: number | null;
    };
    undoAvailable: boolean;
    redoAvailable: boolean;
    selectedIdentifier: number | null;
    clickedEntityNode: ClickedEntityNode;
  };
  onlyReadableLetter: {
    id: number | null;
    name: string | null;
    xmlContent: string | null;
  };
  tabToCloseId: number | null;
  tabLetter: {
    //PinnedLetter
    id: number | null;
    name: string | null;
    contentChanged: boolean | null;
    xmlContentCurrent?: string | null;
    isPinned: boolean | null; // remote pinned letters are pinned
    viewMode: 'CODE' | 'WYSIWYG' | null;
  };
  reloadLetterContent: boolean;
  tabNumber: number;
  pinnedLetters: PinnedLetter[];
  searchValue: string | null;
  content: {
    nodeClicked: boolean;
    textIsMarked: boolean;
  };
  selectedItem: {
    left: string | null;
    right: string | null;
  };
  dialogType: string | null;
  letterReference: {
    elementType: string | null;
    elementXmlId: string | null;
    elementKey: string | null;
  };
  changeLetterViewMode: boolean;
}

const initialState: EditorLetterSlice = {
  letter: {
    id: null,
    name: null,
    viewMode: null,
    xmlContent: null,
    actOfWriting: {
      orderNumber: null,
    },
    clickedEntityNode: {
      xmlId: null,
      nodeType: null,
      nodeTypeValue: null,
    },
    undoAvailable: false,
    redoAvailable: false,
    selectedIdentifier: null,
  },
  onlyReadableLetter: {
    id: null,
    name: null,
    xmlContent: null,
  },
  tabToCloseId: null, // letter id of the tab to close
  tabLetter: {
    id: null,
    name: null,
    contentChanged: null,
    xmlContentCurrent: null,
    isPinned: null,
    viewMode: null,
  },
  reloadLetterContent: false,
  tabNumber: 0,
  pinnedLetters: [],
  searchValue: null,
  content: {
    nodeClicked: false,
    textIsMarked: false,
  },
  selectedItem: {
    left: null,
    right: null,
  },
  dialogType: null,
  letterReference: {
    elementType: null,
    elementXmlId: null,
    elementKey: null,
  },
  changeLetterViewMode: false,
};

const EditorLetterSlice = createSlice({
  name: 'editorLetter',
  initialState,
  reducers: {
    enableChangeLetterViewMode(state) {
      state.changeLetterViewMode = true;
    },
    disableChangeLetterViewMode(state) {
      state.changeLetterViewMode = false;
    },
    setEditorLetter(state, action) {
      if (!state.letter) {
        state.letter = { ...action.payload.letter };
      } else {
        state.letter = { ...state.letter, ...action.payload.letter };
      }
    },
    setReadableLetter(state, action) {
      state.onlyReadableLetter = { ...action.payload };
    },
    setReloadLetterContent(state, action) {
      state.reloadLetterContent = action.payload.reloadLetterContent;
    },
    setXmlLetterContent(state, action) {
      state.letter.xmlContent = action.payload.content.xmlContent;
    },
    setEditorTabNumber(state, action) {
      state.tabNumber = action.payload.tabNumber;
    },
    setEditorSearchValue(state, action) {
      state.searchValue = action.payload.searchValue;
    },
    setEditorPinnedLetters(state, action) {
      state.pinnedLetters = [...action.payload.pinnedLetters];
    },
    setEditorPinnedLetterViewMode(
      state,
      action: PayloadAction<{ id: number; viewMode: 'CODE' | 'WYSIWYG' }>,
    ) {
      const letter = state.pinnedLetters.find((item) => item.id === action.payload.id);
      if (letter) {
        letter.viewMode = action.payload.viewMode;
      }
    },
    setClickedEntityNode(
      state,
      action: PayloadAction<{
        xmlId: string;
        nodeType: ValidLeftClickNodeType;
        nodeTypeValue: string;
      }>,
    ) {
      state.letter.clickedEntityNode = {
        xmlId: action.payload.xmlId,
        nodeType: action.payload.nodeType,
        nodeTypeValue: action.payload.nodeTypeValue,
      };
    },
    clearClickedEntityNode(state) {
      state.letter.clickedEntityNode = {
        xmlId: null,
        nodeType: null,
        nodeTypeValue: null,
      };
    },
    setSelectedIdentifier(state, action: PayloadAction<{ selectedIdentifier: number }>) {
      state.letter.selectedIdentifier = action.payload.selectedIdentifier;
    },
    clearSelectedIdentifier(state) {
      state.letter.selectedIdentifier = null;
    },
    setEditorPinnedLetterContentChanged(
      state,
      action: PayloadAction<{ id: number; contentChanged: boolean }>,
    ) {
      const letter = state.pinnedLetters.find((item) => item.id === action.payload.id);
      if (letter) {
        letter.contentChanged = action.payload.contentChanged;
        letter.isPinned = true; // This will trigger a re-render
      }
    },
    addLetterToPinned(state, action) {
      if (!state.pinnedLetters.includes(action.payload.pinnedLetter)) {
        state.pinnedLetters = [...state.pinnedLetters, action.payload.pinnedLetter];
      }
    },
    setContentTextIsMarked(state, action) {
      state.content.textIsMarked = action.payload.textIsMarked;
    },
    setNodeClicked(state, action) {
      state.content.nodeClicked = action.payload.nodeClicked;
    },
    setEditorSelectedItem(state, action) {
      state.selectedItem = { ...action.payload.selectedItem };
    },
    setDialogType(state, action) {
      state.dialogType = action.payload.dialogType;
    },
    setLetterReference(state, action) {
      state.letterReference = { ...action.payload.letterReference };
    },
    setEditorLetterUndoRedo(state, action) {
      state.letter = {
        ...state.letter,
        undoAvailable: action.payload.letter.undoAvailable,
        redoAvailable: action.payload.letter.redoAvailable,
      };
    },
    setEditorLetterActOfWriting(state, action) {
      state.letter = {
        ...state.letter,
        actOfWriting: {
          ...state.letter.actOfWriting,
          ...action.payload.letter.actOfWriting,
        },
      };
    },
    setTabToCloseId(state, action: PayloadAction<{ tabToCloseId: number | null }>) {
      state.tabToCloseId = action.payload.tabToCloseId;
    },
  },
});

export const {
  clearSelectedIdentifier,
  enableChangeLetterViewMode,
  disableChangeLetterViewMode,
  setContentTextIsMarked,
  setClickedEntityNode,
  clearClickedEntityNode,
  setEditorLetter,
  setReadableLetter,
  setEditorLetterUndoRedo,
  setEditorLetterActOfWriting,
  setEditorPinnedLetters,
  setEditorPinnedLetterViewMode,
  setEditorPinnedLetterContentChanged,
  setEditorSearchValue,
  setEditorSelectedItem,
  setEditorTabNumber,
  setReloadLetterContent,
  setSelectedIdentifier,
  setXmlLetterContent,
  setDialogType,
  setLetterReference,
  setNodeClicked,
  setTabToCloseId,
} = EditorLetterSlice.actions;

export default EditorLetterSlice.reducer;
