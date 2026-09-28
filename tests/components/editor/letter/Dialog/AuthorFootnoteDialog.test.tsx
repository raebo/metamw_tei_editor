import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import '@src/i18n';
import i18n from '@src/i18n';
import AuthorFootnoteDialog from '@src/components/editor/letter/Dialog/Components/AuthorFootnoteDialog';
import editorLetterReducer, { setLetterReference } from '@src/redux/slices/editor.letter.slice';
import { EditorConstants } from '@src/constants/editor';

const parseXml = (content: string): XMLDocument =>
  new DOMParser().parseFromString(`<TEI xmlns="${EditorConstants.TEI_NS}">${content}</TEI>`, 'application/xml');

const buildStore = (elementXmlId: string, elementKey: string) => {
  const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
  store.dispatch(
    setLetterReference({
      letterReference: { elementType: 'p', elementXmlId, elementKey },
    }),
  );
  return store;
};

describe('AuthorFootnoteDialog', () => {
  beforeAll(() => void i18n.changeLanguage('de'));

  it('creates a linked reference and footnote with automatic numbering', () => {
    const xmlDoc = parseXml('<text><body><div><p>Alpha Beta</p></div></body></text>');
    const onSave = jest.fn();
    render(
      <Provider store={buildStore('0.0.0.0', 'caret:0:5')}>
        <AuthorFootnoteDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    const saveButton = screen.getByRole('button', { name: 'Fußnote einfügen' });
    expect(saveButton).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Fußnotentext' }), {
      target: { value: 'Text der Fußnote' },
    });
    fireEvent.click(saveButton);

    const note = xmlDoc.querySelector('note[type="footnote"]');
    const reference = xmlDoc.querySelector('ref[type="Footnotes_reference"]');
    expect(note?.textContent).toBe('Text der Fußnote');
    expect(note?.getAttribute('n')).toBe('1');
    expect(reference?.textContent).toBe('1');
    expect(reference?.getAttribute('target')).toBe(`#${note?.getAttribute('xml:id')}`);
    expect(onSave).toHaveBeenCalledWith(
      xmlDoc,
      EditorConstants.changeTypes.misc.BODY_AUTHOR_FOOTNOTE_ADDED,
      'Die Fußnote und ihre Referenz wurden hinzugefügt.',
      note?.getAttribute('xml:id'),
    );
  });

  it('loads and updates content and diplomatic marker on both sides', () => {
    const xmlDoc = parseXml(
      '<text><body><div><p>Text<ref type="Footnotes_reference" xml:id="fnr1" target="#fn1">1</ref></p></div><div type="footnotes_area"><note type="footnote" subtype="author" xml:id="fn1" target="fnr1" n="1">Old</note></div></body></text>',
    );
    const onSave = jest.fn();
    render(
      <Provider store={buildStore('fn1', 'edit')}>
        <AuthorFootnoteDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Fußnotenzeichen (optional)' }), {
      target: { value: '*' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Fußnotentext' }), {
      target: { value: 'New' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aktualisieren' }));

    expect(xmlDoc.querySelector('note')?.textContent).toBe('New');
    expect(xmlDoc.querySelector('note')?.getAttribute('n')).toBe('*');
    expect(xmlDoc.querySelector('ref')?.textContent).toBe('*');
    expect(onSave).toHaveBeenCalledWith(
      xmlDoc,
      EditorConstants.changeTypes.misc.BODY_AUTHOR_FOOTNOTE_CHANGED,
      'Die Fußnote und ihre Referenz wurden aktualisiert.',
      'fn1',
    );
  });

  it('deletes the linked pair immediately from delete context mode', () => {
    const xmlDoc = parseXml(
      '<text><body><div><p>Text<ref type="Footnotes_reference" xml:id="fnr1" target="#fn1">1</ref></p></div><div type="footnotes_area"><note type="footnote" subtype="author" xml:id="fn1" target="fnr1" n="1">Old</note></div></body></text>',
    );
    const onSave = jest.fn();
    render(
      <Provider store={buildStore('fn1', 'delete')}>
        <AuthorFootnoteDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }));

    expect(xmlDoc.querySelector('note')).toBeNull();
    expect(xmlDoc.querySelector('ref')).toBeNull();
    expect(xmlDoc.querySelector('div[type="footnotes_area"]')).toBeNull();
    expect(onSave).toHaveBeenCalledWith(
      xmlDoc,
      EditorConstants.changeTypes.misc.BODY_AUTHOR_FOOTNOTE_REMOVED,
      'Die Fußnote und ihre Referenz wurden gelöscht.',
      null,
    );
  });

  it('reports a defective reference without changing the XML', () => {
    const xmlDoc = parseXml(
      '<text><body><div><p>Text</p></div><div type="footnotes_area"><note type="footnote" xml:id="fn1" target="missing" n="1">Old</note></div></body></text>',
    );
    render(
      <Provider store={buildStore('fn1', 'edit')}>
        <AuthorFootnoteDialog xmlDoc={xmlDoc} onSave={jest.fn()} onClose={jest.fn()} />
      </Provider>,
    );

    expect(screen.getAllByRole('alert')[1]).toHaveTextContent('missing or defective');
    expect(xmlDoc.querySelector('note')?.textContent).toBe('Old');
  });
});
