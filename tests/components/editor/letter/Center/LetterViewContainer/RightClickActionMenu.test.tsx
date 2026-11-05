import React, { useLayoutEffect, useRef, useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import '@src/i18n';
import RightClickActionMenu from '@src/components/editor/letter/Center/LetterViewContainer/RightClickActionMenu';
import editorLetterReducer, {
  setContentTextIsMarked,
  setEditorLetter,
  setFigureUploadInProgress,
} from '@src/redux/slices/editor.letter.slice';
import type { LetterState } from '@src/constants/editor';
import { enqueueSnackbar } from 'notistack';
import { EditorUtils } from '@src/utils/editor';

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

const sourceXml =
  '<TEI><text><body><div xml:id="act_1" type="act_of_writing" n="1"><p xml:id="paragraph_1">Text</p><list type="ordered"><item>First</item></list><table rows="1" cols="1"><row><cell>A</cell></row></table><figure xml:id="figure_1"><graphic url="file:/images/test.png"/></figure><div1><head>Heading</head><p>Section text</p></div1><p><persName xml:id="person_1">Felix</persName></p></div><div xml:id="act_2" type="act_of_writing" n="2"><p>Second act</p></div></body></text></TEI>';

const ContextMenuHarness = () => {
  const xmlContentRef = useRef<HTMLDivElement>(null);
  const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!xmlContentRef.current) return;
    const tei = document.createElement('tei');
    const text = document.createElement('text');
    const body = document.createElement('body');
    const div = document.createElement('div');
    const secondDiv = document.createElement('div');
    const paragraph = document.createElement('p');
    const list = document.createElement('list');
    const item = document.createElement('item');
    const tableCaret = document.createElement('span');
    const table = document.createElement('table');
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    const figure = document.createElement('figure');
    const section = document.createElement('div1');
    const sectionHead = document.createElement('head');
    const sectionParagraph = document.createElement('p');
    const annotationParagraph = document.createElement('p');
    const personAnnotation = document.createElement('persName');
    const manuscriptCaret = document.createElement('button');
    const manuscriptAnnotation = document.createElement('p');
    const footnoteReference = document.createElement('ref');
    const footnote = document.createElement('note');
    const crossReference = document.createElement('span');
    const foreignText = document.createElement('foreign');
    const abbreviation = document.createElement('choice');
    const horizontalFraction = document.createElement('formula');
    const verticalSlashFraction = document.createElement('formula');
    const verticalNoSlashFraction = document.createElement('formula');
    const superscript = document.createElement('hi');
    const subscript = document.createElement('hi');
    const groundline = document.createElement('hi');
    const latintype = document.createElement('hi');
    const antiqua = document.createElement('hi');
    const gothic = document.createElement('hi');
    div.setAttribute('xml:id', 'act_1');
    div.setAttribute('type', 'act_of_writing');
    div.setAttribute('n', '1');
    secondDiv.setAttribute('xml:id', 'act_2');
    secondDiv.setAttribute('type', 'act_of_writing');
    secondDiv.setAttribute('n', '2');
    secondDiv.dataset.editorXmlPath = '0.0.1';
    secondDiv.textContent = 'Second act';
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
    section.dataset.editorXmlPath = '0.0.0.4';
    sectionHead.dataset.editorXmlPath = '0.0.0.4.0';
    sectionHead.textContent = 'Heading';
    sectionParagraph.dataset.editorXmlPath = '0.0.0.4.1';
    sectionParagraph.textContent = 'Section text';
    section.append(sectionHead, sectionParagraph);
    annotationParagraph.dataset.editorXmlPath = '0.0.0.5';
    personAnnotation.dataset.editorXmlPath = '0.0.0.5.0';
    personAnnotation.setAttribute('xml:id', 'person_1');
    personAnnotation.textContent = 'Felix';
    annotationParagraph.appendChild(personAnnotation);
    manuscriptCaret.dataset.editorManuscriptAnnotationReference = 'script_annotation_1';
    manuscriptCaret.textContent = '▶';
    manuscriptAnnotation.className = 'tei-manuscript-annotation';
    manuscriptAnnotation.dataset.editorXmlPath = '1.0.0.0.0.0.0';
    manuscriptAnnotation.setAttribute('xml:id', 'script_annotation_1');
    manuscriptAnnotation.textContent = 'Paper and ink';
    footnoteReference.dataset.editorAuthorFootnoteId = 'fn_1';
    footnoteReference.textContent = '1';
    footnote.dataset.editorAuthorFootnoteId = 'fn_1';
    footnote.textContent = 'Author note';
    crossReference.dataset.editorCrossReferenceId = 'link_1';
    crossReference.textContent = '↗ #target';
    foreignText.dataset.editorForeignTextReference = 'foreign_1';
    foreignText.textContent = 'bonjour';
    abbreviation.dataset.editorAbbreviationReference = 'choice_1';
    abbreviation.textContent = 'Ch';
    horizontalFraction.dataset.editorHorizontalFractionReference = 'formula_1';
    horizontalFraction.dataset.editorFractionReference = 'formula_1';
    horizontalFraction.dataset.editorFractionVariant = 'horizontal';
    horizontalFraction.textContent = '½';
    verticalSlashFraction.dataset.editorFractionReference = 'formula_2';
    verticalSlashFraction.dataset.editorFractionVariant = 'vertical-slash';
    verticalSlashFraction.textContent = '¾';
    verticalNoSlashFraction.dataset.editorFractionReference = 'formula_3';
    verticalNoSlashFraction.dataset.editorFractionVariant = 'vertical-noslash';
    verticalNoSlashFraction.textContent = '⅝';
    superscript.dataset.editorInlineFormatReference = 'super_1';
    superscript.dataset.editorInlineFormat = 'superscript';
    superscript.textContent = '1st';
    subscript.dataset.editorInlineFormatReference = 'sub_1';
    subscript.dataset.editorInlineFormat = 'subscript';
    subscript.textContent = '2';
    groundline.dataset.editorInlineFormatReference = 'ground_1';
    groundline.dataset.editorInlineFormat = 'groundline';
    groundline.textContent = 'underlined';
    latintype.dataset.editorInlineFormatReference = 'latin_1';
    latintype.dataset.editorInlineFormat = 'latintype';
    latintype.textContent = 'Amicus';
    antiqua.dataset.editorInlineFormatReference = 'antiqua_1';
    antiqua.dataset.editorInlineFormat = 'antiqua';
    antiqua.textContent = 'Leipziger';
    gothic.dataset.editorInlineFormatReference = 'gothic_1';
    gothic.dataset.editorInlineFormat = 'gothic';
    gothic.textContent = 'Zeitung';
    row.appendChild(cell);
    table.appendChild(row);
    div.append(paragraph, list, tableCaret, table, figure, section, annotationParagraph);
    body.append(div, secondDiv);
    text.appendChild(body);
    tei.appendChild(text);
    xmlContentRef.current.append(
      tei,
      manuscriptCaret,
      manuscriptAnnotation,
      footnoteReference,
      footnote,
      crossReference,
      foreignText,
      abbreviation,
      horizontalFraction,
      verticalSlashFraction,
      verticalNoSlashFraction,
      superscript,
      subscript,
      groundline,
      latintype,
      antiqua,
      gothic,
    );
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

const openWritingActMenuGroup = async (name: RegExp) => {
  fireEvent.click(await screen.findByRole('menuitem', { name }));
};

const openWritingActContentGroup = async (name: RegExp) => {
  fireEvent.click(await screen.findByRole('menuitem', { name }));
};

describe('RightClickActionMenu figure upload action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
  });
  afterEach(() => jest.restoreAllMocks());

  it('opens the TEI P5 documentation for the selected source element securely', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(
      setEditorLetter({
        letter: { id: 7, name: 'FMB-7', viewMode: 'WYSIWYG', xmlContent: sourceXml },
      }),
    );
    const openWindow = jest.spyOn(window, 'open').mockImplementation(() => null);
    const { container } = render(
      <Provider store={store}>
        <ContextMenuHarness />
      </Provider>,
    );

    fireEvent.contextMenu(container.querySelector('td')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: /TEI-P5-Dokumentation: <cell>|TEI P5 documentation: <cell>/,
      }),
    );

    expect(openWindow).toHaveBeenCalledWith(
      'https://www.tei-c.org/release/doc/tei-p5-doc/en/html/ref-cell.html',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('explains when the selected XML element is not supported by TEI P5', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    const unsupportedXml =
      '<TEI xmlns="http://www.tei-c.org/ns/1.0" xmlns:custom="urn:custom"><text><body><div><custom:p>Text</custom:p></div></body></text></TEI>';
    store.dispatch(
      setEditorLetter({
        letter: {
          id: 7,
          name: 'FMB-7',
          viewMode: 'WYSIWYG',
          xmlContent: unsupportedXml,
        },
      }),
    );
    const openWindow = jest.spyOn(window, 'open').mockImplementation(() => null);
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
        name: /TEI-P5-Dokumentation: <p>|TEI P5 documentation: <p>/,
      }),
    );

    expect(openWindow).not.toHaveBeenCalled();
    expect(enqueueSnackbar).toHaveBeenCalledWith(expect.stringMatching(/<p>/), {
      variant: 'warning',
    });
  });

  it('groups the six font actions in a submenu and applies the selected formatting', async () => {
    const patch = jest.spyOn(EditorUtils.backendService, 'patchContent').mockResolvedValue(true);
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    const markedXml = sourceXml.replace('Text', 'Te<span class="marked">xt</span>');
    store.dispatch(
      setEditorLetter({
        letter: { id: 7, name: 'FMB-7', viewMode: 'WYSIWYG', xmlContent: markedXml },
      }),
    );
    store.dispatch(setContentTextIsMarked({ textIsMarked: true }));
    const { container } = render(
      <Provider store={store}>
        <ContextMenuHarness />
      </Provider>,
    );
    const marked = document.createElement('span');
    marked.className = 'marked';
    marked.textContent = 'xt';
    container.querySelector('p')!.replaceChildren(document.createTextNode('Te'), marked);
    fireEvent.contextMenu(marked, { button: 2, clientX: 20, clientY: 30 });
    const labels = [
      /Text hochstellen|Superscript text/i,
      /Text tiefstellen|Subscript text/i,
      /Unterstrich auf der Grundlinie|Underline on the baseline/i,
      /Lateinische Schrift auszeichnen|Mark as Latin script/i,
      /Antiqua.*auszeichnen|Mark print text as Antiqua/i,
      /Frakturschrift.*auszeichnen|Mark print text as Fraktur/i,
    ];
    for (const name of labels) expect(screen.queryByRole('menuitem', { name })).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole('menuitem', { name: /Text auszeichnen|Mark up text/ }));
    expect(screen.getByRole('menuitem', { name: /Schriftformatierung|Text formatting/ })).toBeVisible();
    fireEvent.click(screen.getByRole('menuitem', { name: /Kommentare und Verweise|Comments and references/ }));
    expect(screen.queryByRole('menuitem', { name: /Schriftformatierung|Text formatting/ })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Querverweise|Cross-references/ })).toBeVisible();
    fireEvent.click(screen.getByRole('menuitem', { name: /Text auszeichnen|Mark up text/ }));
    fireEvent.click(await screen.findByRole('menuitem', { name: /Schriftformatierung|Text formatting/ }));
    for (const name of labels) expect(screen.getByRole('menuitem', { name })).toBeVisible();
    fireEvent.click(screen.getByRole('menuitem', { name: labels[0] }));
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0][0]).toContain('rend="superscript"');
    expect(patch.mock.calls[0][2]).toBe('CONTENT_FORMAT_CHANGED');
  });

  it('clears a marked selection from its context menu without changing the text', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    const markedXml = sourceXml.replace('Text', 'Te<span class="marked">xt</span>');
    store.dispatch(
      setEditorLetter({
        letter: { id: 7, name: 'FMB-7', viewMode: 'WYSIWYG', xmlContent: markedXml },
      }),
    );
    store.dispatch(setContentTextIsMarked({ textIsMarked: true }));
    const { container } = render(
      <Provider store={store}>
        <ContextMenuHarness />
      </Provider>,
    );
    const paragraph = container.querySelector('p')!;
    paragraph.innerHTML = 'Te<span class="marked">xt</span>';

    const selectionHint = screen.getByRole('status');
    expect(selectionHint).toHaveTextContent(/Textmarkierung aktiv|Text selection active/);
    expect(selectionHint).toHaveTextContent(/Rechtsklick|right-click/);
    expect(screen.getByText('Esc').tagName).toBe('KBD');

    fireEvent.contextMenu(paragraph.querySelector('span.marked')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    fireEvent.click(await screen.findByRole('menuitem', { name: /Markierung aufheben|Clear selection/ }));

    await waitFor(() => expect(store.getState().editorLetter.content.textIsMarked).toBe(false));
    expect(store.getState().editorLetter.letter.xmlContent).not.toContain('class="marked"');
    expect(paragraph.querySelector('span.marked')).not.toBeInTheDocument();
    expect(paragraph.childNodes).toHaveLength(1);
    expect(paragraph).toHaveTextContent('Text');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('clears a marked selection with Escape', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    const markedXml = sourceXml.replace('Text', 'Te<span class="marked">xt</span>');
    store.dispatch(
      setEditorLetter({
        letter: { id: 7, name: 'FMB-7', viewMode: 'WYSIWYG', xmlContent: markedXml },
      }),
    );
    store.dispatch(setContentTextIsMarked({ textIsMarked: true }));
    const { container } = render(
      <Provider store={store}>
        <ContextMenuHarness />
      </Provider>,
    );
    const paragraph = container.querySelector('p')!;
    paragraph.innerHTML = 'Te<span class="marked">xt</span>';

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(store.getState().editorLetter.content.textIsMarked).toBe(false));
    expect(store.getState().editorLetter.letter.xmlContent).not.toContain('class="marked"');
    expect(paragraph.querySelector('span.marked')).not.toBeInTheDocument();
    expect(paragraph.childNodes).toHaveLength(1);
    expect(paragraph).toHaveTextContent('Text');
  });

  it('automatically hides the selection hint and limits it to the first three selections per session', () => {
    jest.useFakeTimers();
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(
      setEditorLetter({
        letter: { id: 7, name: 'FMB-7', viewMode: 'WYSIWYG', xmlContent: sourceXml },
      }),
    );
    store.dispatch(setContentTextIsMarked({ textIsMarked: true }));

    const firstRender = render(
      <Provider store={store}>
        <ContextMenuHarness />
      </Provider>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(window.sessionStorage.getItem('tei-editor-selection-clear-hint-count')).toBe('1');

    act(() => jest.advanceTimersByTime(7000));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    firstRender.unmount();

    window.sessionStorage.setItem('tei-editor-selection-clear-hint-count', '3');
    render(
      <Provider store={store}>
        <ContextMenuHarness />
      </Provider>,
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    jest.useRealTimers();
  });

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
    await openWritingActMenuGroup(/Kommentare und Verweise|Comments and references/);
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

  it('opens author-footnote creation from a collapsed text caret', async () => {
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
    await openWritingActMenuGroup(/Kommentare und Verweise|Comments and references/);
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: /Fußnote des Briefautors|author footnote/,
      }),
    );

    expect(store.getState().editorLetter.dialogType).toBe('ADD_FOOTNOTE_AUTHOR');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'p',
      elementXmlId: '0.0.0.0',
      elementKey: 'caret:0:2',
    });
  });

  it('opens horizontal-fraction creation from a collapsed text caret', async () => {
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
    await openWritingActMenuGroup(/Kommentare und Verweise|Comments and references/);
    fireEvent.click(await screen.findByRole('menuitem', { name: /Bruchzahlen|Fractions/ }));
    fireEvent.click(await screen.findByRole('menuitem', { name: /horizontaler Linie|horizontal bar/ }));

    expect(store.getState().editorLetter.dialogType).toBe('HORIZONTAL_FRACTION');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'p',
      elementXmlId: '0.0.0.0',
      elementKey: 'caret:0:2',
    });
  });

  it.each([
    [/mit Slash|with slash/, 'VERTICAL_SLASH_FRACTION'],
    [/ohne Slash|without slash/, 'VERTICAL_NOSLASH_FRACTION'],
  ])('opens vertical-fraction creation for %s from a collapsed text caret', async (actionName, dialogType) => {
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
    await openWritingActMenuGroup(/Kommentare und Verweise|Comments and references/);
    fireEvent.click(await screen.findByRole('menuitem', { name: /Bruchzahlen|Fractions/ }));
    fireEvent.click(await screen.findByRole('menuitem', { name: actionName }));

    expect(store.getState().editorLetter.dialogType).toBe(dialogType);
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'p',
      elementXmlId: '0.0.0.0',
      elementKey: 'caret:0:2',
    });
  });

  it('shows only edit and delete actions for an existing horizontal fraction', async () => {
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

    fireEvent.contextMenu(container.querySelector('[data-editor-horizontal-fraction-reference]')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });

    const menuItems = await screen.findAllByRole('menuitem');
    expect(menuItems).toHaveLength(2);
    expect(menuItems[0]).toHaveTextContent(/Bruchzahl bearbeiten|Edit fraction/);
    expect(menuItems[1]).toHaveTextContent(/Bruchzahl löschen|Delete fraction/);
    fireEvent.click(menuItems[1]);

    expect(store.getState().editorLetter.dialogType).toBe('HORIZONTAL_FRACTION');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'formula',
      elementXmlId: 'formula_1',
      elementKey: 'delete',
    });
  });

  it.each([
    ['formula_2', 'VERTICAL_SLASH_FRACTION'],
    ['formula_3', 'VERTICAL_NOSLASH_FRACTION'],
  ])('shows isolated actions for existing vertical fraction %s', async (reference, dialogType) => {
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

    fireEvent.contextMenu(container.querySelector(`[data-editor-fraction-reference="${reference}"]`)!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });

    const menuItems = await screen.findAllByRole('menuitem');
    expect(menuItems).toHaveLength(2);
    fireEvent.click(menuItems[0]);

    expect(store.getState().editorLetter.dialogType).toBe(dialogType);
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'formula',
      elementXmlId: reference,
      elementKey: 'edit',
    });
  });

  it('opens cross-reference creation from a collapsed text caret', async () => {
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
    const selection = window.getSelection()!;
    const range = document.createRange();
    range.setStart(paragraph.firstChild!, 2);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    fireEvent.contextMenu(paragraph, { button: 2, clientX: 20, clientY: 30 });
    await openWritingActMenuGroup(/Kommentare und Verweise|Comments and references/);
    fireEvent.click(await screen.findByRole('menuitem', { name: /Querverweise|Cross-references/ }));
    fireEvent.click(await screen.findByRole('menuitem', { name: /Registereinträge|register entries/ }));

    expect(store.getState().editorLetter.dialogType).toBe('CROSS_REFERENCE');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'register',
      elementXmlId: '0.0.0.0',
      elementKey: 'caret:0:2',
    });
  });

  it.each([
    [/Anmerkung zur Handschrift bearbeiten|Edit manuscript annotation/, 'edit'],
    [/Anmerkung zur Handschrift löschen|Delete manuscript annotation/, 'delete'],
  ] as const)('opens the manuscript annotation action %s from its caret', async (label, mode) => {
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

    fireEvent.contextMenu(container.querySelector('[data-editor-manuscript-annotation-reference]')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    const selectedAction = await screen.findByRole('menuitem', { name: label });
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    fireEvent.click(selectedAction);

    expect(store.getState().editorLetter.dialogType).toBe('MANUSCRIPT_ANNOTATION');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'p',
      elementXmlId: 'script_annotation_1',
      elementKey: mode,
    });
  });

  it('shows only manuscript actions when right-clicking the annotation text', async () => {
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

    fireEvent.contextMenu(container.querySelector('p.tei-manuscript-annotation')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });

    const items = await screen.findAllByRole('menuitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent(/Anmerkung zur Handschrift bearbeiten|Edit manuscript annotation/);
    expect(items[1]).toHaveTextContent(/Anmerkung zur Handschrift löschen|Delete manuscript annotation/);
  });

  it.each([
    [/Fußnote bearbeiten|Edit footnote/, 'edit'],
    [/Fußnote löschen|Delete footnote/, 'delete'],
  ] as const)('shows only the author-footnote action %s on its reference', async (label, mode) => {
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

    fireEvent.contextMenu(container.querySelector('ref[data-editor-author-footnote-id]')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    const selectedAction = await screen.findByRole('menuitem', { name: label });
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    fireEvent.click(selectedAction);

    expect(store.getState().editorLetter.dialogType).toBe('ADD_FOOTNOTE_AUTHOR');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'note',
      elementXmlId: 'fn_1',
      elementKey: mode,
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
    await openWritingActContentGroup(/Grafische Elemente|Graphic elements/);
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
    await openWritingActContentGroup(/Grafische Elemente|Graphic elements/);
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
    await openWritingActContentGroup(/Grafische Elemente|Graphic elements/);
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
    await openWritingActContentGroup(/Absätze und Abschnitte|Paragraphs and sections/);
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

  it('opens paragraph content editing for a plain paragraph', async () => {
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
    await openWritingActContentGroup(/Absätze und Abschnitte|Paragraphs and sections/);
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: /Absatzinhalt bearbeiten oder leeren|Edit or clear paragraph content/,
      }),
    );

    expect(store.getState().editorLetter.dialogType).toBe('PARAGRAPH_STRUCTURE');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'p',
      elementXmlId: '0.0.0.0',
      elementKey: 'paragraph-edit',
    });
  });

  it('opens greeting-formula creation through the rendered paragraph source path', async () => {
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
    await openWritingActMenuGroup(/Element bearbeiten|Edit element/);
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: /Begrüßungsformel Hinzufügen|Add Greeting Formula/,
      }),
    );

    await waitFor(() => expect(store.getState().editorLetter.dialogType).toBe('ADD_GREETINGS_FORMULA'));
    const updatedXml = new DOMParser().parseFromString(store.getState().editorLetter.letter.xmlContent ?? '', 'application/xml');
    expect(updatedXml.querySelector('p')?.getAttribute('tmp_id')).toMatch(/^tmp-id-ADD_GREETINGS_FORMULA-/);
    expect(enqueueSnackbar).not.toHaveBeenCalledWith('Could not resolve node in XML doc', {
      variant: 'error',
    });
  });

  it('keeps paragraph content editing visible but disabled for structured markup', async () => {
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

    fireEvent.contextMenu(container.querySelector('persName')!.closest('p')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    await openWritingActContentGroup(/Absätze und Abschnitte|Paragraphs and sections/);
    const editParagraph = await screen.findByRole('menuitem', {
      name: /Absatzinhalt bearbeiten oder leeren|Edit or clear paragraph content/,
    });

    expect(editParagraph).toHaveAttribute('aria-disabled', 'true');
    expect(editParagraph).toHaveAttribute('title', expect.stringMatching(/strukturierte Auszeichnungen|structured markup/));
  });

  it('removes an annotation through its stable source path and preserves its text', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    const patchContent = jest.spyOn(EditorUtils.backendService, 'patchContent').mockResolvedValue(true);
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

    fireEvent.contextMenu(container.querySelector('persName')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    await openWritingActMenuGroup(/Element bearbeiten|Edit element/);
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: /Auszeichnung Entfernen|Remove Annotation/,
      }),
    );

    await waitFor(() => expect(patchContent).toHaveBeenCalledTimes(1));
    const persistedDocument = new DOMParser().parseFromString(patchContent.mock.calls[0][0], 'application/xml');
    expect(persistedDocument.querySelector('persName')).toBeNull();
    expect(persistedDocument.querySelectorAll('body > div:first-child > p')[1]?.textContent).toBe('Felix');
  });

  it('adds a paragraph directly to the selected writing act without choosing a subsection', async () => {
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

    fireEvent.contextMenu(container.querySelector('div[type="act_of_writing"]')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    await openWritingActContentGroup(/Absätze und Abschnitte|Paragraphs and sections/);
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: /Absatz in diesem Abschnitt hinzufügen|Add paragraph to this section/,
      }),
    );

    expect(store.getState().editorLetter.dialogType).toBe('PARAGRAPH_STRUCTURE');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'div',
      elementXmlId: '0.0.0',
      elementKey: 'paragraph-append',
    });
  });

  it('opens the existing writing-act dialog from a writing act context menu', async () => {
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

    fireEvent.contextMenu(container.querySelector('div[type="act_of_writing"]')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    await openWritingActMenuGroup(/Anordnen|Organize/);
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: /Weiteren Schreibakt hinzufügen|Add another writing act/,
      }),
    );

    expect(store.getState().editorLetter.dialogType).toBe('ADD_WRITING_PART');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'div',
      elementXmlId: '0.0.0',
      elementKey: null,
    });
  });

  it('opens author and writer editing for the selected writing act from the section submenu', async () => {
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

    const writingActs = container.querySelectorAll('div[type="act_of_writing"]');
    const writingActCaret = document.createElement('button');
    writingActCaret.className = 'tei-section-caret';
    writingActCaret.dataset.editorSectionCaret = 'true';
    writingActCaret.textContent = '▶';
    writingActs[1].prepend(writingActCaret);
    fireEvent.contextMenu(writingActCaret, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    expect(store.getState().editorLetter.reloadLetterContent).toBe(false);
    expect(await screen.findByText(/Schreibakt 2|Writing act 2/)).toBeVisible();
    fireEvent.click(await screen.findByRole('menuitem', { name: /Metadaten|Metadata/ }));
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: /Autoren und Schreiber bearbeiten|Edit authors and writers/,
      }),
    );

    expect(store.getState().editorLetter.dialogType).toBe('MANAGE_WRITING_ACT_AUTHOR_WRITER');
    expect(store.getState().editorLetter.letter.actOfWriting.orderNumber).toBe('2');
  });

  it('moves a writing act from the visible section submenu and keeps numbering sequential', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    const patchContent = jest.spyOn(EditorUtils.backendService, 'patchContent').mockResolvedValue(true);
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

    fireEvent.contextMenu(container.querySelector('div[type="act_of_writing"][n="1"]')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    await openWritingActMenuGroup(/Anordnen|Organize/);
    expect(
      await screen.findByRole('menuitem', {
        name: /Schreibakt nach oben verschieben|Move writing act up/,
      }),
    ).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: /Schreibakt nach unten verschieben|Move writing act down/,
      }),
    );

    await waitFor(() => expect(patchContent).toHaveBeenCalledTimes(1));
    const persistedDocument = new DOMParser().parseFromString(patchContent.mock.calls[0][0], 'application/xml');
    const writingActs = Array.from(persistedDocument.querySelectorAll('body > div[type="act_of_writing"]'));
    expect(writingActs.map((writingAct) => writingAct.getAttribute('xml:id'))).toEqual(['act_2', 'act_1']);
    expect(writingActs.map((writingAct) => writingAct.getAttribute('n'))).toEqual(['1', '2']);
  });

  it('deletes only the selected section heading through the structure context menu', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    const patchContent = jest.spyOn(EditorUtils.backendService, 'patchContent').mockResolvedValue(true);
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

    fireEvent.contextMenu(container.querySelector('div1')!, {
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
        name: /Abschnittsüberschrift löschen|Delete section heading/,
      }),
    );

    await waitFor(() => expect(patchContent).toHaveBeenCalledTimes(1));
    const persistedXml = patchContent.mock.calls[0][0];
    const persistedDocument = new DOMParser().parseFromString(persistedXml, 'application/xml');
    const section = persistedDocument.querySelector('div1')!;
    expect(section.querySelector(':scope > head')).toBeNull();
    expect(section.querySelector(':scope > p')?.textContent).toBe('Section text');
    patchContent.mockRestore();
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
    await openWritingActContentGroup(/Listen|Lists/);
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

  it('keeps list-item actions visible but disabled on the list container', async () => {
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

    fireEvent.contextMenu(container.querySelector('list')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    await openWritingActContentGroup(/Listen|Lists/);

    for (const label of [/Listeneintrag bearbeiten|Edit list item/, /Listeneintrag löschen|Delete list item/]) {
      const action = await screen.findByRole('menuitem', { name: label });
      expect(action).toHaveAttribute('aria-disabled', 'true');
      expect(action).toHaveAttribute('title', expect.stringMatching(/Listeneintrag|list item/));
    }
    expect(screen.getByRole('menuitem', { name: /Listeneintrag hinzufügen|Add list item/ })).not.toHaveAttribute('aria-disabled', 'true');
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
    await openWritingActContentGroup(/Listen|Lists/);
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
    await openWritingActContentGroup(/Tabellen|Tables/);
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
    await openWritingActContentGroup(/Tabellen|Tables/);
    for (const label of [/Zelle|Cell/, /Zeile|Row/, /Spalte|Column/]) {
      const group = await screen.findByRole('menuitem', { name: label });
      expect(group).toHaveAttribute('aria-disabled', 'true');
      expect(group).toHaveAttribute('title', expect.stringMatching(/Tabellen(zelle|zeile)|table (cell|row)/));
    }
    expect(screen.getByRole('menuitem', { name: /^(Tabelle|Table)$/ })).not.toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(await screen.findByRole('menuitem', { name: /^(Tabelle|Table)$/ }));
    expect(await screen.findByRole('menuitem', { name: /Tabelle löschen|Delete table/ })).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('menuitem', { name: /Tabelle sortieren|Sort table/ }));

    expect(store.getState().editorLetter.dialogType).toBe('TABLE_STRUCTURE');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'table',
      elementXmlId: '0.0.0.2',
      elementKey: 'table-sort',
    });
  });

  it('keeps figure upload visible but disabled while one is running', async () => {
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
    await openWritingActContentGroup(/Grafische Elemente|Graphic elements/);
    const upload = await screen.findByRole('menuitem', { name: /Bild einfügen|Insert image/ });

    expect(upload).toHaveAttribute('aria-disabled', 'true');
    expect(upload).toHaveAttribute('title', expect.stringMatching(/Bild-Upload|image upload/));
    fireEvent.click(upload);
    expect(store.getState().editorLetter.dialogType).toBeNull();
  });

  it.each([
    [/Querverweis bearbeiten|Edit cross-reference/, 'edit'],
    [/Querverweis löschen|Delete cross-reference/, 'delete'],
  ] as const)('shows only the cross-reference action %s on its marker', async (label, mode) => {
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

    fireEvent.contextMenu(container.querySelector('[data-editor-cross-reference-id]')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    const selectedAction = await screen.findByRole('menuitem', { name: label });
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    fireEvent.click(selectedAction);

    expect(store.getState().editorLetter.dialogType).toBe('CROSS_REFERENCE');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'span',
      elementXmlId: 'link_1',
      elementKey: mode,
    });
  });

  it.each([
    [/Fremdsprachigen Text bearbeiten|Edit foreign-language text/, 'edit'],
    [/Fremdsprachige Auszeichnung löschen|Remove foreign-language markup/, 'delete'],
  ] as const)('shows only the foreign-text action %s on its text', async (label, mode) => {
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

    fireEvent.contextMenu(container.querySelector('[data-editor-foreign-text-reference]')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    const selectedAction = await screen.findByRole('menuitem', { name: label });
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    fireEvent.click(selectedAction);

    expect(store.getState().editorLetter.dialogType).toBe('FOREIGN_TEXT');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'foreign',
      elementXmlId: 'foreign_1',
      elementKey: mode,
    });
  });

  it.each([
    [/Abkürzung bearbeiten|Edit abbreviation/, 'edit'],
    [/Abkürzungsauszeichnung löschen|Remove abbreviation markup/, 'delete'],
  ] as const)('shows only the abbreviation action %s on its text', async (label, mode) => {
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

    fireEvent.contextMenu(container.querySelector('[data-editor-abbreviation-reference]')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });
    const selectedAction = await screen.findByRole('menuitem', { name: label });
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    fireEvent.click(selectedAction);

    expect(store.getState().editorLetter.dialogType).toBe('ABBREVIATION');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'choice',
      elementXmlId: 'choice_1',
      elementKey: mode,
    });
  });

  it('shows only the remove action for existing superscript markup', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    const patchContent = jest.spyOn(EditorUtils.backendService, 'patchContent').mockResolvedValue({} as never);
    store.dispatch(
      setEditorLetter({
        letter: {
          id: 7,
          name: 'FMB-7',
          viewMode: 'WYSIWYG',
          xmlContent:
            '<TEI><text><body><div xml:id="act_1"><p xml:id="paragraph_1">Text<hi xml:id="super_1" rend="superscript">1st</hi></p></div></body></text></TEI>',
        },
      }),
    );
    const { container } = render(
      <Provider store={store}>
        <ContextMenuHarness />
      </Provider>,
    );

    fireEvent.contextMenu(container.querySelector('[data-editor-inline-format="superscript"]')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });

    const removeAction = await screen.findByRole('menuitem', {
      name: /Hochstellung entfernen|Remove superscript/,
    });
    expect(removeAction).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    fireEvent.click(removeAction);

    await waitFor(() => expect(patchContent).toHaveBeenCalledTimes(1));
    const persistedXml = patchContent.mock.calls[0][0];
    expect(persistedXml).not.toContain('rend="superscript"');
    expect(persistedXml).toContain('Text1st');
    expect(store.getState().editorLetter.letter.xmlContent).toBe(persistedXml);
  });

  it('shows only the remove action for existing subscript markup', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    const patchContent = jest.spyOn(EditorUtils.backendService, 'patchContent').mockResolvedValue({} as never);
    store.dispatch(
      setEditorLetter({
        letter: {
          id: 7,
          name: 'FMB-7',
          viewMode: 'WYSIWYG',
          xmlContent:
            '<TEI><text><body><div xml:id="act_1"><p xml:id="paragraph_1">H<hi xml:id="sub_1" rend="subscript">2</hi><hi xml:id="super_1" rend="superscript">+</hi></p></div></body></text></TEI>',
        },
      }),
    );
    const { container } = render(
      <Provider store={store}>
        <ContextMenuHarness />
      </Provider>,
    );

    fireEvent.contextMenu(container.querySelector('[data-editor-inline-format="subscript"]')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });

    const removeAction = await screen.findByRole('menuitem', {
      name: /Tiefstellung entfernen|Remove subscript/,
    });
    expect(removeAction).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    fireEvent.click(removeAction);

    await waitFor(() => expect(patchContent).toHaveBeenCalledTimes(1));
    const persistedXml = patchContent.mock.calls[0][0];
    expect(persistedXml).not.toContain('rend="subscript"');
    expect(persistedXml).toContain('H2');
    expect(persistedXml).toContain('rend="superscript"');
    expect(store.getState().editorLetter.letter.xmlContent).toBe(persistedXml);
  });

  it('shows only the remove action for existing groundline markup', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    const patchContent = jest.spyOn(EditorUtils.backendService, 'patchContent').mockResolvedValue({} as never);
    store.dispatch(
      setEditorLetter({
        letter: {
          id: 7,
          name: 'FMB-7',
          viewMode: 'WYSIWYG',
          xmlContent:
            '<TEI><text><body><div xml:id="act_1"><p xml:id="paragraph_1"><hi xml:id="under_1" rend="underline">regular</hi><hi xml:id="ground_1" rend="groundline">ground</hi></p></div></body></text></TEI>',
        },
      }),
    );
    const { container } = render(
      <Provider store={store}>
        <ContextMenuHarness />
      </Provider>,
    );

    fireEvent.contextMenu(container.querySelector('[data-editor-inline-format="groundline"]')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });

    const removeAction = await screen.findByRole('menuitem', {
      name: /Unterstrich auf der Grundlinie entfernen|Remove baseline underline/,
    });
    expect(removeAction).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    fireEvent.click(removeAction);

    await waitFor(() => expect(patchContent).toHaveBeenCalledTimes(1));
    const persistedXml = patchContent.mock.calls[0][0];
    expect(persistedXml).not.toContain('rend="groundline"');
    expect(persistedXml).toContain('ground');
    expect(persistedXml).toContain('rend="underline"');
    expect(store.getState().editorLetter.letter.xmlContent).toBe(persistedXml);
  });

  it('shows only the remove action for existing local latintype markup', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    const patchContent = jest.spyOn(EditorUtils.backendService, 'patchContent').mockResolvedValue({} as never);
    store.dispatch(
      setEditorLetter({
        letter: {
          id: 7,
          name: 'FMB-7',
          viewMode: 'WYSIWYG',
          xmlContent:
            '<TEI><text><body><div xml:id="act_1"><p xml:id="paragraph_1"><hi xml:id="latin_1" rend="latintype">Amicus</hi><hi xml:id="italic_1" rend="italic">certus</hi></p></div></body></text></TEI>',
        },
      }),
    );
    const { container } = render(
      <Provider store={store}>
        <ContextMenuHarness />
      </Provider>,
    );

    fireEvent.contextMenu(container.querySelector('[data-editor-inline-format="latintype"]')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });

    const removeAction = await screen.findByRole('menuitem', {
      name: /Auszeichnung als lateinische Schrift entfernen|Remove Latin script markup/,
    });
    expect(removeAction).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    fireEvent.click(removeAction);

    await waitFor(() => expect(patchContent).toHaveBeenCalledTimes(1));
    const persistedXml = patchContent.mock.calls[0][0];
    expect(persistedXml).not.toContain('rend="latintype"');
    expect(persistedXml).toContain('Amicus');
    expect(persistedXml).toContain('rend="italic"');
    expect(store.getState().editorLetter.letter.xmlContent).toBe(persistedXml);
  });

  it('shows only the remove action for existing Antiqua markup', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    const patchContent = jest.spyOn(EditorUtils.backendService, 'patchContent').mockResolvedValue({} as never);
    store.dispatch(
      setEditorLetter({
        letter: {
          id: 7,
          name: 'FMB-7',
          viewMode: 'WYSIWYG',
          xmlContent:
            '<TEI><text><body><div xml:id="act_1"><p xml:id="paragraph_1"><hi xml:id="antiqua_1" rend="Antiqua">Leipziger</hi><hi xml:id="latin_1" rend="latintype">Amicus</hi></p></div></body></text></TEI>',
        },
      }),
    );
    const { container } = render(
      <Provider store={store}>
        <ContextMenuHarness />
      </Provider>,
    );

    fireEvent.contextMenu(container.querySelector('[data-editor-inline-format="antiqua"]')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });

    const removeAction = await screen.findByRole('menuitem', {
      name: /Antiqua-Auszeichnung entfernen|Remove Antiqua markup/,
    });
    expect(removeAction).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    fireEvent.click(removeAction);

    await waitFor(() => expect(patchContent).toHaveBeenCalledTimes(1));
    const persistedXml = patchContent.mock.calls[0][0];
    expect(persistedXml).not.toContain('rend="Antiqua"');
    expect(persistedXml).toContain('Leipziger');
    expect(persistedXml).toContain('rend="latintype"');
    expect(store.getState().editorLetter.letter.xmlContent).toBe(persistedXml);
  });

  it('shows only the remove action for existing Fraktur markup', async () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    const patchContent = jest.spyOn(EditorUtils.backendService, 'patchContent').mockResolvedValue({} as never);
    store.dispatch(
      setEditorLetter({
        letter: {
          id: 7,
          name: 'FMB-7',
          viewMode: 'WYSIWYG',
          xmlContent:
            '<TEI><text><body><div xml:id="act_1"><p xml:id="paragraph_1"><hi xml:id="gothic_1" rend="gothic">Zeitung</hi><hi xml:id="antiqua_1" rend="Antiqua">Leipzig</hi></p></div></body></text></TEI>',
        },
      }),
    );
    const { container } = render(
      <Provider store={store}>
        <ContextMenuHarness />
      </Provider>,
    );

    fireEvent.contextMenu(container.querySelector('[data-editor-inline-format="gothic"]')!, {
      button: 2,
      clientX: 20,
      clientY: 30,
    });

    const removeAction = await screen.findByRole('menuitem', {
      name: /Frakturschrift-Auszeichnung entfernen|Remove Fraktur markup/,
    });
    expect(removeAction).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    fireEvent.click(removeAction);

    await waitFor(() => expect(patchContent).toHaveBeenCalledTimes(1));
    const persistedXml = patchContent.mock.calls[0][0];
    expect(persistedXml).not.toContain('rend="gothic"');
    expect(persistedXml).toContain('Zeitung');
    expect(persistedXml).toContain('rend="Antiqua"');
    expect(store.getState().editorLetter.letter.xmlContent).toBe(persistedXml);
  });
});
