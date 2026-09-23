import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import '@src/i18n';
import i18n from '@src/i18n';
import ListStructureDialog from '@src/components/editor/letter/Dialog/Components/ListStructureDialog';
import editorLetterReducer, { setLetterReference } from '@src/redux/slices/editor.letter.slice';
import { EditorConstants } from '@src/constants/editor';

const parseXml = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml');

const buildStore = (elementXmlId: string, elementKey: string) => {
  const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
  store.dispatch(
    setLetterReference({
      letterReference: { elementType: 'list', elementXmlId, elementKey },
    }),
  );
  return store;
};

describe('ListStructureDialog', () => {
  beforeAll(() => {
    void i18n.changeLanguage('de');
  });

  it('adds a list item to the selected list', () => {
    const xmlDoc = parseXml('<TEI><text><body><div><list type="ordered"><item>First</item></list></div></body></text></TEI>');
    const store = buildStore('0.0.0.0', 'list-add-item');
    const onSave = jest.fn();

    render(
      <Provider store={store}>
        <ListStructureDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Text des Listeneintrags' }), {
      target: { value: 'Second' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Änderung übernehmen' }));

    expect(Array.from(xmlDoc.querySelectorAll('item')).map((item) => item.textContent)).toEqual(['First', 'Second']);
    expect(onSave).toHaveBeenCalledWith(xmlDoc, EditorConstants.changeTypes.misc.BODY_STRUCTURE_CHANGED, expect.any(String));
  });

  it('converts a marked selection without requiring a source path', () => {
    const xmlDoc = parseXml('<TEI><text><body><div><p>Before <span class="marked">Selected</span> after</p></div></body></text></TEI>');
    const store = buildStore('', 'list-selection-unordered');
    const onSave = jest.fn();

    render(
      <Provider store={store}>
        <ListStructureDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Änderung übernehmen' }));

    expect(xmlDoc.querySelector('list')?.getAttribute('type')).toBe('unordered');
    expect(xmlDoc.querySelector('item')?.textContent).toBe('Selected');
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('prefills and updates the selected list item', () => {
    const xmlDoc = parseXml('<TEI><text><body><div><list><item>First</item></list></div></body></text></TEI>');
    const store = buildStore('0.0.0.0.0', 'list-edit-item');
    const onSave = jest.fn();

    render(
      <Provider store={store}>
        <ListStructureDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    const input = screen.getByRole('textbox', { name: 'Text des Listeneintrags' });
    expect(input).toHaveValue('First');
    fireEvent.change(input, { target: { value: 'Updated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Änderung übernehmen' }));

    expect(xmlDoc.querySelector('item')?.textContent).toBe('Updated');
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('deletes the selected list after confirmation', () => {
    const xmlDoc = parseXml('<TEI><text><body><div><list><item>First</item></list></div></body></text></TEI>');
    const store = buildStore('0.0.0.0', 'list-delete');
    const onSave = jest.fn();

    render(
      <Provider store={store}>
        <ListStructureDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Löschen' }));

    expect(xmlDoc.querySelector('list')).toBeNull();
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
