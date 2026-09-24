import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import '@src/i18n';
import i18n from '@src/i18n';
import ForeignHandAnnotationDialog from '@src/components/editor/letter/Dialog/Components/ForeignHandAnnotationDialog';
import editorLetterReducer, { setLetterReference } from '@src/redux/slices/editor.letter.slice';
import { EditorConstants } from '@src/constants/editor';
import { getMenuItemsNoMarking } from '@src/constants/menuItems';
import { searchEditortEntities } from '@src/services/editor/apiLetterRequest.service';
import type { SnippetEntity } from '@src/services/mappings/autoAnnoMappings';

jest.mock('@src/services/editor/apiLetterRequest.service', () => ({
  searchEditortEntities: jest.fn(),
}));

const mockSearchEditorEntities = searchEditortEntities as jest.MockedFunction<typeof searchEditortEntities>;
const person: SnippetEntity = {
  entityId: 1,
  entityType: 'person',
  entityKey: 'PSN0000001',
  entityName: 'Doe, Jane',
  entityDisplayName: 'Doe, Jane',
  extraData: {},
};

const parseXml = (content: string) =>
  new DOMParser().parseFromString(
    `<TEI xmlns="${EditorConstants.TEI_NS}"><text><body><div><p>${content}</p></div></body></text></TEI>`,
    'application/xml',
  );

const buildStore = (elementXmlId: string, elementKey: string) => {
  const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
  store.dispatch(
    setLetterReference({
      letterReference: { elementType: 'note', elementXmlId, elementKey },
    }),
  );
  return store;
};

const chooseOption = (label: string, option: string) => {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: label }));
  fireEvent.click(screen.getByRole('option', { name: option }));
};

describe('ForeignHandAnnotationDialog', () => {
  beforeAll(() => void i18n.changeLanguage('de'));
  beforeEach(() => {
    mockSearchEditorEntities.mockResolvedValue([person]);
  });

  it('loads and stores a named writer from the JWT person search', async () => {
    const xmlDoc = parseXml('Alpha Beta');
    const onSave = jest.fn();
    render(
      <Provider store={buildStore('0.0.0.0', 'caret:0:5')}>
        <ForeignHandAnnotationDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    chooseOption('Urhebertyp', 'Bekannter Schreiber');
    await waitFor(() => expect(mockSearchEditorEntities).toHaveBeenCalledWith(null, 'PERSON'));
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Schreiber auswählen' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Doe, Jane' }));
    chooseOption('Position', 'Im Randbereich');
    fireEvent.change(screen.getByRole('textbox', { name: 'Anmerkungstext' }), {
      target: { value: 'Notiz' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Anmerkung einfügen' }));

    const note = xmlDoc.querySelector('note')!;
    expect(note.getAttribute('type')).toBe('note');
    expect(note.getAttribute('subtype')).toBe('name');
    expect(note.getAttribute('place')).toBe('margin');
    expect(note.getAttribute('resp')).toBe('#PSN0000001');
    expect(note.getAttribute('n')).toBe('1');
    expect(note.textContent).toBe('Notiz');
    expect(onSave).toHaveBeenCalledWith(
      xmlDoc,
      EditorConstants.changeTypes.note.ADDED,
      'Die Anmerkung wurde hinzugefügt.',
      note.getAttribute('xml:id'),
    );
  });

  it('searches the JWT person index with the entered writer name', async () => {
    const xmlDoc = parseXml('Alpha Beta');
    render(
      <Provider store={buildStore('0.0.0.0', 'caret:0:5')}>
        <ForeignHandAnnotationDialog xmlDoc={xmlDoc} onSave={jest.fn()} onClose={jest.fn()} />
      </Provider>,
    );

    chooseOption('Urhebertyp', 'Bekannter Schreiber');
    await waitFor(() => expect(mockSearchEditorEntities).toHaveBeenCalledWith(null, 'PERSON'));
    mockSearchEditorEntities.mockClear();

    fireEvent.change(screen.getByRole('combobox', { name: 'Schreiber auswählen' }), {
      target: { value: 'Mendelssohn' },
    });

    await waitFor(() => expect(mockSearchEditorEntities).toHaveBeenCalledWith('Mendelssohn', 'PERSON'));
  });

  it('reconstructs, updates and deletes an existing annotation while preserving its id', () => {
    const xmlDoc = parseXml('<note xml:id="note_existing" type="note" subtype="receiver" place="opposite" n="3">Alter Text</note>');
    const onSave = jest.fn();
    const { rerender } = render(
      <Provider store={buildStore('note_existing', 'edit')}>
        <ForeignHandAnnotationDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    expect(screen.getByRole('combobox', { name: 'Urhebertyp' })).toHaveTextContent('Empfänger');
    expect(screen.getByRole('combobox', { name: 'Position' })).toHaveTextContent('Auf der gegenüberliegenden bzw. Vorderseite');
    expect(screen.getByRole('textbox', { name: 'Nummer' })).toHaveValue('3');
    fireEvent.change(screen.getByRole('textbox', { name: 'Anmerkungstext' }), {
      target: { value: 'Neuer Text' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aktualisieren' }));

    expect(xmlDoc.querySelector('note')?.getAttribute('xml:id')).toBe('note_existing');
    expect(xmlDoc.querySelector('note')?.textContent).toBe('Neuer Text');

    onSave.mockClear();
    rerender(
      <Provider store={buildStore('note_existing', 'edit')}>
        <ForeignHandAnnotationDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }));
    expect(xmlDoc.querySelector('note')).toBeNull();
    expect(onSave).toHaveBeenCalledWith(xmlDoc, EditorConstants.changeTypes.note.REMOVED, 'Die Anmerkung wurde gelöscht.', null);
  });

  it('routes an existing type=note element to the foreign-hand editor', async () => {
    const xmlDoc = parseXml('<note xml:id="note_existing" type="note" subtype="anonymus" place="bottom" n="1">Text</note>');
    const store = buildStore('', '');
    const editItem = getMenuItemsNoMarking(store.dispatch, store.getState().editorLetter.letter, {
      current: xmlDoc,
    }).find((item) => item.identifier === EditorConstants.menuItemTypes.WRITING_ACT.EDIT_NOTE);

    await editItem?.action?.({ node: xmlDoc.querySelector('note')! });

    expect(store.getState().editorLetter.dialogType).toBe(EditorConstants.dialogTypes.FOREIGN_HAND_ANNOTATION);
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'note',
      elementXmlId: 'note_existing',
      elementKey: 'edit',
    });
  });

  it('shows unknown existing metadata without silently replacing it', () => {
    const xmlDoc = parseXml(
      '<note xml:id="note_legacy" type="note" subtype="legacy-writer" place="legacy-place" n="A" resp="Legacy">Text</note>',
    );
    render(
      <Provider store={buildStore('note_legacy', 'edit')}>
        <ForeignHandAnnotationDialog xmlDoc={xmlDoc} onSave={jest.fn()} onClose={jest.fn()} />
      </Provider>,
    );

    expect(screen.getByRole('combobox', { name: 'Urhebertyp' })).toHaveTextContent('Unbekannter Bestandswert: legacy-writer');
    expect(screen.getByRole('combobox', { name: 'Position' })).toHaveTextContent('Unbekannter Bestandswert: legacy-place');
    expect(screen.getByRole('textbox', { name: 'Nummer' })).toHaveValue('A');
  });
});
