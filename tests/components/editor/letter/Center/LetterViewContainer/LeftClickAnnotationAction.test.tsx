import React, { useRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import LeftClickAnnotationAction from '@src/components/editor/letter/Center/LetterViewContainer/LeftClickAnnotationAction';
import editorLetterReducer from '@src/redux/slices/editor.letter.slice';
import type { LetterState } from '@src/constants/editor';

const Harness = () => {
  const xmlContentRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div ref={xmlContentRef}>
        <button type="button" data-editor-foreign-annotation-id="note_1" aria-label="Anmerkung 1">
          1
        </button>
        <button
          type="button"
          data-editor-manuscript-annotation-reference="script_annotation_1"
          aria-label="Handschriftenanmerkung bearbeiten"
        >
          ▶
        </button>
        <span role="button" data-editor-author-footnote-id="fn_1" aria-label="Fußnotenreferenz 1">
          1
        </span>
        <span role="button" data-editor-cross-reference-id="link_1" aria-label="Querverweis auf #target">
          ↗ #target
        </span>
      </div>
      <LeftClickAnnotationAction xmlContentRef={xmlContentRef} setLetterState={jest.fn<void, [LetterState]>()} />
    </>
  );
};

describe('LeftClickAnnotationAction', () => {
  it('opens a foreign-hand annotation from its numbered anchor', () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    render(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Anmerkung 1' }));

    expect(store.getState().editorLetter.dialogType).toBe('FOREIGN_HAND_ANNOTATION');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'note',
      elementXmlId: 'note_1',
      elementKey: 'edit',
    });
  });

  it('opens a manuscript annotation from its caret', () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    render(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );

    const caret = screen.getByRole('button', { name: 'Handschriftenanmerkung bearbeiten' });
    expect(fireEvent.mouseUp(caret)).toBe(true);
    fireEvent.click(caret);

    expect(store.getState().editorLetter.dialogType).toBe('MANUSCRIPT_ANNOTATION');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'p',
      elementXmlId: 'script_annotation_1',
      elementKey: 'edit',
    });
  });

  it('opens an author footnote from its reference marker', () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    render(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fußnotenreferenz 1' }));

    expect(store.getState().editorLetter.dialogType).toBe('ADD_FOOTNOTE_AUTHOR');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'note',
      elementXmlId: 'fn_1',
      elementKey: 'edit',
    });
  });

  it('opens a cross-reference from its visible marker', () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    render(
      <Provider store={store}>
        <Harness />
      </Provider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Querverweis auf #target' }));

    expect(store.getState().editorLetter.dialogType).toBe('CROSS_REFERENCE');
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'span',
      elementXmlId: 'link_1',
      elementKey: 'edit',
    });
  });
});
