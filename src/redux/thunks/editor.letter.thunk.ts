import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  setContentTextIsMarked,
  setEditorPinnedLetters,
  setEditorSelectedItem,
  setEditorTabNumber
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
  }
);

export const setEditorMarkedAndContentLeftRightThunk = createAsyncThunk(
  'editor/setEditorMarkedAndContentLeftRight',
  async (
    { textIsMarked, contentLeft, contentRight }: { textIsMarked: boolean; contentLeft: string | null; contentRight: string | null},
    { dispatch }
  ) => {

    dispatch(setContentTextIsMarked({ textIsMarked: textIsMarked }));
    dispatch(setEditorSelectedItem({ selectedItem: { left: contentLeft, right: contentRight } }))
  }
  )
