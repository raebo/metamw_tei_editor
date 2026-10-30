import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@src/i18n';
import CloseTabWithContent from '@src/components/editor/letter/Dialog/Components/CloseTabWithContentDialog';
import editorLetterReducer, { setEditorPinnedLetters, setTabToCloseId } from '@src/redux/slices/editor.letter.slice';
import { setLetterPinStatus } from '@src/services/editor/apiPinnedLettersRequest.service';
import { enqueueSnackbar } from 'notistack';

jest.mock('@src/services/editor/apiPinnedLettersRequest.service', () => ({
  setLetterPinStatus: jest.fn(),
}));

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

const mockSetLetterPinStatus = setLetterPinStatus as jest.MockedFunction<typeof setLetterPinStatus>;
const mockEnqueueSnackbar = enqueueSnackbar as jest.MockedFunction<typeof enqueueSnackbar>;

const buildStore = () => {
  const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
  store.dispatch(
    setEditorPinnedLetters({
      pinnedLetters: [
        {
          id: 17420,
          name: 'fmb-1840-06-06-01',
          contentChanged: false,
          isPinned: true,
          viewMode: 'WYSIWYG',
          capabilities: null,
          version: null,
        },
      ],
    }),
  );
  store.dispatch(setTabToCloseId({ tabToCloseId: 17420 }));
  return store;
};

const dialogProps = {
  xmlDoc: document.implementation.createDocument(null, 'TEI'),
  onSave: jest.fn(),
  onClose: jest.fn(),
};

describe('CloseTabWithContentDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cancels without a request or local cleanup', async () => {
    const store = buildStore();

    render(
      <Provider store={store}>
        <CloseTabWithContent {...dialogProps} />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockSetLetterPinStatus).not.toHaveBeenCalled();
    expect(store.getState().editorLetter.pinnedLetters).toHaveLength(1);
    expect(dialogProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('removes the tab only after pinned=false has been confirmed', async () => {
    const store = buildStore();
    mockSetLetterPinStatus.mockResolvedValue();

    render(
      <Provider store={store}>
        <CloseTabWithContent {...dialogProps} />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Discard changes and close' }));

    await waitFor(() => expect(mockSetLetterPinStatus).toHaveBeenCalledWith(17420, false));
    expect(store.getState().editorLetter.pinnedLetters).toEqual([]);
    expect(dialogProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog and tab when the close request fails', async () => {
    const store = buildStore();
    mockSetLetterPinStatus.mockRejectedValue(new Error('Conflict'));

    render(
      <Provider store={store}>
        <CloseTabWithContent {...dialogProps} />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Discard changes and close' }));

    await waitFor(() => expect(mockEnqueueSnackbar).toHaveBeenCalled());
    expect(store.getState().editorLetter.pinnedLetters).toHaveLength(1);
    expect(dialogProps.onClose).not.toHaveBeenCalled();
  });

  it('sends only one close request when confirmation is triggered repeatedly', async () => {
    const store = buildStore();
    let resolveRequest: (() => void) | undefined;
    mockSetLetterPinStatus.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRequest = resolve;
        }),
    );

    render(
      <Provider store={store}>
        <CloseTabWithContent {...dialogProps} />
      </Provider>,
    );

    const confirmButton = screen.getByRole('button', { name: 'Discard changes and close' });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    expect(mockSetLetterPinStatus).toHaveBeenCalledTimes(1);
    await act(async () => resolveRequest?.());
    await waitFor(() => expect(dialogProps.onClose).toHaveBeenCalledTimes(1));
  });
});
