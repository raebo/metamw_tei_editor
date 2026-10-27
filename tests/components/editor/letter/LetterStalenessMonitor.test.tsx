import React from 'react';
import { act, render } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import '@src/i18n';
import LetterStalenessMonitor from '@src/components/editor/letter/LetterStalenessMonitor';
import { useLetterStalenessPolling } from '@src/components/editor/letter/hooks/useLetterStalenessPolling';
import editorLetterReducer, {
  setEditorLetter,
  setEditorPinnedLetters,
  setLifecycleOperationInProgress,
} from '@src/redux/slices/editor.letter.slice';

jest.mock('@src/components/editor/letter/hooks/useLetterStalenessPolling', () => ({
  useLetterStalenessPolling: jest.fn(),
}));

jest.mock('@src/components/editor/letter/hooks/useRebaseLetter', () => ({
  useRebaseLetter: () => jest.fn(),
}));

jest.mock('notistack', () => ({
  closeSnackbar: jest.fn(),
  enqueueSnackbar: jest.fn(),
}));

const mockUseLetterStalenessPolling = useLetterStalenessPolling as jest.MockedFunction<typeof useLetterStalenessPolling>;

describe('LetterStalenessMonitor', () => {
  it('pauses polling while a rename or discard operation is in progress', () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(
      setEditorPinnedLetters({
        pinnedLetters: [
          {
            id: 7,
            name: 'fmb-1840-06-06-01',
            contentChanged: true,
            isPinned: true,
            viewMode: 'WYSIWYG',
            capabilities: null,
            version: null,
          },
        ],
      }),
    );
    store.dispatch(
      setEditorLetter({
        letter: { id: 7, name: 'fmb-1840-06-06-01', viewMode: 'WYSIWYG' },
      }),
    );

    render(
      <Provider store={store}>
        <LetterStalenessMonitor />
      </Provider>,
    );

    expect(mockUseLetterStalenessPolling.mock.calls.at(-1)?.[0].letterId).toBe(7);

    act(() => {
      store.dispatch(setLifecycleOperationInProgress(true));
    });

    expect(mockUseLetterStalenessPolling.mock.calls.at(-1)?.[0].letterId).toBeNull();
  });
});
