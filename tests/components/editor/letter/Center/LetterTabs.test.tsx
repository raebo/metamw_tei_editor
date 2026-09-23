import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import LetterTabs from '@src/components/editor/letter/Center/LetterTabs';
import editorLetterReducer, {
  setEditorLetter,
  setEditorPinnedLetterContentChanged,
  setEditorPinnedLetters,
  setEditorTabNumber,
} from '@src/redux/slices/editor.letter.slice';
import theme from '@src/utils/theme/theme';

jest.mock('@src/services/editor/apiPinnedLettersRequest.service', () => ({
  fetchPinnedLetters: jest.fn(),
  setLetterPinStatus: jest.fn(),
}));

jest.mock('@src/services/editor/apiLettersRequest.service', () => ({
  fetchLetterData: jest.fn(),
}));

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

describe('LetterTabs', () => {
  it('keeps the active letter when its pinned entry is marked as changed', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(
      setEditorPinnedLetters({
        pinnedLetters: [
          {
            id: 1,
            name: 'fmb-1821-01-31-01',
            contentChanged: false,
            isPinned: true,
            viewMode: 'WYSIWYG',
          },
          {
            id: 2,
            name: 'gb-1842-01-04-01',
            contentChanged: false,
            isPinned: true,
            viewMode: 'WYSIWYG',
          },
        ],
      }),
    );
    store.dispatch(setEditorTabNumber({ tabNumber: 1 }));
    store.dispatch(
      setEditorLetter({
        letter: { id: 2, name: 'gb-1842-01-04-01', viewMode: 'WYSIWYG' },
      }),
    );

    render(
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <LetterTabs />
        </Provider>
      </ThemeProvider>,
    );

    await waitFor(() => expect(store.getState().editorLetter.letter.id).toBe(2));

    act(() => {
      store.dispatch(setEditorPinnedLetterContentChanged({ id: 2, contentChanged: true }));
    });

    await waitFor(() => {
      expect(store.getState().editorLetter.letter).toEqual(
        expect.objectContaining({ id: 2, name: 'gb-1842-01-04-01' }),
      );
    });
  });
});
