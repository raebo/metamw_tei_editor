import { enqueueSnackbar } from 'notistack';
import { EditorUtils } from '@src/utils/editor/index';
import type { AppDispatch } from '@src/redux/redux.store';
import type { Action, ThunkAction } from '@reduxjs/toolkit';
import { RootState } from '@src/redux/redux.store';
import {
  finishContentUpdate,
  setEditorLetterUndoRedo,
  setEditorPinnedLetterContentChanged,
  startContentUpdate,
} from '@src/redux/slices/editor.letter.slice';

// Accepts either:
// 1. Plain actions (`Action`)
// 2. Thunks (`ThunkAction<void, RootState, unknown, Action>`)
export type DispatchableAction = Action | ThunkAction<void, RootState, unknown, Action>;

export const backendOrchestrator = {
  patchWithDispatch: async (
    dispatch: AppDispatch,
    params: Parameters<typeof EditorUtils.backendService.patchContent>,
    options?: {
      actionsOnSuccess?: DispatchableAction[];
      successMessage?: string;
      errorMessage?: string | ((message: string) => string);
    },
  ) => {
    dispatch(startContentUpdate());
    try {
      const letterId = params[1];

      if (!letterId) {
        enqueueSnackbar('Letter could not be updated on backend side: No letter id found', {
          variant: 'error',
        });
        return false;
      }

      await EditorUtils.backendService.patchContent(...params);

      dispatch(setEditorLetterUndoRedo({ letter: { undoAvailable: true, redoAvailable: false } }));
      dispatch(setEditorPinnedLetterContentChanged({ id: letterId, contentChanged: true }));
      options?.actionsOnSuccess?.forEach((action) => dispatch(action));

      if (options?.successMessage) {
        enqueueSnackbar(options.successMessage, { variant: 'success' });
      }
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const errorMessage = options?.errorMessage;
      const displayedMessage = typeof errorMessage === 'function' ? errorMessage(message) : (errorMessage ?? message);
      enqueueSnackbar(displayedMessage, { variant: 'error' });
      return false;
    } finally {
      dispatch(finishContentUpdate());
    }
  },
};
