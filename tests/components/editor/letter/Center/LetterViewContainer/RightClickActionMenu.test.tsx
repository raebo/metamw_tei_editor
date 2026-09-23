import React, { useLayoutEffect, useRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import '@src/i18n';
import RightClickActionMenu from '@src/components/editor/letter/Center/LetterViewContainer/RightClickActionMenu';
import editorLetterReducer, { setEditorLetter, setFigureUploadInProgress } from '@src/redux/slices/editor.letter.slice';
import type { LetterState } from '@src/constants/editor';

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

const sourceXml = '<TEI><text><body><div xml:id="act_1"><p xml:id="paragraph_1">Text</p></div></body></text></TEI>';

const ContextMenuHarness = () => {
  const xmlContentRef = useRef<HTMLDivElement>(null);
  const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!xmlContentRef.current) return;
    const tei = document.createElement('tei');
    const text = document.createElement('text');
    const body = document.createElement('body');
    const div = document.createElement('div');
    const paragraph = document.createElement('p');
    div.setAttribute('xml:id', 'act_1');
    paragraph.setAttribute('xml:id', 'paragraph_1');
    paragraph.textContent = 'Text';
    div.appendChild(paragraph);
    body.appendChild(div);
    text.appendChild(body);
    tei.appendChild(text);
    xmlContentRef.current.appendChild(tei);
  }, []);

  return (
    <>
      <div ref={xmlContentRef} />
      <RightClickActionMenu
        xmlContentRef={xmlContentRef}
        anchorPosition={anchorPosition}
        setAnchorPosition={setAnchorPosition}
        setLetterState={jest.fn<void, [LetterState]>()}
      />
    </>
  );
};

describe('RightClickActionMenu figure upload action', () => {
  it('opens the upload dialog for the nearest uniquely identified body element', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(
      setEditorLetter({
        letter: { id: 7, name: 'FMB-7', viewMode: 'WYSIWYG', xmlContent: sourceXml },
      }),
    );

    const { container } = render(
      <Provider store={store}>
        <ContextMenuHarness />
      </Provider>,
    );
    const paragraph = container.querySelector('p')!;

    fireEvent.contextMenu(paragraph, { button: 2, clientX: 20, clientY: 30 });
    fireEvent.click(await screen.findByRole('menuitem', { name: /Bild einfügen|Insert image/ }));

    expect(store.getState().editorLetter.dialogType).toBe('FIGURE_UPLOAD');
    expect(store.getState().editorLetter.letterReference.elementXmlId).toBe('paragraph_1');
  });

  it('does not offer another figure upload while one is running', () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(
      setEditorLetter({
        letter: { id: 7, name: 'FMB-7', viewMode: 'WYSIWYG', xmlContent: sourceXml },
      }),
    );
    store.dispatch(setFigureUploadInProgress(true));

    const { container } = render(
      <Provider store={store}>
        <ContextMenuHarness />
      </Provider>,
    );

    fireEvent.contextMenu(container.querySelector('p')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });

    expect(screen.queryByRole('menuitem', { name: /Bild einfügen|Insert image/ })).not.toBeInTheDocument();
  });
});
