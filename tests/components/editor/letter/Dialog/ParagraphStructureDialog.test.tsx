import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import '@src/i18n';
import i18n from '@src/i18n';
import ParagraphStructureDialog from '@src/components/editor/letter/Dialog/Components/ParagraphStructureDialog';
import editorLetterReducer, { setLetterReference } from '@src/redux/slices/editor.letter.slice';
import { EditorConstants } from '@src/constants/editor';

const parseXml = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml');

const buildStore = (elementXmlId: string, elementKey: string) => {
  const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
  store.dispatch(
    setLetterReference({
      letterReference: { elementType: 'p', elementXmlId, elementKey },
    }),
  );
  return store;
};

describe('ParagraphStructureDialog', () => {
  beforeAll(() => {
    void i18n.changeLanguage('de');
  });

  it('inserts a selected paragraph variant after the source paragraph', () => {
    const xmlDoc = parseXml('<TEI><text><body><div><p>First</p></div></body></text></TEI>');
    const store = buildStore('0.0.0.0', 'paragraph-insert');
    const onSave = jest.fn();

    render(
      <Provider store={store}>
        <ParagraphStructureDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Absatzvariante' }));
    fireEvent.click(screen.getByRole('option', { name: 'Absatz rechtsbündig' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Absatztext' }), {
      target: { value: 'Second' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Änderung übernehmen' }));

    const paragraphs = Array.from(xmlDoc.querySelectorAll('p'));
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[1]?.getAttribute('style')).toBe('paragraph_right');
    expect(paragraphs[1]?.textContent).toBe('Second');
    expect(onSave).toHaveBeenCalledWith(xmlDoc, EditorConstants.changeTypes.misc.BODY_STRUCTURE_CHANGED, expect.any(String));
  });

  it('splits the marked selection without requiring a source path', () => {
    const xmlDoc = parseXml('<TEI><text><body><div><p>Before <span class="marked">Selected</span> after</p></div></body></text></TEI>');
    const store = buildStore('', 'paragraph-split');
    const onSave = jest.fn();

    render(
      <Provider store={store}>
        <ParagraphStructureDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Änderung übernehmen' }));

    expect(Array.from(xmlDoc.querySelectorAll('p')).map((paragraph) => paragraph.textContent)).toEqual(['Before ', 'Selected', ' after']);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
