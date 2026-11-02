import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@src/i18n';
import editorLetterReducer, { setEditorLetter, setEditorPinnedLetters } from '@src/redux/slices/editor.letter.slice';
import RenameLetterDialog from '@src/components/editor/letter/Dialog/Components/RenameLetterDialog';
import DiscardLetterDialog from '@src/components/editor/letter/Dialog/Components/DiscardLetterDialog';
import { fetchMetamwLetterData } from '@src/services/auto_anno/apiMetaMw.service';
import { discardLetter, renameLetter } from '@src/services/editor/apiLettersRequest.service';
import { refetchPinnedLetterAfterLifecycle } from '@src/services/editor/apiPinnedLettersRequest.service';
import type { EditorLetterData } from '@src/services/mappings/editorMappings';

const navigateMock = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

jest.mock('@src/services/auto_anno/apiMetaMw.service', () => ({
  fetchMetamwLetterData: jest.fn(),
}));

jest.mock('@src/services/editor/apiLettersRequest.service', () => ({
  ...jest.requireActual('@src/services/editor/apiLettersRequest.service'),
  renameLetter: jest.fn(),
  discardLetter: jest.fn(),
}));

jest.mock('@src/services/editor/apiPinnedLettersRequest.service', () => ({
  refetchPinnedLetterAfterLifecycle: jest.fn(),
}));

const mockFetchMetamwLetterData = fetchMetamwLetterData as jest.MockedFunction<typeof fetchMetamwLetterData>;
const mockRenameLetter = renameLetter as jest.MockedFunction<typeof renameLetter>;
const mockDiscardLetter = discardLetter as jest.MockedFunction<typeof discardLetter>;
const mockRefetchPinnedLetter = refetchPinnedLetterAfterLifecycle as jest.MockedFunction<typeof refetchPinnedLetterAfterLifecycle>;

const oldName = 'fmb-1840-06-06-01';
const newName = 'fmb-1840-06-06-02';
const version = 'a'.repeat(64);
const allowedCapabilities = {
  rename: { allowed: true, reasonCode: null },
  discard: { allowed: true, reasonCode: null },
} as const;

const letterData = (name: string): EditorLetterData => ({
  id: 17420,
  name,
  title: name,
  xmlContent: `<TEI xml:id="${name}"/>`,
  undoAvailable: true,
  redoAvailable: false,
  capabilities: allowedCapabilities,
  version,
});

const buildStore = () => {
  const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
  store.dispatch(
    setEditorPinnedLetters({
      pinnedLetters: [
        {
          id: 17420,
          name: oldName,
          contentChanged: true,
          isPinned: true,
          viewMode: 'WYSIWYG',
          capabilities: allowedCapabilities,
          version,
        },
      ],
    }),
  );
  store.dispatch(
    setEditorLetter({
      letter: {
        id: 17420,
        name: oldName,
        viewMode: 'WYSIWYG',
        capabilities: allowedCapabilities,
        version,
      },
    }),
  );
  return store;
};

const dialogProps = {
  xmlDoc: document.implementation.createDocument(null, 'TEI'),
  onSave: jest.fn(),
  onClose: jest.fn(),
};

