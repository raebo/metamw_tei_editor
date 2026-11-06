import { configureStore } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import editorLetterReducer, { setReloadLetterContent } from '@src/redux/slices/editor.letter.slice';
import { backendOrchestrator } from '@src/utils/editor/backendOrchestrator';
import { backendService } from '@src/utils/editor/backendService';

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

describe('backendOrchestrator.patchWithDispatch', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('reports success and dispatches refresh actions after the backend accepted the XML', async () => {
    jest.spyOn(backendService, 'patchContent').mockResolvedValue(true);
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });

    const saved = await backendOrchestrator.patchWithDispatch(store.dispatch, ['<TEI/>', 42, 'header_updated', null], {
      actionsOnSuccess: [setReloadLetterContent({ reloadLetterContent: true })],
      successMessage: 'saved',
    });

    expect(saved).toBe(true);
    expect(store.getState().editorLetter.reloadLetterContent).toBe(true);
    expect(store.getState().editorLetter.pendingContentUpdates).toBe(0);
    expect(enqueueSnackbar).toHaveBeenCalledWith('saved', { variant: 'success' });
  });

  it('reports failure without dispatching refresh actions', async () => {
    jest.spyOn(backendService, 'patchContent').mockRejectedValue(new Error('save failed'));
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });

    const saved = await backendOrchestrator.patchWithDispatch(store.dispatch, ['<TEI/>', 42, 'header_updated', null], {
      actionsOnSuccess: [setReloadLetterContent({ reloadLetterContent: true })],
      errorMessage: 'could not save',
    });

    expect(saved).toBe(false);
    expect(store.getState().editorLetter.reloadLetterContent).toBe(false);
    expect(store.getState().editorLetter.pendingContentUpdates).toBe(0);
    expect(enqueueSnackbar).toHaveBeenCalledWith('could not save', { variant: 'error' });
  });

  it('allows a contextual error message without hiding the backend reason', async () => {
    jest.spyOn(backendService, 'patchContent').mockRejectedValue(new Error('stack level too deep'));
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });

    const saved = await backendOrchestrator.patchWithDispatch(store.dispatch, ['<TEI/>', 42, 'place_added', null], {
      errorMessage: (message) => `Could not add place: ${message}`,
    });

    expect(saved).toBe(false);
    expect(enqueueSnackbar).toHaveBeenCalledWith('Could not add place: stack level too deep', {
      variant: 'error',
    });
  });
});
