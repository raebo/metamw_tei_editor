import React, { useRef, useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider, useSelector } from 'react-redux';
import '@src/i18n';
import editorLetterReducer, { setEditorLetter, setLetterReference } from '@src/redux/slices/editor.letter.slice';
import type { RootState } from '@src/redux/redux.store';
import { EditorUtils } from '@src/utils/editor';
import XMLDisplayParser from '@src/components/editor/letter/Center/LetterViewContainer/XmlDisplayParser';
import RightClickActionMenu from '@src/components/editor/letter/Center/LetterViewContainer/RightClickActionMenu';
import SectionAddressLineDialog from '@src/components/editor/letter/Dialog/Components/SectionAddressLineDialog';
import { EditorConstants } from '@src/constants/editor';

jest.mock('notistack', () => ({ enqueueSnackbar: jest.fn() }));
const xml = `<TEI xmlns="${EditorConstants.TEI_NS}"><text><body><div type="act_of_writing" xml:id="section"><p>Text</p></div></body></text></TEI>`;
const withLine = `<TEI xmlns="${EditorConstants.TEI_NS}"><text><body><div type="addrline"><p><address><addrLine xml:id="line">Berlin</addrLine></address></p></div><div type="act_of_writing"><p>Text</p></div></body></text></TEI>`;
const buildStore = (content = xml) => {
  const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
  store.dispatch(setEditorLetter({ letter: { id: 7, xmlContent: content, viewMode: 'WYSIWYG' } }));
  return store;
};
const Harness = () => {
  const ref = useRef<HTMLDivElement>(null);
  const content = useSelector((state: RootState) => state.editorLetter.letter.xmlContent)!;
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  return (
    <>
      <div ref={ref}>
        <XMLDisplayParser xmlContentRef={null} xmlString={content} />
      </div>
      <RightClickActionMenu xmlContentRef={ref} setLetterState={jest.fn()} anchorPosition={position} setAnchorPosition={setPosition} />
    </>
  );
};

