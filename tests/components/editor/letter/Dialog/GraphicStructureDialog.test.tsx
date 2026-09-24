import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import '@src/i18n';
import i18n from '@src/i18n';
import GraphicStructureDialog from '@src/components/editor/letter/Dialog/Components/GraphicStructureDialog';
import editorLetterReducer, { setLetterReference } from '@src/redux/slices/editor.letter.slice';

const parseXml = (content = '<p xml:id="p_1">Text</p>') =>
  new DOMParser().parseFromString(`<TEI><teiHeader/><text><body><div>${content}</div></body></text></TEI>`, 'application/xml');

const buildStore = (elementXmlId: string, elementKey: string) => {
  const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
  store.dispatch(setLetterReference({ letterReference: { elementType: 'p', elementXmlId, elementKey } }));
  return store;
};

describe('GraphicStructureDialog', () => {
  beforeAll(() => {
    void i18n.changeLanguage('de');
  });

  it('creates a block graphic through the form', () => {
    const xmlDoc = parseXml();
    const onSave = jest.fn();
    const store = buildStore('1.0.0.0', 'graphic-block');
    render(
      <Provider store={store}>
        <GraphicStructureDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    fireEvent.change(screen.getByLabelText(/Grafikreferenz/), {
      target: { value: 'file:/images/drawing.svg' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Änderung übernehmen' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const figure = xmlDoc.querySelector('figure')!;
    expect(figure.parentElement?.localName).toBe('div');
    expect(figure.getAttribute('rend')).toBe('inline_big_size');
    expect(figure.querySelector('graphic')?.getAttribute('url')).toBe('file:/images/drawing.svg');
  });

  it('adds a rectangular area to an existing figure image map', () => {
    const xmlDoc = parseXml('<figure xml:id="figure_1"><graphic url="file:/images/drawing.png"/></figure>');
    const onSave = jest.fn();
    const store = buildStore('1.0.0.0', 'image-map-edit');
    render(
      <Provider store={store}>
        <GraphicStructureDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Bildbereich hinzufügen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Änderung übernehmen' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(xmlDoc.querySelector('figure')?.getAttribute('facs')).toMatch(/^#surface_graphic_/);
    expect(xmlDoc.querySelector('facsimile surface zone')?.getAttribute('xml:id')).toBe('zone_1');
  });
});