describe('letter lifecycle dialogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renames only after availability and fresh-version checks, then applies pinned-show data', async () => {
    const store = buildStore();
    mockFetchMetamwLetterData.mockResolvedValue(null);
    mockRefetchPinnedLetter.mockResolvedValueOnce(letterData(oldName)).mockResolvedValueOnce(letterData(newName));
    mockRenameLetter.mockResolvedValue({
      id: 17420,
      name: newName,
      capabilities: allowedCapabilities,
      version,
    });

    render(
      <Provider store={store}>
        <RenameLetterDialog {...dialogProps} />
      </Provider>,
    );

    const input = screen.getByLabelText('New letter identifier');
    await userEvent.clear(input);
    await userEvent.type(input, newName);
    const renameButton = screen.getByRole('button', { name: 'Rename letter' });
    await act(async () => {
      await userEvent.click(renameButton);
    });

    await waitFor(() => expect(mockRenameLetter).toHaveBeenCalledWith(17420, newName, version));
    expect(store.getState().editorLetter.letter.name).toBe(newName);
    expect(store.getState().editorLetter.pinnedLetters[0].name).toBe(newName);
    expect(navigateMock).toHaveBeenCalledWith(`/editor/letters/17420/${newName}`, {
      replace: true,
    });
    expect(dialogProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('explains an invalid name while keeping the rename action disabled', async () => {
    const store = buildStore();

    render(
      <Provider store={store}>
        <RenameLetterDialog {...dialogProps} />
      </Provider>,
    );

    const input = screen.getByLabelText('New letter identifier');
    await userEvent.clear(input);
    await userEvent.type(input, 'invalid-name');

    expect(screen.getByText(/Use fmb-YYYY-MM-DD-NN or gb-YYYY-MM-DD-NN/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rename letter' })).toBeDisabled();
    expect(mockFetchMetamwLetterData).not.toHaveBeenCalled();
  });

  it('reports an already assigned name without changing the letter', async () => {
    const store = buildStore();
    mockFetchMetamwLetterData.mockResolvedValue({
      id: 42,
      name: newName,
      title: '',
      xml_content: '<TEI/>',
      capabilities: {
        rename: { allowed: true, reason_code: null },
        discard: { allowed: true, reason_code: null },
      },
      version,
    });

    render(
      <Provider store={store}>
        <RenameLetterDialog {...dialogProps} />
      </Provider>,
    );

    const input = screen.getByLabelText('New letter identifier');
    await userEvent.clear(input);
    await userEvent.type(input, newName);
    const renameButton = screen.getByRole('button', { name: 'Rename letter' });
    await act(async () => {
      await userEvent.click(renameButton);
    });

    expect(await screen.findByText('This letter identifier is already in use.')).toBeInTheDocument();
    await waitFor(() => expect(renameButton).toBeEnabled());
    expect(mockRenameLetter).not.toHaveBeenCalled();
    expect(store.getState().editorLetter.letter.name).toBe(oldName);
  });

  it('accepts changing the complete identifier including prefix and date', async () => {
    const store = buildStore();
    const completelyNewName = 'gb-1841-07-08-03';
    mockFetchMetamwLetterData.mockResolvedValue(null);
    mockRefetchPinnedLetter.mockResolvedValueOnce(letterData(oldName)).mockResolvedValueOnce(letterData(completelyNewName));
    mockRenameLetter.mockResolvedValue({
      id: 17420,
      name: completelyNewName,
      capabilities: allowedCapabilities,
      version,
    });

    render(
      <Provider store={store}>
        <RenameLetterDialog {...dialogProps} />
      </Provider>,
    );

    const input = screen.getByLabelText('New letter identifier');
    await userEvent.clear(input);
    await userEvent.type(input, completelyNewName);
    const renameButton = screen.getByRole('button', { name: 'Rename letter' });
    expect(renameButton).toBeEnabled();
    await userEvent.click(renameButton);

    await waitFor(() => expect(mockRenameLetter).toHaveBeenCalledWith(17420, completelyNewName, version));
  });

  it('requires the full current identifier before discarding and clears the active letter after success', async () => {
    const store = buildStore();
    mockRefetchPinnedLetter.mockResolvedValue(letterData(oldName));
    mockDiscardLetter.mockResolvedValue();

    render(
      <Provider store={store}>
        <DiscardLetterDialog {...dialogProps} />
      </Provider>,
    );

    const discardButton = screen.getByRole('button', { name: 'Discard letter' });
    expect(discardButton).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Full letter identifier for confirmation'), oldName);
    expect(discardButton).toBeEnabled();
    await userEvent.click(discardButton);

    await waitFor(() => expect(mockDiscardLetter).toHaveBeenCalledWith(17420, version));
    expect(store.getState().editorLetter.pinnedLetters).toEqual([]);
    expect(store.getState().editorLetter.letter.id).toBeNull();
    expect(navigateMock).toHaveBeenCalledWith('/editor/', { replace: true });
    expect(dialogProps.onClose).toHaveBeenCalledTimes(1);
  });
});