describe('section address line workflow', () => {
  afterEach(() => jest.restoreAllMocks());

  it('inserts a visible ADRLINE from the section triangle and persists only TEI', async () => {
    const patch = jest.spyOn(EditorUtils.backendService, 'patchContent').mockResolvedValue(true);
    const store = buildStore();
    const { container } = render(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Abschnittsmenü öffnen|Open section menu/ }));
    fireEvent.click(await screen.findByRole('menuitem', { name: /Adresszeile einfügen|Insert address line/ }));
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0][2]).toBe('ADDRLINE_ADDED');
    const saved = patch.mock.calls[0][0];
    expect(saved).toContain('>ADRLINE</addrLine>');
    expect(saved).not.toContain('data-editor-');
    expect(saved).not.toContain('▬');
    await screen.findByRole('button', { name: /Adresszeile: Menü öffnen|Address line: open menu/ });
    expect(container.querySelector('.tei-section-address-line')).toHaveTextContent('▬ADRLINE');
    const doc = new DOMParser().parseFromString(store.getState().editorLetter.letter.xmlContent!, 'application/xml');
    expect(doc.querySelector('[type="act_of_writing"]')?.previousElementSibling?.getAttribute('type')).toBe('addrline');
  });

  it.each(['shortcut', 'context menu'])('inserts after clicking letter text via %s', async (method) => {
    const patch = jest.spyOn(EditorUtils.backendService, 'patchContent').mockResolvedValue(true);
    const store = buildStore();
    render(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );
    const text = screen.getByText('Text');
    fireEvent.click(text);
    if (method === 'shortcut') {
      fireEvent.keyDown(text, { key: 'c', ctrlKey: true, altKey: true });
    } else {
      fireEvent.contextMenu(text, { button: 2 });
      fireEvent.click(await screen.findByRole('menuitem', { name: /Adresszeile einfügen|Insert address line/ }));
    }
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0][0]).toContain('<addrLine');
  });

  it('ignores shortcuts without a section, in inputs, after leaving the letter and on repeat', () => {
    const patch = jest.spyOn(EditorUtils.backendService, 'patchContent').mockResolvedValue(true);
    const store = buildStore();
    render(
      <Provider store={store}>
        <Harness />
        <input aria-label="Other input" />
      </Provider>,
    );
    const shortcut = { key: 'c', ctrlKey: true, altKey: true };
    fireEvent.keyDown(document.body, shortcut);
    const text = screen.getByText('Text');
    fireEvent.click(text);
    fireEvent.keyDown(text, { ...shortcut, repeat: true });
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Other input' }), shortcut);
    fireEvent.click(document.body);
    fireEvent.keyDown(document.body, shortcut);
    expect(patch).not.toHaveBeenCalled();
  });

  it.each([
    ['edit', /Adresszeile bearbeiten|Edit address line/],
    ['delete', /Adresszeile löschen|Delete address line/],
  ] as const)('opens the %s dialog from the address rectangle', async (operation, label) => {
    const store = buildStore(withLine);
    render(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );
    fireEvent.contextMenu(screen.getByRole('button', { name: /Adresszeile: Menü öffnen|Address line: open menu/ }), { button: 2 });
    fireEvent.click(await screen.findByRole('menuitem', { name: label }));
    expect(store.getState().editorLetter.dialogType).toBe('SECTION_ADDRESS_LINE');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'addrLine',
      elementXmlId: 'line',
      elementKey: operation,
    });
  });

  it.each(['addrline', 'addrLine'])('opens edit and delete actions on the text in a %s block', async (type) => {
    const store = buildStore(withLine.replace('type="addrline"', `type="${type}"`).replace('Berlin', 'ADRLINE'));
    render(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );
    fireEvent.contextMenu(screen.getByText('ADRLINE'), { button: 2 });
    expect(await screen.findByRole('menuitem', { name: /Adresszeile löschen|Delete address line/ })).toBeVisible();
    fireEvent.click(screen.getByRole('menuitem', { name: /Adresszeile bearbeiten|Edit address line/ }));
    expect(store.getState().editorLetter.dialogType).toBe('SECTION_ADDRESS_LINE');
    expect(store.getState().editorLetter.letterReference.elementKey).toBe('edit');
  });

  it.each(['addrline', 'addrLine'])('edits a text line in a %s block and keeps the following section', (type) => {
    const content = withLine.replace('type="addrline"', `type="${type}"`);
    const store = buildStore(content);
    store.dispatch(setLetterReference({ letterReference: { elementXmlId: 'line', elementKey: 'edit' } }));
    const doc = new DOMParser().parseFromString(content, 'application/xml');
    const onSave = jest.fn();
    render(
      <Provider store={store}>
        <SectionAddressLineDialog xmlDoc={doc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );
    const input = screen.getByRole('textbox', { name: /Text der Adresszeile|Address line text/ });
    expect(input.tagName).toBe('INPUT');
    fireEvent.change(input, { target: { value: 'Leipzig & Berlin' } });
    fireEvent.click(screen.getByRole('button', { name: /Speichern|Save/ }));
    expect(doc.querySelector('addrLine')?.textContent).toBe('Leipzig & Berlin');
    expect(doc.querySelector('[type="act_of_writing"]')?.textContent).toBe('Text');
    expect(onSave).toHaveBeenCalledWith(doc, 'ADDRLINE_CHANGED', expect.any(String));
  });

  it('cancels without changing XML and deletes the last line with its address on confirmation', () => {
    const store = buildStore(withLine);
    store.dispatch(setLetterReference({ letterReference: { elementXmlId: 'line', elementKey: 'delete' } }));
    const doc = new DOMParser().parseFromString(withLine, 'application/xml');
    const onSave = jest.fn();
    const onClose = jest.fn();
    render(
      <Provider store={store}>
        <SectionAddressLineDialog xmlDoc={doc} onSave={onSave} onClose={onClose} />
      </Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Abbrechen|Cancel/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
    expect(doc.querySelector('address')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Adresszeile löschen|Delete address line/ }));
    expect(doc.querySelector('address')).toBeNull();
    expect(doc.querySelector('[type="addrline"]')).toBeNull();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(doc, 'ADDRLINE_REMOVED', expect.any(String));
  });
});
