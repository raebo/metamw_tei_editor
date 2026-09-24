import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import '@src/i18n';
import i18n from '@src/i18n';
import AddNoteDialog from '@src/components/editor/letter/Dialog/Components/AddNoteDialog';
import EditNoteDialog from '@src/components/editor/letter/Dialog/Components/EditNoteDialog';
import authenticationReducer, { setLoginState } from '@src/redux/slices/authentication.slice';
import editorLetterReducer, { setLetterReference } from '@src/redux/slices/editor.letter.slice';
import { EditorConstants } from '@src/constants/editor';

const parseXml = (body: string) =>
  new DOMParser().parseFromString(
    `<TEI xmlns="${EditorConstants.TEI_NS}"><text><body><div><p>${body}</p></div></body></text></TEI>`,
    'application/xml',
  );

const buildStore = (elementXmlId = '') => {
  const store = configureStore({
    reducer: { auth: authenticationReducer, editorLetter: editorLetterReducer },
  });
  store.dispatch(
    setLoginState({
      user: { id: 1, login: 'tester@example.org', firstName: '', lastName: '' },
    }),
  );
  store.dispatch(
    setLetterReference({
      letterReference: { elementType: 'note', elementXmlId, elementKey: null },
    }),
  );
  return store;
};

const chooseOption = (label: string, option: string) => {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: label }));
  fireEvent.click(screen.getByRole('option', { name: option }));
};

describe('comment dialogs', () => {
  beforeAll(() => {
    void i18n.changeLanguage('de');
  });

  it('creates a translation with the selected language', () => {
    const xmlDoc = parseXml('<span class="marked">Texte français</span>');
    const onSave = jest.fn();

    render(
      <Provider store={buildStore()}>
        <AddNoteDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    chooseOption('Kommentarart', 'Übersetzung');
    chooseOption('Kommentarsprache', 'Deutsch');
    fireEvent.change(screen.getByRole('textbox', { name: 'Kommentartext' }), {
      target: { value: 'Deutsche Übersetzung' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Kommentar einfügen' }));

    const note = xmlDoc.querySelector('note');
    expect(note?.getAttribute('type')).toBe('translation');
    expect(note?.getAttribute('xml:lang')).toBe('de');
    expect(note?.getAttribute('resp')).toBe('tester@example.org');
    expect(note?.textContent).toBe('Deutsche Übersetzung');
    expect(onSave).toHaveBeenCalledWith(
      xmlDoc,
      EditorConstants.changeTypes.note.ADDED,
      'Der Kommentar wurde hinzugefügt.',
      note?.getAttribute('xml:id'),
    );
  });

  it('shows and safely preserves unknown existing metadata while editing', () => {
    const xmlDoc = parseXml('<note xml:id="note_legacy" type="legacy-comment" xml:lang="x-legacy" resp="AB">Old</note>');
    const onSave = jest.fn();

    render(
      <Provider store={buildStore('note_legacy')}>
        <EditNoteDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    expect(screen.getByRole('combobox', { name: 'Kommentarart' })).toHaveTextContent('Unbekannter Bestandswert: legacy-comment');
    expect(screen.getByRole('combobox', { name: 'Kommentarsprache' })).toHaveTextContent('Unbekannter Bestandswert: x-legacy');
    expect(screen.getByRole('textbox', { name: 'Verantwortlichkeit' })).toHaveValue('AB');

    fireEvent.change(screen.getByRole('textbox', { name: 'Kommentartext' }), {
      target: { value: '<script>alert(1)</script>Updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aktualisieren' }));

    const note = xmlDoc.querySelector('note');
    expect(note?.querySelector('script')).toBeNull();
    expect(note?.textContent).toBe('<script>alert(1)</script>Updated');
    expect(note?.getAttribute('xml:id')).toBe('note_legacy');
    expect(note?.getAttribute('resp')).toBe('AB');
    expect(note?.getAttribute('type')).toBe('legacy-comment');
    expect(note?.getAttribute('xml:lang')).toBe('x-legacy');
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('requires confirmation before deleting an existing comment', () => {
    const xmlDoc = parseXml('<note xml:id="note_delete" type="these_comment" xml:lang="de" resp="AB">Delete me</note>');
    const onSave = jest.fn();

    render(
      <Provider store={buildStore('note_delete')}>
        <EditNoteDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    expect(xmlDoc.querySelector('note')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }));

    expect(xmlDoc.querySelector('note')).toBeNull();
    expect(onSave).toHaveBeenCalledWith(xmlDoc, EditorConstants.changeTypes.note.REMOVED, 'Der Kommentar wurde gelöscht.', null);
  });
});
