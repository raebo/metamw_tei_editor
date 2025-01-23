import { createAsyncThunk } from '@reduxjs/toolkit';
import { setEditorPinnedLetters, setEditorTabNumber } from "../slices/editor.letter.slice";
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
