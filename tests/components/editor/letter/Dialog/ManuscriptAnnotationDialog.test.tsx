import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import '@src/i18n';
import i18n from '@src/i18n';
import ManuscriptAnnotationDialog from '@src/components/editor/letter/Dialog/Components/ManuscriptAnnotationDialog';
import editorLetterReducer, { setLetterReference } from '@src/redux/slices/editor.letter.slice';
import { EditorConstants } from '@src/constants/editor';

const parseXml = (content: string): XMLDocument =>
  new DOMParser().parseFromString(`<TEI xmlns="${EditorConstants.TEI_NS}">${content}</TEI>`, 'application/xml');

const buildStore = (elementXmlId: string, elementKey: 'create' | 'edit' | 'delete') => {
  const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
  store.dispatch(
    setLetterReference({
      letterReference: { elementType: 'p', elementXmlId, elementKey },
    }),
  );
  return store;
};

describe('ManuscriptAnnotationDialog', () => {
  beforeAll(() => void i18n.changeLanguage('de'));

  it('creates an annotation and the missing header structure', () => {
    const xmlDoc = parseXml('<text/>');
    const onSave = jest.fn();
    render(
      <Provider store={buildStore('', 'create')}>
        <ManuscriptAnnotationDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    const saveButton = screen.getByRole('button', { name: 'Anmerkung hinzufügen' });
    expect(saveButton).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Anmerkungstext' }), {
      target: { value: 'Papier mit Wasserzeichen' },
    });
    fireEvent.click(saveButton);

    const annotation = xmlDoc.querySelector('scriptDesc > p');
    expect(annotation?.textContent).toBe('Papier mit Wasserzeichen');
    expect(annotation?.getAttribute('xml:id')).toMatch(/^script_annotation_/);
    expect(onSave).toHaveBeenCalledWith(
      xmlDoc,
      EditorConstants.changeTypes.misc.HEADER_MANUSCRIPT_ANNOTATION_ADDED,
      'Die Handschriftenanmerkung wurde hinzugefügt.',
      annotation?.getAttribute('xml:id'),
    );
  });

  it('loads and updates an existing annotation without changing its id', () => {
    const xmlDoc = parseXml(
      '<teiHeader><fileDesc><sourceDesc><msDesc><physDesc><scriptDesc><p xml:id="script_annotation_1">Alt</p></scriptDesc></physDesc></msDesc></sourceDesc></fileDesc></teiHeader>',
    );
    const onSave = jest.fn();
    render(
      <Provider store={buildStore('script_annotation_1', 'edit')}>
        <ManuscriptAnnotationDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    const field = screen.getByRole('textbox', { name: 'Anmerkungstext' });
    expect(field).toHaveValue('Alt');
    fireEvent.change(field, { target: { value: 'Neu' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aktualisieren' }));

    expect(xmlDoc.querySelector('scriptDesc > p')?.textContent).toBe('Neu');
    expect(xmlDoc.querySelector('scriptDesc > p')?.getAttribute('xml:id')).toBe('script_annotation_1');
    expect(onSave).toHaveBeenCalledWith(
      xmlDoc,
      EditorConstants.changeTypes.misc.HEADER_MANUSCRIPT_ANNOTATION_CHANGED,
      'Die Handschriftenanmerkung wurde aktualisiert.',
      'script_annotation_1',
    );
  });

  it('deletes only the selected annotation after confirmation', () => {
    const xmlDoc = parseXml(
      '<teiHeader><fileDesc><sourceDesc><msDesc><physDesc><scriptDesc><p xml:id="script_annotation_1">One</p><p xml:id="script_annotation_2">Two</p></scriptDesc></physDesc></msDesc></sourceDesc></fileDesc></teiHeader>',
    );
    const onSave = jest.fn();
    render(
      <Provider store={buildStore('script_annotation_1', 'delete')}>
        <ManuscriptAnnotationDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }));

    expect(xmlDoc.querySelector('[xml\\:id="script_annotation_1"]')).toBeNull();
    expect(xmlDoc.querySelector('[xml\\:id="script_annotation_2"]')?.textContent).toBe('Two');
    expect(onSave).toHaveBeenCalledWith(
      xmlDoc,
      EditorConstants.changeTypes.misc.HEADER_MANUSCRIPT_ANNOTATION_REMOVED,
      'Die Handschriftenanmerkung wurde gelöscht.',
      null,
    );
  });

  it('removes the empty script description after deleting the last annotation', () => {
    const xmlDoc = parseXml(
      '<teiHeader><fileDesc><sourceDesc><msDesc><physDesc><scriptDesc><p xml:id="script_annotation_1">One</p></scriptDesc></physDesc></msDesc></sourceDesc></fileDesc></teiHeader>',
    );
    render(
      <Provider store={buildStore('script_annotation_1', 'delete')}>
        <ManuscriptAnnotationDialog xmlDoc={xmlDoc} onSave={jest.fn()} onClose={jest.fn()} />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }));

    expect(xmlDoc.querySelector('scriptDesc')).toBeNull();
    expect(xmlDoc.querySelector('physDesc')).not.toBeNull();
  });
});
