import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import '@src/i18n';
import i18n from '@src/i18n';
import CrossReferenceDialog from '@src/components/editor/letter/Dialog/Components/CrossReferenceDialog';
import editorLetterReducer, { setLetterReference } from '@src/redux/slices/editor.letter.slice';
import { EditorConstants } from '@src/constants/editor';

const parseXml = (content: string): XMLDocument =>
  new DOMParser().parseFromString(`<TEI xmlns="${EditorConstants.TEI_NS}">${content}</TEI>`, 'application/xml');

const buildStore = (elementType: string, elementXmlId: string, elementKey: string) => {
  const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
  store.dispatch(setLetterReference({ letterReference: { elementType, elementXmlId, elementKey } }));
  return store;
};

describe('CrossReferenceDialog', () => {
  beforeAll(() => void i18n.changeLanguage('de'));

  it('wraps a marked selection in a validated external reference', () => {
    const xmlDoc = parseXml('<text><body><div><p>See <span class="marked">website</span>.</p></div></body></text>');
    const onSave = jest.fn();
    render(
      <Provider store={buildStore('external-url', '', 'selection')}>
        <CrossReferenceDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Ziel' }), {
      target: { value: 'https://example.test/resource' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Querverweis einfügen' }));

    const reference = xmlDoc.querySelector('ref');
    expect(reference?.textContent).toBe('website');
    expect(reference?.getAttribute('target')).toBe('https://example.test/resource');
    expect(onSave).toHaveBeenCalledWith(
      xmlDoc,
      EditorConstants.changeTypes.misc.BODY_CROSS_REFERENCE_ADDED,
      'Der Querverweis wurde hinzugefügt.',
      reference?.getAttribute('xml:id'),
    );
  });

  it('shows URL validation errors without saving unsafe input', () => {
    const xmlDoc = parseXml('<text><body><div><p><span class="marked">website</span></p></div></body></text>');
    const onSave = jest.fn();
    render(
      <Provider store={buildStore('external-url', '', 'selection')}>
        <CrossReferenceDialog xmlDoc={xmlDoc} onSave={onSave} onClose={jest.fn()} />
      </Provider>,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Ziel' }), {
      target: { value: 'javascript:alert(1)' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Querverweis einfügen' }));

    expect(screen.getAllByRole('alert')[1]).toHaveTextContent('Only secure HTTP(S) URLs');
    expect(onSave).not.toHaveBeenCalled();
    expect(xmlDoc.querySelector('ref')).toBeNull();
  });

  it('creates a target anchor with an automatic unique ID', () => {
    const xmlDoc = parseXml('<text><body><div><p>Alpha Beta</p></div></body></text>');
    render(
      <Provider store={buildStore('generic-target', '0.0.0.0', 'caret:0:5')}>
        <CrossReferenceDialog xmlDoc={xmlDoc} onSave={jest.fn()} onClose={jest.fn()} />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Querverweis einfügen' }));

    expect(xmlDoc.querySelector('anchor[type="cross-reference"]')?.getAttribute('xml:id')).toMatch(/^anchor_/);
  });

  it('updates multiple targets and deletes a wrapped reference without deleting its text', () => {
    const xmlDoc = parseXml(
      '<text><body><div><p><link xml:id="link_1" target="#old"/></p><p><ref xml:id="ref_1" target="https://example.test">website</ref></p></div></body></text>',
    );
    const { unmount } = render(
      <Provider store={buildStore('link', 'link_1', 'edit')}>
        <CrossReferenceDialog xmlDoc={xmlDoc} onSave={jest.fn()} onClose={jest.fn()} />
      </Provider>,
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Ziel' }), {
      target: { value: 'first #second' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Aktualisieren' }));
    expect(xmlDoc.querySelector('link')?.getAttribute('target')).toBe('#first #second');
    unmount();

    render(
      <Provider store={buildStore('ref', 'ref_1', 'delete')}>
        <CrossReferenceDialog xmlDoc={xmlDoc} onSave={jest.fn()} onClose={jest.fn()} />
      </Provider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Endgültig löschen' }));
    expect(xmlDoc.querySelector('ref')).toBeNull();
    expect(xmlDoc.querySelectorAll('p')[1].textContent).toBe('website');
  });
});
