import { enqueueSnackbar } from 'notistack';
import { EditorUtils } from '@src/utils/editor/index';
import type { AppDispatch } from '@src/redux/redux.store';
import type { Action, ThunkAction } from '@reduxjs/toolkit';
import { RootState } from '@src/redux/redux.store';
import {
  setEditorLetterUndoRedo,
  setEditorPinnedLetterContentChanged,
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
      errorMessage?: string;
    },
  ) => {
    try {
      const letterId = params[1];

      if (!letterId) {
        enqueueSnackbar('Letter could not be updated on backend side: No letter id found', {
          variant: 'error',
        });
        return;
      }

      await EditorUtils.backendService.patchContent(...params);

      dispatch(setEditorLetterUndoRedo({ letter: { undoAvailable: true, redoAvailable: false } }));
      dispatch(setEditorPinnedLetterContentChanged({ id: letterId, contentChanged: true }));
      options?.actionsOnSuccess?.forEach((action) => dispatch(action));

      if (options?.successMessage) {
        enqueueSnackbar(options.successMessage, { variant: 'success' });
      }
    } catch (e: any) {
      enqueueSnackbar(options?.errorMessage ?? e.message, { variant: 'error' });
    }
  },
};
