import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import '@src/i18n';
import HorizontalFractionDialog from '@src/components/editor/letter/Dialog/Components/HorizontalFractionDialog';
import i18n from '@src/i18n';
import editorLetterReducer, { setLetterReference } from '@src/redux/slices/editor.letter.slice';
import { EditorConstants } from '@src/constants/editor';

const parseXml = (content: string): XMLDocument => new DOMParser().parseFromString(content, 'application/xml');

describe('HorizontalFractionDialog', () => {
  beforeAll(() => void i18n.changeLanguage('de'));

  it('inserts numerator and denominator at the captured caret', () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(
      setLetterReference({
        letterReference: {
          elementType: 'p',
          elementXmlId: '0.0.0',
          elementKey: 'caret:0:4',
        },
      }),
    );
    const xmlDoc = parseXml(`<TEI xmlns="${EditorConstants.TEI_NS}"><text><body><p>Text follows</p></body></text></TEI>`);
    const onSave = jest.fn();
    render(
      <Provider store={store}>
        <HorizontalFractionDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    fireEvent.change(screen.getByLabelText(/Zähler|Numerator/), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Nenner|Denominator/), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: /Bruchzahl einfügen|Insert fraction/ }));

    const formula = xmlDoc.getElementsByTagNameNS('*', 'formula')[0];
    expect(formula.getAttribute('rend')).toBe('fraction_bar');
    expect(onSave).toHaveBeenCalledWith(
      xmlDoc,
      EditorConstants.changeTypes.misc.BODY_HORIZONTAL_FRACTION_ADDED,
      expect.any(String),
      formula.getAttribute('xml:id'),
    );
  });

  it.each([
    [
      'vertical-slash',
      'fraction_slash',
      'supslash',
      'barslash',
      '',
      'subslash',
      EditorConstants.changeTypes.misc.BODY_VERTICAL_SLASH_FRACTION_ADDED,
    ],
    [
      'vertical-noslash',
      'fraction_noslash',
      'supnoslash',
      'barnoslash',
      '/',
      'subnoslash',
      EditorConstants.changeTypes.misc.BODY_VERTICAL_NOSLASH_FRACTION_ADDED,
    ],
  ] as const)(
    'inserts the %s variant through the shared dialog',
    (variant, formulaRend, numeratorRend, separatorRend, separatorText, denominatorRend, changeType) => {
      const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
      store.dispatch(
        setLetterReference({
          letterReference: {
            elementType: 'p',
            elementXmlId: '0.0.0',
            elementKey: 'caret:0:4',
          },
        }),
      );
      const xmlDoc = parseXml(`<TEI xmlns="${EditorConstants.TEI_NS}"><text><body><p>Text follows</p></body></text></TEI>`);
      const onSave = jest.fn();
      render(
        <Provider store={store}>
          <HorizontalFractionDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} variant={variant} />
        </Provider>,
      );

      fireEvent.change(screen.getByLabelText(/Zähler|Numerator/), { target: { value: '5' } });
      fireEvent.change(screen.getByLabelText(/Nenner|Denominator/), { target: { value: '8' } });
      fireEvent.click(screen.getByRole('button', { name: /Bruchzahl einfügen|Insert fraction/ }));

      const formula = xmlDoc.getElementsByTagNameNS('*', 'formula')[0];
      expect(formula.getAttribute('rend')).toBe(formulaRend);
      expect(Array.from(formula.children).map((child) => [child.getAttribute('rend'), child.textContent])).toEqual([
        [numeratorRend, '5'],
        [separatorRend, separatorText],
        [denominatorRend, '8'],
      ]);
      expect(onSave).toHaveBeenCalledWith(xmlDoc, changeType, expect.any(String), formula.getAttribute('xml:id'));
    },
  );

  it('loads and updates an existing horizontal fraction', () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(
      setLetterReference({
        letterReference: {
          elementType: 'formula',
          elementXmlId: 'formula_1',
          elementKey: 'edit',
        },
      }),
    );
    const xmlDoc = parseXml(
      `<TEI xmlns="${EditorConstants.TEI_NS}"><text><body><p>Text <formula rend="fraction_bar" xml:id="formula_1"><hi rend="supbar">1</hi><hi rend="barbar">/</hi><hi rend="subbar">2</hi></formula> follows</p></body></text></TEI>`,
    );
    const onSave = jest.fn();
    render(
      <Provider store={store}>
        <HorizontalFractionDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    expect(screen.getByLabelText(/Zähler|Numerator/)).toHaveValue('1');
    expect(screen.getByLabelText(/Nenner|Denominator/)).toHaveValue('2');
    fireEvent.change(screen.getByLabelText(/Zähler|Numerator/), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/Nenner|Denominator/), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: /Aktualisieren|Update/ }));

    const formula = xmlDoc.getElementsByTagNameNS('*', 'formula')[0];
    expect(formula.querySelector('[rend="supbar"]')?.textContent).toBe('3');
    expect(formula.querySelector('[rend="subbar"]')?.textContent).toBe('8');
    expect(onSave).toHaveBeenCalledWith(
      xmlDoc,
      EditorConstants.changeTypes.misc.BODY_HORIZONTAL_FRACTION_CHANGED,
      expect.any(String),
      'formula_1',
    );
  });

  it('deletes an existing fraction only after confirmation', () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch(
      setLetterReference({
        letterReference: {
          elementType: 'formula',
          elementXmlId: 'formula_1',
          elementKey: 'delete',
        },
      }),
    );
    const xmlDoc = parseXml(
      `<TEI xmlns="${EditorConstants.TEI_NS}"><text><body><p>Text <formula rend="fraction_bar" xml:id="formula_1"><hi rend="supbar">1</hi><hi rend="barbar">/</hi><hi rend="subbar">2</hi></formula> follows</p></body></text></TEI>`,
    );
    const onSave = jest.fn();
    render(
      <Provider store={store}>
        <HorizontalFractionDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    expect(xmlDoc.getElementsByTagNameNS('*', 'formula')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /Endgültig löschen|Delete permanently/ }));

    expect(xmlDoc.getElementsByTagNameNS('*', 'formula')).toHaveLength(0);
    expect(xmlDoc.getElementsByTagNameNS('*', 'p')[0].textContent).toBe('Text follows');
    expect(onSave).toHaveBeenCalledWith(
      xmlDoc,
      EditorConstants.changeTypes.misc.BODY_HORIZONTAL_FRACTION_REMOVED,
      expect.any(String),
      null,
    );
  });
});
