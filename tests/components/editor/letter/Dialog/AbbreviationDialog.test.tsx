import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import '@src/i18n';
import i18n from '@src/i18n';
import AbbreviationDialog from '@src/components/editor/letter/Dialog/Components/AbbreviationDialog';
import editorLetterReducer, { setLetterReference } from '@src/redux/slices/editor.letter.slice';
import { EditorConstants } from '@src/constants/editor';

const parseXml = (content: string): XMLDocument =>
  new DOMParser().parseFromString(`<TEI xmlns="${EditorConstants.TEI_NS}">${content}</TEI>`, 'application/xml');

const buildStore = (elementXmlId: string, elementKey: string) => {
  const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
  store.dispatch(
    setLetterReference({
      letterReference: { elementType: 'choice', elementXmlId, elementKey },
    }),
  );
  return store;
};

describe('AbbreviationDialog', () => {
  beforeAll(() => void i18n.changeLanguage('de'));

  it('creates an abbreviation with its expanded form', () => {
    const xmlDoc = parseXml('<text><body><div><p><span class="marked">Ch</span></p></div></body></text>');
    const onSave = jest.fn();
    render(
      <Provider store={buildStore('', 'create')}>
        <AbbreviationDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Vollform oder Übersetzung der Abkürzung' }), {
      target: { value: 'Church' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Abkürzung auszeichnen' }));

    const choice = xmlDoc.querySelector('choice');
    expect(choice?.querySelector('abbr')?.textContent).toBe('Ch');
    expect(choice?.querySelector('expan')?.textContent).toBe('"Church"');
    expect(onSave).toHaveBeenCalledWith(
      xmlDoc,
      EditorConstants.changeTypes.misc.BODY_ABBREVIATION_ADDED,
      'Die Abkürzung wurde ausgezeichnet.',
      choice?.getAttribute('xml:id'),
    );
  });

  it('loads, updates and removes an existing abbreviation without exposing its expansion', () => {
    const xmlDoc = parseXml(
      '<text><body><div><p><choice xml:id="choice_1"><abbr>Ch</abbr><expan style="hidden">"Church"</expan></choice></p></div></body></text>',
    );
    const { unmount } = render(
      <Provider store={buildStore('choice_1', 'edit')}>
        <AbbreviationDialog xmlDoc={xmlDoc} onSave={jest.fn()} onClose={jest.fn()} />
      </Provider>,
    );
    const field = screen.getByRole('textbox', { name: 'Vollform oder Übersetzung der Abkürzung' });
    expect(field).toHaveValue('Church');
    fireEvent.change(field, { target: { value: 'Chapel' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aktualisieren' }));
    expect(xmlDoc.querySelector('expan')?.textContent).toBe('"Chapel"');
    unmount();

    render(
      <Provider store={buildStore('choice_1', 'delete')}>
        <AbbreviationDialog xmlDoc={xmlDoc} onSave={jest.fn()} onClose={jest.fn()} />
      </Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }));
    expect(xmlDoc.querySelector('choice')).toBeNull();
    expect(xmlDoc.querySelector('p')?.textContent).toBe('Ch');
  });
});
