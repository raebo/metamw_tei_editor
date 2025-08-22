import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  disableChangeLetterViewMode,
  enableChangeLetterViewMode,
  setContentTextIsMarked,
  setDialogType,
  setEditorLetter,
  setEditorPinnedLetters,
  setEditorPinnedLetterViewMode,
  setEditorSelectedItem,
  setEditorTabNumber,
  setLetterReference,
  setNodeClicked, setReloadLetterContent,
} from '../slices/editor.letter.slice';
import { PinnedLetter } from '../../services/mappings/editorMappings';

export const setEditorTabAndPinnedLettersThunk = createAsyncThunk(
  'editor/setEditorTabAndPinnedLetters',
  async ({ pinnedLetters, tabNumber }: { pinnedLetters: PinnedLetter[]; tabNumber: number }, { dispatch }) => {
    dispatch(setEditorPinnedLetters({ pinnedLetters }));
    dispatch(setEditorTabNumber({ tabNumber }));
    if (tabNumber === -1) {
      dispatch(setEditorLetter({ letter: { id: null, name: null } }));
    }
  },
);

export const setEditorTabAndPinnedLetterThunk = createAsyncThunk(
  'editor/setEditorTabAndPinnedLetter',
  async (
    {
      letter,
      tabNumber,
    }: {
      letter: { id: number; name: string; viewMode: 'CODE' | 'WYSIWYG' | null };
      tabNumber: number;
    },
    { dispatch },
  ) => {

    dispatch(setEditorLetter({ letter: letter }));
    dispatch(setEditorTabNumber({ tabNumber }));
    if (tabNumber === -1) {
      dispatch(setEditorLetter({ letter: { id: null, name: null } }));
    }
  },
);

export const setEditorPinnedLettersViewModeThunk = createAsyncThunk(
  'editor/setEditorPinnedLettersViewMode',
  async (
    {
      stateEditorLetter,
      viewMode,
    }: {
      stateEditorLetter: { id: number | null; name: string | null; viewMode: 'CODE' | 'WYSIWYG' | null };
      viewMode: 'CODE' | 'WYSIWYG';
    },
    { dispatch },
  ) => {

    if(!stateEditorLetter.id) return

    dispatch(disableChangeLetterViewMode())

    try {
      dispatch(setEditorLetter({ letter: { ...stateEditorLetter, viewMode: viewMode } }));
      dispatch(setEditorPinnedLetterViewMode({ id: stateEditorLetter.id, viewMode: viewMode }));
    } finally {
      dispatch(enableChangeLetterViewMode())
    }
  },
);

export const setEditorMarkedAndContentLeftRightThunk = createAsyncThunk(
  'editor/setEditorMarkedAndContentLeftRight',
  async (
    {
      textIsMarked,
      contentLeft,
      contentRight,
    }: {
      textIsMarked: boolean;
      contentLeft: string | null;
      contentRight: string | null;
    },
    { dispatch },
  ) => {
    dispatch(setContentTextIsMarked({ textIsMarked: textIsMarked }));
    dispatch(setNodeClicked({ nodeClicked: false }));
    dispatch(setEditorSelectedItem({ selectedItem: { left: contentLeft, right: contentRight } }));
  },
);

export const setEditorNodeClickedAndContentLeftRightThunk = createAsyncThunk(
  'editor/setEditorNodeClickedAndContentLeftRight',
  async (
    {
      nodeClicked,
      textIsMarked,
      contentLeft,
      contentRight,
    }: {
      nodeClicked: boolean;
      textIsMarked: boolean;
      contentLeft: string | null;
      contentRight: string | null;
    },
    { dispatch },
  ) => {
    dispatch(setNodeClicked({ nodeClicked: nodeClicked }));
    dispatch(setContentTextIsMarked({ textIsMarked: textIsMarked }));
    dispatch(setEditorSelectedItem({ selectedItem: { left: contentLeft, right: contentRight } }));
    dispatch(setReloadLetterContent({ reloadLetterContent: true }))
  },
);

export const setEditorDialogAndReferenceThunk = createAsyncThunk(
  'editor/setEditorDialogAndReference',
  async (
    {
      dialogType,
      elementType,
      elementXmlId,
      elementKey,
    }: {
      dialogType: string;
      elementType: string;
      elementXmlId: string;
      elementKey: string | null;
    },
    { dispatch },
  ) => {
    dispatch(setDialogType({ dialogType: dialogType }));
    dispatch(
      setLetterReference({
        letterReference: {
          elementType: elementType,
          elementXmlId: elementXmlId,
          elementKey: elementKey,
        },
      }),
    );
  },
);
