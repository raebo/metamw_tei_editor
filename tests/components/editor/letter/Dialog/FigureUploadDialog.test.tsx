import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import '@src/i18n';
import i18n from '@src/i18n';
import FigureUploadDialog from '@src/components/editor/letter/Dialog/Components/FigureUploadDialog';
import editorLetterReducer, { setEditorLetter, setEditorPinnedLetters, setLetterReference } from '@src/redux/slices/editor.letter.slice';
import { uploadFigure } from '@src/services/editor/apiFigureRequest.service';

jest.mock('@src/services/editor/apiFigureRequest.service', () => ({
  uploadFigure: jest.fn(),
}));
jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

const mockUploadFigure = uploadFigure as jest.MockedFunction<typeof uploadFigure>;

const buildStore = () => {
  const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
  store.dispatch(
    setEditorLetter({
      letter: { id: 7, name: 'FMB-7', viewMode: 'WYSIWYG', xmlContent: '<TEI />' },
    }),
  );
  store.dispatch(
    setEditorPinnedLetters({
      pinnedLetters: [
        {
          id: 7,
          name: 'FMB-7',
          contentChanged: false,
          isPinned: true,
          viewMode: 'WYSIWYG',
        },
      ],
    }),
  );
  store.dispatch(
    setLetterReference({
      letterReference: { elementType: 'p', elementXmlId: 'paragraph_1', elementKey: null },
    }),
  );
  return store;
};

describe('FigureUploadDialog', () => {
  beforeAll(() => {
    void i18n.changeLanguage('de');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('replaces the editor state with the upload response and marks the letter as changed', async () => {
    mockUploadFigure.mockResolvedValue({
      letter_id: '7',
      figure_xml_id: 'figure_1',
      filename: 'letter-Z-001.png',
      content_type: 'image/png',
      graphic_url: 'file:/images/letter-Z-001.png',
      preview_url: '/jwt/editor/pinned_letters/7/figures/figure_1/image',
      xml_content: '<TEI><text><body><figure xml:id="figure_1" /></body></text></TEI>',
      undo_available: true,
      redo_available: false,
    });
    const store = buildStore();
    const onClose = jest.fn();
    const { container } = render(
      <Provider store={store}>
        <FigureUploadDialog xmlDoc={document.implementation.createDocument(null, 'root')} onSave={jest.fn()} onClose={onClose} />
      </Provider>,
    );
    const image = new File(['image'], 'drawing.png', { type: 'image/png' });
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [image] },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Bild hochladen' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(mockUploadFigure).toHaveBeenCalledWith(7, expect.objectContaining({ image, anchorXmlId: 'paragraph_1' }));
    const state = store.getState().editorLetter;
    expect(state.letter.xmlContent).toContain('figure_1');
    expect(state.letter.undoAvailable).toBe(true);
    expect(state.pinnedLetters[0].contentChanged).toBe(true);
    expect(state.focusedFigureXmlId).toBe('figure_1');
    expect(state.figureUploadInProgress).toBe(false);
  });

  it('keeps the form open and rejects unsupported files before sending a request', () => {
    const store = buildStore();
    const onClose = jest.fn();
    const { container } = render(
      <Provider store={store}>
        <FigureUploadDialog xmlDoc={document.implementation.createDocument(null, 'root')} onSave={jest.fn()} onClose={onClose} />
      </Provider>,
    );
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [new File(['svg'], 'image.svg', { type: 'image/svg+xml' })] },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Bild hochladen' }));

    expect(screen.getByText(/JPEG- oder PNG-Datei/)).toBeInTheDocument();
    expect(mockUploadFigure).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
