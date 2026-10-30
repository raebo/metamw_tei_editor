import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import LetterTabs from '@src/components/editor/letter/Center/LetterTabs';
import editorLetterReducer, {
  setEditorLetter,
  setEditorPinnedLetterContentChanged,
  setEditorPinnedLetters,
  setEditorTabNumber,
  startContentUpdate,
} from '@src/redux/slices/editor.letter.slice';
import theme from '@src/utils/theme/theme';
import { setLetterPinStatus } from '@src/services/editor/apiPinnedLettersRequest.service';
import { EditorConstants } from '@src/constants/editor';

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      expect(store.getState().editorLetter.letter).toEqual(expect.objectContaining({ id: 2, name: 'gb-1842-01-04-01' }));
    });
  });

  it('warns before closing when unpublished changes were already autosaved', () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(
      setEditorPinnedLetters({
        pinnedLetters: [
          {
            id: 1,
            name: 'fmb-1821-01-31-01',
            contentChanged: true,
            isPinned: true,
            viewMode: 'WYSIWYG',
          },
        ],
      }),
    );

    render(
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <LetterTabs />
        </Provider>
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByTitle('Close tab'));

    expect(store.getState().editorLetter.dialogType).toBe(EditorConstants.dialogTypes.CLOSE_TAB_WITH_CONTENT);
    expect(setLetterPinStatus).not.toHaveBeenCalled();
  });

  it('closes an unchanged working letter without confirmation', async () => {
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
        ],
      }),
    );
    (setLetterPinStatus as jest.MockedFunction<typeof setLetterPinStatus>).mockResolvedValue();

    render(
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <LetterTabs />
        </Provider>
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByTitle('Close tab'));

    await waitFor(() => expect(setLetterPinStatus).toHaveBeenCalledWith(1, false));
    expect(store.getState().editorLetter.dialogType).toBeNull();
    expect(store.getState().editorLetter.pinnedLetters).toEqual([]);
  });

  it('does not start closing while a content update is pending', () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(
      setEditorPinnedLetters({
        pinnedLetters: [
          {
            id: 1,
            name: 'fmb-1821-01-31-01',
            contentChanged: true,
            isPinned: true,
            viewMode: 'WYSIWYG',
          },
        ],
      }),
    );
    store.dispatch(startContentUpdate());

    render(
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <LetterTabs />
        </Provider>
      </ThemeProvider>,
    );

    const closeButton = screen.getByTitle('Close tab');
    expect(closeButton).toBeDisabled();
    fireEvent.click(closeButton);
    expect(store.getState().editorLetter.dialogType).toBeNull();
  });
});
