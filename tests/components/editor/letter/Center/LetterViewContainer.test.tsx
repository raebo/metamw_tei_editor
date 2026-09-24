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

jest.mock('@src/services/editor/apiPinnedLettersRequest.service', () => ({
  fetchPinnedLetterData: jest.fn(),
}));

jest.mock('@src/services/editor/apiLettersRequest.service', () => ({
  fetchLetterData: jest.fn(),
}));

jest.mock('@src/components/editor/letter/Center/LetterViewContainer/XmlDisplayParser', () => ({
  __esModule: true,
  default: ({ xmlString }: { xmlString: string }) => <div data-testid="xml-output">{xmlString}</div>,
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
});

describe('LetterViewContainer', () => {
  it('shows a caret-capable WYSIWYG surface while blocking direct mutations', async () => {
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
    expect(surface).toHaveAttribute('aria-readonly', 'true');
    expect(fireEvent.keyDown(surface, { key: 'x' })).toBe(false);
    expect(fireEvent.keyDown(surface, { key: 'Backspace' })).toBe(false);
    expect(fireEvent.keyDown(surface, { key: 'a', ctrlKey: true, altKey: true })).toBe(true);
    expect(fireEvent.paste(surface)).toBe(false);
    expect(fireEvent.drop(surface)).toBe(false);
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
