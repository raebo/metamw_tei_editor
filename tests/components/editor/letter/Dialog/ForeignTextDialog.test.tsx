import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import '@src/i18n';
import i18n from '@src/i18n';
import ForeignTextDialog from '@src/components/editor/letter/Dialog/Components/ForeignTextDialog';
import editorLetterReducer, { setLetterReference } from '@src/redux/slices/editor.letter.slice';
import { EditorConstants } from '@src/constants/editor';

const parseXml = (content: string): XMLDocument =>
  new DOMParser().parseFromString(`<TEI xmlns="${EditorConstants.TEI_NS}">${content}</TEI>`, 'application/xml');

const buildStore = (elementXmlId: string, elementKey: string) => {
  const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
  store.dispatch(
    setLetterReference({
      letterReference: { elementType: 'foreign', elementXmlId, elementKey },
    }),
  );
  return store;
};

describe('ForeignTextDialog', () => {
  beforeAll(() => void i18n.changeLanguage('de'));

  it('wraps a marked selection with the selected language', () => {
    const xmlDoc = parseXml('<text><body><div><p><span class="marked">bonjour</span></p></div></body></text>');
    const onSave = jest.fn();
    render(
      <Provider store={buildStore('', 'create')}>
        <ForeignTextDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Sprache' }));
    fireEvent.click(screen.getByRole('option', { name: 'Spanisch (es)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Auszeichnung einfügen' }));

    const foreign = xmlDoc.querySelector('foreign');
    expect(foreign?.getAttribute('xml:lang')).toBe('es');
    expect(foreign?.textContent).toBe('bonjour');
    expect(onSave).toHaveBeenCalledWith(
      xmlDoc,
      EditorConstants.changeTypes.misc.BODY_FOREIGN_TEXT_ADDED,
      'Der fremdsprachige Text wurde ausgezeichnet.',
      foreign?.getAttribute('xml:id'),
    );
  });

  it('offers the fixed Oxygen language selection instead of free text', () => {
    const xmlDoc = parseXml('<text><body><div><p><span class="marked">bonjour</span></p></div></body></text>');
    render(
      <Provider store={buildStore('', 'create')}>
        <ForeignTextDialog xmlDoc={xmlDoc} onSave={jest.fn()} onClose={jest.fn()} />
      </Provider>,
    );

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Sprache' }));
    expect(screen.getAllByRole('option')).toHaveLength(7);
    expect(screen.getByRole('option', { name: 'Französisch (fr)' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /de-CH/ })).not.toBeInTheDocument();
  });

  it('updates and removes existing markup without deleting its text', () => {
    const xmlDoc = parseXml('<text><body><div><p><foreign xml:id="foreign_1" xml:lang="fr">bonjour</foreign></p></div></body></text>');
    const { unmount } = render(
      <Provider store={buildStore('foreign_1', 'edit')}>
        <ForeignTextDialog xmlDoc={xmlDoc} onSave={jest.fn()} onClose={jest.fn()} />
      </Provider>,
    );
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Sprache' }));
    fireEvent.click(screen.getByRole('option', { name: 'Italienisch (it)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aktualisieren' }));
    expect(xmlDoc.querySelector('foreign')?.getAttribute('xml:lang')).toBe('it');
    unmount();

    render(
      <Provider store={buildStore('foreign_1', 'delete')}>
        <ForeignTextDialog xmlDoc={xmlDoc} onSave={jest.fn()} onClose={jest.fn()} />
      </Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }));
    expect(xmlDoc.querySelector('foreign')).toBeNull();
    expect(xmlDoc.querySelector('p')?.textContent).toBe('bonjour');
  });

  it('keeps an existing language outside the fixed selection visible and editable', () => {
    const xmlDoc = parseXml(
      '<text><body><div><p><foreign xml:id="foreign_legacy" xml:lang="de-CH">Grüezi</foreign></p></div></body></text>',
    );
    render(
      <Provider store={buildStore('foreign_legacy', 'edit')}>
        <ForeignTextDialog xmlDoc={xmlDoc} onSave={jest.fn()} onClose={jest.fn()} />
      </Provider>,
    );

    expect(screen.getByRole('combobox', { name: 'Sprache' })).toHaveTextContent('Bestandswert: de-CH');
    fireEvent.click(screen.getByRole('button', { name: 'Aktualisieren' }));
    expect(xmlDoc.querySelector('foreign')?.getAttribute('xml:lang')).toBe('de-CH');
  });
});
