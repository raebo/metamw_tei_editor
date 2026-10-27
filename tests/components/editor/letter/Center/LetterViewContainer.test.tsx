import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import '@src/i18n';
import LetterViewContainer from '@src/components/editor/letter/Center/LetterViewContainer';
import authReducer from '@src/redux/slices/authentication.slice';
import editorLetterReducer, { setEditorLetter, setEditorPinnedLetters } from '@src/redux/slices/editor.letter.slice';
import { fetchPinnedLetterData } from '@src/services/editor/apiPinnedLettersRequest.service';
import type { EditorLetterData } from '@src/services/mappings/editorMappings';
import { EditorUtils } from '@src/utils/editor';
import { EditorConstants } from '@src/constants/editor';

jest.mock('@src/services/editor/apiPinnedLettersRequest.service', () => ({
  fetchPinnedLetterData: jest.fn(),
}));

jest.mock('@src/services/editor/apiLettersRequest.service', () => ({
  fetchLetterData: jest.fn(),
}));

jest.mock('@src/components/editor/letter/Center/LetterViewContainer/XmlDisplayParser', () => ({
  __esModule: true,
  default: ({ xmlString }: { xmlString: string }) => {
    const content = new DOMParser().parseFromString(xmlString, 'application/xml').querySelector('p')?.textContent ?? '';
    return (
      <p
        contentEditable
        suppressContentEditableWarning
        data-testid="xml-output"
        data-editor-xml-path="0.0.0"
        data-editor-plain-paragraph="true"
      >
        {content}
      </p>
    );
  },
}));

jest.mock('@src/components/editor/letter/Center/LetterViewContainer/RightClickActionMenu', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@src/components/editor/letter/Center/LetterViewContainer/LeftClickAnnotationAction', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@src/components/editor/letter/Center/LetterViewCode', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@src/components/editor/letter/Center/StateInfo', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

const mockFetchPinnedLetterData = fetchPinnedLetterData as jest.MockedFunction<typeof fetchPinnedLetterData>;

const letterData = (id: number, name: string): EditorLetterData => ({
  id,
  name,
  title: name,
  xmlContent: `<TEI><text><body><p>${name}</p></body></text></TEI>`,
  undoAvailable: false,
  redoAvailable: false,
  capabilities: {
    rename: { allowed: true, reasonCode: null },
    discard: { allowed: true, reasonCode: null },
  },
  version: 'a'.repeat(64),
});

describe('LetterViewContainer', () => {
  it('shows a partially editable WYSIWYG surface while blocking mutations outside plain paragraphs', async () => {
    mockFetchPinnedLetterData.mockResolvedValue(letterData(1, 'fmb-1821-01-31-01'));
    const store = configureStore({
      reducer: { auth: authReducer, editorLetter: editorLetterReducer },
    });
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
    store.dispatch(
      setEditorLetter({
        letter: { id: 1, name: 'fmb-1821-01-31-01', viewMode: 'WYSIWYG' },
      }),
    );

    render(
      <Provider store={store}>
        <LetterViewContainer />
      </Provider>,
    );

    await screen.findByTestId('xml-output');
    const surface = document.getElementById('letterXmlContent')!;
    expect(surface).toHaveAttribute('contenteditable', 'true');
    expect(surface).toHaveAttribute('aria-readonly', 'false');
    expect(fireEvent.keyDown(surface, { key: 'x' })).toBe(false);
    expect(fireEvent.keyDown(surface, { key: 'Backspace' })).toBe(false);
    expect(fireEvent.keyDown(surface, { key: 'a', ctrlKey: true, altKey: true })).toBe(true);
    expect(fireEvent.paste(surface)).toBe(false);
    expect(fireEvent.drop(surface)).toBe(false);
  });

  it('persists typed and pasted plain-paragraph text on blur without serializing the rendered DOM', async () => {
    const data = letterData(1, 'Initial text');
    mockFetchPinnedLetterData.mockResolvedValue(data);
    const patchContent = jest.spyOn(EditorUtils.backendService, 'patchContent').mockResolvedValue(true);
    const store = configureStore({
      reducer: { auth: authReducer, editorLetter: editorLetterReducer },
    });
    store.dispatch(
      setEditorPinnedLetters({
        pinnedLetters: [
          {
            id: 1,
            name: data.name,
            contentChanged: false,
            isPinned: true,
            viewMode: 'WYSIWYG',
          },
        ],
      }),
    );
    store.dispatch(
      setEditorLetter({
        letter: { id: 1, name: data.name, viewMode: 'WYSIWYG', xmlContent: data.xmlContent },
      }),
    );

    render(
      <Provider store={store}>
        <LetterViewContainer />
      </Provider>,
    );

    const paragraph = await screen.findByTestId('xml-output');
    expect(fireEvent.keyDown(paragraph, { key: 'x' })).toBe(true);
    expect(fireEvent.keyDown(paragraph, { key: 'Enter' })).toBe(false);
    paragraph.textContent = 'Typed and ';
    fireEvent.input(paragraph);
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    range.collapse(false);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    expect(
      fireEvent.paste(paragraph, {
        clipboardData: { getData: () => 'pasted paragraph text' },
      }),
    ).toBe(false);
    expect(paragraph).toHaveTextContent('Typed and pasted paragraph text');
    fireEvent.blur(paragraph);

    await waitFor(() => expect(patchContent).toHaveBeenCalledTimes(1));
    const persistedXml = patchContent.mock.calls[0][0];
    const persistedDocument = new DOMParser().parseFromString(persistedXml, 'application/xml');
    expect(persistedDocument.querySelector('p')?.textContent).toBe('Typed and pasted paragraph text');
    expect(patchContent.mock.calls[0][2]).toBe(EditorConstants.changeTypes.MANUAL_CODE_CHANGE);
    patchContent.mockRestore();
  });

  it('ignores a stale response from the previously active letter', async () => {
    let resolveFirst!: (value: EditorLetterData) => void;
    let resolveSecond!: (value: EditorLetterData) => void;
    const firstRequest = new Promise<EditorLetterData>((resolve) => {
      resolveFirst = resolve;
    });
    const secondRequest = new Promise<EditorLetterData>((resolve) => {
      resolveSecond = resolve;
    });
    mockFetchPinnedLetterData.mockImplementation((letterId) => (letterId === 1 ? firstRequest : secondRequest));

    const store = configureStore({
      reducer: { auth: authReducer, editorLetter: editorLetterReducer },
    });
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
    store.dispatch(
      setEditorLetter({
        letter: { id: 1, name: 'fmb-1821-01-31-01', viewMode: 'WYSIWYG' },
      }),
    );

    render(
      <Provider store={store}>
        <LetterViewContainer />
      </Provider>,
    );

    act(() => {
      store.dispatch(
        setEditorLetter({
          letter: { id: 2, name: 'gb-1842-01-04-01', viewMode: 'WYSIWYG' },
        }),
      );
    });

    await act(async () => {
      resolveSecond(letterData(2, 'gb-1842-01-04-01'));
      await secondRequest;
    });
    expect(await screen.findByTestId('xml-output')).toHaveTextContent('gb-1842-01-04-01');

    await act(async () => {
      resolveFirst(letterData(1, 'fmb-1821-01-31-01'));
      await firstRequest;
    });
    await waitFor(() => {
      expect(screen.getByTestId('xml-output')).toHaveTextContent('gb-1842-01-04-01');
      expect(screen.getByTestId('xml-output')).not.toHaveTextContent('fmb-1821-01-31-01');
    });
  });
});
