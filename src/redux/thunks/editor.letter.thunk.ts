import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  setContentTextIsMarked, setDialogType, setEditorLetter,
  setEditorPinnedLetters,
  setEditorSelectedItem,
  setEditorTabNumber, setLetterReference, setNodeClicked
} from "../slices/editor.letter.slice";
import { PinnedLetter } from "../../services/mappings/editorMappings";

export const setEditorTabAndPinnedLettersThunk = createAsyncThunk(
  'editor/setEditorTabAndPinnedLetters',
  async (
    { pinnedLetters, tabNumber }: { pinnedLetters: PinnedLetter[]; tabNumber: number },
    { dispatch }
  ) => {
    dispatch(setEditorPinnedLetters({ pinnedLetters }));
    dispatch(setEditorTabNumber({ tabNumber }));
    if (tabNumber === -1) {
      dispatch(setEditorLetter({ letter: { id: null, name: null } }));
    }
  }
);

export const setEditorTabAndPinnedLetterThunk = createAsyncThunk(
  'editor/setEditorTabAndPinnedLetter',
  async (
    { pinnedLetter, tabNumber }: { pinnedLetter: { id: number, name: string}; tabNumber: number },
    { dispatch }
  ) => {
    dispatch(setEditorLetter({ letter: pinnedLetter}));
    dispatch(setEditorTabNumber({ tabNumber }));
    if (tabNumber === -1) {
      dispatch(setEditorLetter({ letter: { id: null, name: null } }));
    }
  }
);

export const setEditorMarkedAndContentLeftRightThunk = createAsyncThunk(
  'editor/setEditorMarkedAndContentLeftRight',
  async (
    { textIsMarked, contentLeft, contentRight }: { textIsMarked: boolean; contentLeft: string | null; contentRight: string | null},
    { dispatch }
  ) => {

    dispatch(setContentTextIsMarked({ textIsMarked: textIsMarked }));
    dispatch(setNodeClicked({ nodeClicked: false}));
    dispatch(setEditorSelectedItem({ selectedItem: { left: contentLeft, right: contentRight } }))
  }
)

export const setEditorNodeClickedAndContentLeftRightThunk = createAsyncThunk(
  'editor/setEditorNodeClickedAndContentLeftRight',
  async (
    { nodeClicked, textIsMarked, contentLeft, contentRight }: { nodeClicked: boolean; textIsMarked: boolean, contentLeft: string | null; contentRight: string | null},
    { dispatch }
  ) => {

    dispatch(setNodeClicked({ nodeClicked: nodeClicked }));
    dispatch(setContentTextIsMarked({ textIsMarked: false}));
    dispatch(setEditorSelectedItem({ selectedItem: { left: contentLeft, right: contentRight } }))
  }
)

export const setEditorDialogAndReferenceThunk = createAsyncThunk(
  'editor/setEditorDialogAndReference',
  async (
    { dialogType, elementType, elementXmlId, elementKey }: { dialogType: string ; elementType: string ;elementXmlId: string; elementKey: string | null },
    { dispatch }
  ) => {

    dispatch(setDialogType({ dialogType: dialogType }))
    dispatch(setLetterReference({
      letterReference: {
        elementType: elementType,
        elementXmlId: elementXmlId,
        elementKey: elementKey
      }
    }))
  }
)
