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
  setFigureUploadInProgress,
} from '@src/redux/slices/editor.letter.slice';
import { EditorUtils } from '@src/utils/editor';
import { InvalidRevisionStatusError, LetterChangedSincePinnedError, LetterIndexPendingError } from '@src/utils/editor/backendService';
import { fetchPinnedLetterData } from '@src/services/editor/apiPinnedLettersRequest.service';
import { enqueueSnackbar } from 'notistack';

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));
jest.mock('@src/services/editor/apiPinnedLettersRequest.service', () => ({
  fetchPinnedLetterData: jest.fn(),
}));

const mockFetchPinnedLetterData = fetchPinnedLetterData as jest.MockedFunction<typeof fetchPinnedLetterData>;

const publishedLetter = {
  id: 7,
  name: 'FMB-7',
  title: '',
  xmlContent: '<TEI><teiHeader><revisionDesc status="live"/></teiHeader></TEI>',
  undoAvailable: false,
  redoAvailable: false,
  capabilities: {
    rename: { allowed: false, reasonCode: 'letter_already_published' as const },
    discard: { allowed: false, reasonCode: 'letter_already_published' as const },
  },
  version: 'a'.repeat(64),
};

describe('PublishLetterDialog conflict handling', () => {
  beforeAll(() => {
    void i18n.changeLanguage('de');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchPinnedLetterData.mockResolvedValue(publishedLetter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('publishes live and directly adopts the refreshed pinned working copy', async () => {
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
    const publishLetter = jest.spyOn(EditorUtils.backendService, 'publishLetter').mockResolvedValue(true);
    const onClose = jest.fn();
    const xmlDoc = new DOMParser().parseFromString('<TEI><teiHeader><revisionDesc status="draft"/></teiHeader></TEI>', 'application/xml');

    render(
      <Provider store={store}>
        <PublishLetterDialog xmlDoc={xmlDoc} onSave={jest.fn()} onClose={onClose} />
      </Provider>,
    );

    expect(screen.getByText('Aktueller Status:')).toBeInTheDocument();
    const currentStatus = screen.getByText('Draft', { selector: 'strong' });
    expect(currentStatus).toHaveStyle({ fontSize: '1.25rem', fontWeight: 700 });
    expect(
      screen.getByText(
        '„Live“ veröffentlicht den Brief auf der Webseite. „Draft“ entfernt einen bereits veröffentlichten Brief wieder von der Webseite.',
      ),
    ).toBeInTheDocument();
    const draftButton = screen.getByRole('button', { name: 'Draft' });
    const liveButton = screen.getByRole('button', { name: 'Live' });
    const cancelButton = screen.getByRole('button', { name: 'Abbrechen' });
    expect(draftButton).toHaveClass('MuiButton-sizeLarge');
    expect(liveButton).toHaveClass('MuiButton-sizeLarge');
    expect(draftButton.parentElement).toBe(liveButton.parentElement);
    expect(cancelButton.closest('.MuiDialogActions-root')).toBeInTheDocument();
    expect(liveButton.closest('.MuiDialogActions-root')).not.toBeInTheDocument();
    fireEvent.click(liveButton);

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(publishLetter).toHaveBeenCalledWith(7, 'live');
    expect(mockFetchPinnedLetterData).toHaveBeenCalledWith(7);
    expect(store.getState().editorLetter.letter.xmlContent).toBe(publishedLetter.xmlContent);
    expect(store.getState().editorLetter.reloadLetterContent).toBe(false);
    expect(store.getState().editorLetter.pinnedLetters[0].contentChanged).toBe(false);
  });

  it('sends draft explicitly even when the current XML status is live', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(setEditorLetter({ letter: { id: 7, name: 'FMB-7', viewMode: 'WYSIWYG' } }));
    const publishLetter = jest.spyOn(EditorUtils.backendService, 'publishLetter').mockResolvedValue(true);
    const xmlDoc = new DOMParser().parseFromString('<TEI><teiHeader><revisionDesc status="live"/></teiHeader></TEI>', 'application/xml');

    render(
      <Provider store={store}>
        <PublishLetterDialog xmlDoc={xmlDoc} onSave={jest.fn()} onClose={jest.fn()} />
      </Provider>,
    );

    expect(screen.getByText('Aktueller Status:')).toBeInTheDocument();
    expect(screen.getByText('Live', { selector: 'strong' })).toHaveStyle({
      fontSize: '1.25rem',
      fontWeight: 700,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Draft' }));

    await waitFor(() => expect(publishLetter).toHaveBeenCalledWith(7, 'draft'));
  });

  it('reloads the committed letter and warns when index synchronization is pending', async () => {
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
    const publishLetter = jest.spyOn(EditorUtils.backendService, 'publishLetter').mockRejectedValue(new LetterIndexPendingError());
    const onClose = jest.fn();

    render(
      <Provider store={store}>
        <PublishLetterDialog xmlDoc={document.implementation.createDocument(null, 'root')} onSave={jest.fn()} onClose={onClose} />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Live' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(publishLetter).toHaveBeenCalledTimes(1);
    expect(mockFetchPinnedLetterData).toHaveBeenCalledWith(7);
    expect(store.getState().editorLetter.letter.xmlContent).toBe(publishedLetter.xmlContent);
    expect(store.getState().editorLetter.pinnedLetters[0].contentChanged).toBe(false);
    expect(enqueueSnackbar).toHaveBeenCalledTimes(1);
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      'Brief gespeichert, Indexabgleich ausstehend. Der öffentliche Zugriff bleibt bis zum Abschluss gesperrt. Bitte veröffentlichen Sie den Brief nicht erneut.',
      { variant: 'warning' },
    );
  });

  it('blocks editing when the required reload after a pending index response fails', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(setEditorLetter({ letter: { id: 7, name: 'FMB-7', viewMode: 'WYSIWYG' } }));
    const publishLetter = jest.spyOn(EditorUtils.backendService, 'publishLetter').mockRejectedValue(new LetterIndexPendingError());
    const rebaseLetter = jest.spyOn(EditorUtils.backendService, 'rebaseLetter');
    mockFetchPinnedLetterData.mockRejectedValueOnce(new Error('reload failed'));
    const onClose = jest.fn();

    render(
      <Provider store={store}>
        <PublishLetterDialog xmlDoc={document.implementation.createDocument(null, 'root')} onSave={jest.fn()} onClose={onClose} />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Draft' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(publishLetter).toHaveBeenCalledTimes(1);
    expect(rebaseLetter).not.toHaveBeenCalled();
    expect(store.getState().editorLetter.reloadLetterContent).toBe(true);
    expect(enqueueSnackbar).toHaveBeenCalledTimes(1);
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      'Der Status wurde gespeichert, aber die aktualisierte Arbeitskopie konnte nicht geladen werden: reload failed',
      { variant: 'warning' },
    );
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
    jest.spyOn(EditorUtils.backendService, 'publishLetter').mockRejectedValue(new LetterChangedSincePinnedError('Backend conflict'));
    const rebaseLetter = jest.spyOn(EditorUtils.backendService, 'rebaseLetter').mockResolvedValue('<TEI />');
    const onClose = jest.fn();

    render(
      <Provider store={store}>
        <PublishLetterDialog xmlDoc={document.implementation.createDocument(null, 'root')} onSave={jest.fn()} onClose={onClose} />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Draft' }));
    await screen.findByText(/Backend conflict/);

    fireEvent.click(screen.getByRole('button', { name: 'Neu laden' }));
    expect(rebaseLetter).not.toHaveBeenCalled();
    expect(screen.getByText(/unpublizierter Bild-Uploads verworfen/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Neu laden' }));
    await waitFor(() => expect(rebaseLetter).toHaveBeenCalledWith(7));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(store.getState().editorLetter.reloadLetterContent).toBe(true);
    expect(store.getState().editorLetter.pinnedLetters[0].contentChanged).toBe(false);
  });

  it('disables publishing while a figure upload is running', () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(setEditorLetter({ letter: { id: 7, name: 'FMB-7', viewMode: 'WYSIWYG' } }));
    store.dispatch(setFigureUploadInProgress(true));

    render(
      <Provider store={store}>
        <PublishLetterDialog xmlDoc={document.implementation.createDocument(null, 'root')} onSave={jest.fn()} onClose={jest.fn()} />
      </Provider>,
    );

    expect(screen.getByRole('button', { name: 'Draft' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Live' })).toBeDisabled();
  });

  it('explains an invalid revision status returned by the backend', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(setEditorLetter({ letter: { id: 7, name: 'FMB-7', viewMode: 'WYSIWYG' } }));
    jest.spyOn(EditorUtils.backendService, 'publishLetter').mockRejectedValue(new InvalidRevisionStatusError());

    render(
      <Provider store={store}>
        <PublishLetterDialog xmlDoc={document.implementation.createDocument(null, 'root')} onSave={jest.fn()} onClose={jest.fn()} />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Live' }));

    expect(await screen.findByText('Der gewählte Zielstatus ist ungültig. Bitte wählen Sie Draft oder Live.')).toBeInTheDocument();
  });
});
