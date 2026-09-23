import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import '@src/i18n';
import i18n from '@src/i18n';
import TableStructureDialog from '@src/components/editor/letter/Dialog/Components/TableStructureDialog';
import editorLetterReducer, { setLetterReference } from '@src/redux/slices/editor.letter.slice';
import { EditorConstants } from '@src/constants/editor';

const parseXml = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml');

const buildStore = (elementXmlId: string, elementKey: string) => {
  const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
  store.dispatch(
    setLetterReference({
      letterReference: { elementType: 'table', elementXmlId, elementKey },
    }),
  );
  return store;
};

describe('TableStructureDialog', () => {
  beforeAll(() => {
    void i18n.changeLanguage('de');
  });

  it('creates a table with the requested row and column counts', () => {
    const xmlDoc = parseXml('<TEI><text><body><div><p>Anchor</p></div></body></text></TEI>');
    const store = buildStore('0.0.0.0', 'table-create');
    const onSave = jest.fn();

    render(
      <Provider store={store}>
        <TableStructureDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Anzahl Zeilen' }), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Anzahl Spalten' }), {
      target: { value: '4' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Änderung übernehmen' }));

    const table = xmlDoc.querySelector('table');
    expect(table?.getAttribute('rows')).toBe('3');
    expect(table?.getAttribute('cols')).toBe('4');
    expect(table?.querySelectorAll('row')).toHaveLength(3);
    expect(table?.querySelectorAll('cell')).toHaveLength(12);
    expect(onSave).toHaveBeenCalledWith(xmlDoc, EditorConstants.changeTypes.misc.BODY_STRUCTURE_CHANGED, expect.any(String));
  });

  it('sorts a table using the configured column and direction', () => {
    const xmlDoc = parseXml(
      '<TEI><text><body><div><table><row><cell>B</cell></row><row><cell>A</cell></row></table></div></body></text></TEI>',
    );
    const store = buildStore('0.0.0.0', 'table-sort');
    const onSave = jest.fn();

    render(
      <Provider store={store}>
        <TableStructureDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Änderung übernehmen' }));

    expect(Array.from(xmlDoc.querySelectorAll('row')).map((row) => row.textContent)).toEqual(['A', 'B']);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('edits the selected table cell text', () => {
    const xmlDoc = parseXml('<TEI><text><body><div><table><row><cell>Old value</cell></row></table></div></body></text></TEI>');
    const store = buildStore('0.0.0.0.0.0', 'table-cell-edit');
    const onSave = jest.fn();

    render(
      <Provider store={store}>
        <TableStructureDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Text der Tabellenzelle' }), {
      target: { value: 'New value' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Änderung übernehmen' }));

    expect(xmlDoc.querySelector('cell')?.textContent).toBe('New value');
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('uses the generic join action with the selected direction', () => {
    const xmlDoc = parseXml('<TEI><text><body><div><table><row><cell>A</cell><cell>B</cell></row></table></div></body></text></TEI>');
    const store = buildStore('0.0.0.0.0.0', 'table-join');
    const onSave = jest.fn();

    render(
      <Provider store={store}>
        <TableStructureDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Änderung übernehmen' }));

    const cell = xmlDoc.querySelector('cell');
    expect(xmlDoc.querySelectorAll('cell')).toHaveLength(1);
    expect(cell?.getAttribute('cols')).toBe('2');
    expect(cell?.textContent).toBe('A B');
  });

  it('deletes the complete selected table', () => {
    const xmlDoc = parseXml('<TEI><text><body><div><table><row><cell>A</cell></row></table></div></body></text></TEI>');
    const store = buildStore('0.0.0.0', 'table-delete');
    const onSave = jest.fn();

    render(
      <Provider store={store}>
        <TableStructureDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tabelle löschen' }));

    expect(xmlDoc.querySelector('table')).toBeNull();
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
