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
});
