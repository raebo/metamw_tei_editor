import { enqueueSnackbar } from 'notistack';
import { EditorUtils } from '@src/utils/editor/index';
import type { AppDispatch } from '@src/redux/redux.store';
import type { Action, ThunkAction } from '@reduxjs/toolkit';
import { RootState } from '@src/redux/redux.store';
import { setEditorLetterUndoRedo } from '@src/redux/slices/editor.letter.slice';

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
      await EditorUtils.backendService.patchContent(...params);

      dispatch(setEditorLetterUndoRedo({ letter: { undoAvailable: true, redoAvailable: false } }));
      options?.actionsOnSuccess?.forEach((action) => dispatch(action));

      if (options?.successMessage) {
        enqueueSnackbar(options.successMessage, { variant: 'success' });
      }
    } catch (e: any) {
      enqueueSnackbar(options?.errorMessage ?? e.message, { variant: 'error' });
    }
  },
};
