import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@src/i18n';
import i18n from '@src/i18n';
import PublishLetterDialog from '@src/components/editor/letter/Dialog/Components/PublishLetterDialog';
import editorLetterReducer, {
  setEditorLetter,
  setEditorPinnedLetters,
} from '@src/redux/slices/editor.letter.slice';
import { EditorUtils } from '@src/utils/editor';
import { LetterChangedSincePinnedError } from '@src/utils/editor/backendService';

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

describe('PublishLetterDialog conflict handling', () => {
  beforeAll(() => {
    void i18n.changeLanguage('de');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('closes the dialog after publishing successfully', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(setEditorLetter({ letter: { id: 7, name: 'FMB-7', viewMode: 'WYSIWYG' } }));
    jest.spyOn(EditorUtils.backendService, 'publishLetter').mockResolvedValue(true);
    const onClose = jest.fn();

    render(
      <Provider store={store}>
        <PublishLetterDialog
          xmlDoc={document.implementation.createDocument(null, 'root')}
          onSave={jest.fn()}
          onClose={onClose}
        />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Veröffentlichen' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(store.getState().editorLetter.reloadLetterContent).toBe(true);
  });

  it('confirms local changes and rebases using the active pinned-letter entry', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(setEditorLetter({ letter: { id: 7, name: 'FMB-7', viewMode: 'WYSIWYG' } }));
    store.dispatch(
      setEditorPinnedLetters({
        pinnedLetters: [
          {
            id: 7,
            name: 'FMB-7',
            contentChanged: true,
            isPinned: true,
            viewMode: 'WYSIWYG',
          },
        ],
      }),
    );
    jest
      .spyOn(EditorUtils.backendService, 'publishLetter')
      .mockRejectedValue(new LetterChangedSincePinnedError('Backend conflict'));
    const rebaseLetter = jest
      .spyOn(EditorUtils.backendService, 'rebaseLetter')
      .mockResolvedValue('<TEI />');
    const onClose = jest.fn();

    render(
      <Provider store={store}>
        <PublishLetterDialog
          xmlDoc={document.implementation.createDocument(null, 'root')}
          onSave={jest.fn()}
          onClose={onClose}
        />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Veröffentlichen' }));
    await screen.findByText(/Backend conflict/);

    fireEvent.click(screen.getByRole('button', { name: 'Neu laden' }));
    expect(rebaseLetter).not.toHaveBeenCalled();
    expect(screen.getByText(/alle lokalen Änderungen verworfen/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Neu laden' }));
    await waitFor(() => expect(rebaseLetter).toHaveBeenCalledWith(7));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(store.getState().editorLetter.reloadLetterContent).toBe(true);
    expect(store.getState().editorLetter.pinnedLetters[0].contentChanged).toBe(false);
  });
});
