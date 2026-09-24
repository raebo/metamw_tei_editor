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

const sourceXml =
  '<TEI><text><body><div xml:id="act_1"><p xml:id="paragraph_1">Text</p><list type="ordered"><item>First</item></list><table rows="1" cols="1"><row><cell>A</cell></row></table><figure xml:id="figure_1"><graphic url="file:/images/test.png"/></figure></div></body></text></TEI>';

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
    const list = document.createElement('list');
    const item = document.createElement('item');
    const tableCaret = document.createElement('span');
    const table = document.createElement('table');
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    const figure = document.createElement('figure');
    div.setAttribute('xml:id', 'act_1');
    div.dataset.editorXmlPath = '0.0.0';
    paragraph.setAttribute('xml:id', 'paragraph_1');
    paragraph.dataset.editorXmlPath = '0.0.0.0';
    paragraph.textContent = 'Text';
    list.dataset.editorXmlPath = '0.0.0.1';
    item.dataset.editorXmlPath = '0.0.0.1.0';
    item.textContent = 'First';
    list.appendChild(item);
    tableCaret.dataset.editorTableCaret = 'true';
    tableCaret.dataset.editorXmlPath = '0.0.0.2';
    tableCaret.textContent = '▶';
    table.dataset.editorXmlPath = '0.0.0.2';
    row.dataset.editorXmlPath = '0.0.0.2.0';
    row.dataset.editorTeiElement = 'row';
    cell.dataset.editorXmlPath = '0.0.0.2.0.0';
    cell.dataset.editorTeiElement = 'cell';
    cell.textContent = 'A';
    figure.dataset.editorXmlPath = '0.0.0.3';
    figure.setAttribute('xml:id', 'figure_1');
    figure.textContent = 'Figure';
    row.appendChild(cell);
    table.appendChild(row);
    div.append(paragraph, list, tableCaret, table, figure);
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
  it('opens foreign-hand annotation creation from a collapsed text caret', async () => {
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
    const range = document.createRange();
    range.setStart(paragraph.firstChild!, 2);
    range.collapse(true);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    fireEvent.contextMenu(paragraph, { button: 2, clientX: 20, clientY: 30 });
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: /Anmerkung fremder Hand|foreign-hand annotation/,
      }),
    );

    expect(store.getState().editorLetter.dialogType).toBe('FOREIGN_HAND_ANNOTATION');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'p',
      elementXmlId: '0.0.0.0',
      elementKey: 'caret:0:2',
    });
  });

  it('opens foreign-hand annotation editing from its separate numbered anchor', async () => {
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
    const marker = document.createElement('span');
    marker.dataset.editorForeignAnnotationId = 'note_1';
    marker.textContent = '1';
    container.firstElementChild?.appendChild(marker);

    fireEvent.contextMenu(marker, { button: 2, clientX: 20, clientY: 30 });
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: /Anmerkung fremder Hand bearbeiten|Edit foreign-hand annotation/,
      }),
    );

    expect(store.getState().editorLetter.dialogType).toBe('FOREIGN_HAND_ANNOTATION');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'note',
      elementXmlId: 'note_1',
      elementKey: 'edit',
    });
  });

  it('opens the explicit block graphic dialog from the paragraph context menu', async () => {
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

    fireEvent.contextMenu(container.querySelector('p')!, { button: 2, clientX: 20, clientY: 30 });
    fireEvent.click(await screen.findByRole('menuitem', { name: /Grafische Elemente|Graphic elements/ }));
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: /Grafisches Element danach|Insert graphic element after/,
      }),
    );

    expect(store.getState().editorLetter.dialogType).toBe('GRAPHIC_STRUCTURE');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'p',
      elementXmlId: '0.0.0.0',
      elementKey: 'graphic-block',
    });
  });

  it('opens image-map editing for an existing figure', async () => {
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

    fireEvent.contextMenu(container.querySelector('figure')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    fireEvent.click(await screen.findByRole('menuitem', { name: /Grafische Elemente|Graphic elements/ }));
    fireEvent.click(await screen.findByRole('menuitem', { name: /Bildkarte bearbeiten|Edit image map/ }));

    expect(store.getState().editorLetter.dialogType).toBe('GRAPHIC_STRUCTURE');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'figure',
      elementXmlId: '0.0.0.3',
      elementKey: 'image-map-edit',
    });
  });

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

  it('opens the paragraph structure dialog with the source path and requested operation', async () => {
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

    fireEvent.contextMenu(container.querySelector('p')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: /Absätze und Abschnitte|Paragraphs and sections/,
      }),
    );
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: /Absatz danach einfügen|Insert paragraph after/,
      }),
    );

    const state = store.getState().editorLetter;
    expect(state.dialogType).toBe('PARAGRAPH_STRUCTURE');
    expect(state.letterReference).toEqual({
      elementType: 'p',
      elementXmlId: '0.0.0.0',
      elementKey: 'paragraph-insert',
    });
  });

  it('opens the list structure dialog for an existing list item', async () => {
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

    fireEvent.contextMenu(container.querySelector('item')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    fireEvent.click(await screen.findByRole('menuitem', { name: /Listen|Lists/ }));
    expect(await screen.findByRole('menuitem', { name: /Listeneintrag bearbeiten|Edit list item/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Listeneintrag löschen|Delete list item/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /^(Liste löschen|Delete list) …$/ })).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('menuitem', { name: /Listeneintrag hinzufügen|Add list item/ }));

    const state = store.getState().editorLetter;
    expect(state.dialogType).toBe('LIST_STRUCTURE');
    expect(state.letterReference).toEqual({
      elementType: 'item',
      elementXmlId: '0.0.0.1.0',
      elementKey: 'list-add-item',
    });
  });

  it('offers creating an empty ordered list after a paragraph', async () => {
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

    fireEvent.contextMenu(container.querySelector('p')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    fireEvent.click(await screen.findByRole('menuitem', { name: /Listen|Lists/ }));
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: /Leere nummerierte Liste|Insert empty ordered list/,
      }),
    );

    const state = store.getState().editorLetter;
    expect(state.dialogType).toBe('LIST_STRUCTURE');
    expect(state.letterReference).toEqual({
      elementType: 'p',
      elementXmlId: '0.0.0.0',
      elementKey: 'list-empty-ordered',
    });
  });

  it('opens grouped table actions from a keyboard-focused cell and keeps its XML path', async () => {
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
    const cell = container.querySelector('td')!;
    cell.focus();
    fireEvent.contextMenu(cell, { button: 0, detail: 0, clientX: 20, clientY: 30 });
    fireEvent.click(await screen.findByRole('menuitem', { name: /Tabellen|Tables/ }));
    const cellGroup = await screen.findByRole('menuitem', { name: /Zelle|Cell/ });
    expect(screen.getByRole('menuitem', { name: /Spalte|Column/ })).toBeInTheDocument();

    fireEvent.click(cellGroup);
    expect(await screen.findByRole('menuitem', { name: /Zellinhalt bearbeiten|Edit cell content/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: /Zeile|Row/ }));
    expect(screen.queryByRole('menuitem', { name: /Zellinhalt bearbeiten|Edit cell content/ })).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole('menuitem', { name: /Zeile unterhalb|Insert row below/ }));

    expect(store.getState().editorLetter.dialogType).toBe('TABLE_STRUCTURE');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'row',
      elementXmlId: '0.0.0.2.0',
      elementKey: 'table-row-below',
    });
  });

  it('opens table actions from the caret of an otherwise hard-to-select table', async () => {
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
    fireEvent.contextMenu(container.querySelector('[data-editor-table-caret]')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    fireEvent.click(await screen.findByRole('menuitem', { name: /Tabellen|Tables/ }));
    fireEvent.click(await screen.findByRole('menuitem', { name: /^(Tabelle|Table) ▶$/ }));
    expect(await screen.findByRole('menuitem', { name: /Tabelle löschen|Delete table/ })).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('menuitem', { name: /Tabelle sortieren|Sort table/ }));

    expect(store.getState().editorLetter.dialogType).toBe('TABLE_STRUCTURE');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'table',
      elementXmlId: '0.0.0.2',
      elementKey: 'table-sort',
    });
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
