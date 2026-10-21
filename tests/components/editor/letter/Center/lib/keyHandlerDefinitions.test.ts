import {
  allTimesAvailableKeyHandleDefinitions,
  contentMarkedKeyHandleDefinitions,
} from '@src/components/editor/letter/Center/lib/keyHandlerDefinitions';
import { EditorConstants } from '@src/constants/editor';
import { configureStore } from '@reduxjs/toolkit';
import editorLetterReducer from '@src/redux/slices/editor.letter.slice';
import type { RootState } from '@src/redux/redux.store';

const paragraphShortcuts = [
  ['ctrl+shift+p', null],
  ['ctrl+shift+d', 'paragraph_hanging'],
  ['alt+shift+a', 'paragraph centered'],
  ['ctrl+alt+4', 'paragraph_right'],
  ['ctrl+alt+5', 'paragraph_without_indent'],
  ['alt+9', 'paragraph_without_indent_indented'],
] as const;

describe('paragraph shortcut definitions', () => {
  it.each(paragraphShortcuts)('maps %s to its TEI paragraph style', (shortcut, expectedStyle) => {
    const xmlDoc = new DOMParser().parseFromString(
      '<TEI><text><body><div><p>Before <span class="marked">Selected</span> after</p></div></body></text></TEI>',
      'application/xml',
    );
    const definition = contentMarkedKeyHandleDefinitions[shortcut];

    definition.xmlAction?.(xmlDoc);

    const selectedParagraph = Array.from(xmlDoc.querySelectorAll('p')).find((paragraph) => paragraph.textContent === 'Selected');
    expect(selectedParagraph).toBeDefined();
    expect(selectedParagraph?.getAttribute('style')).toBe(expectedStyle);
    expect(definition.operationType).toBe(EditorConstants.changeTypes.misc.BODY_STRUCTURE_CHANGED);
  });
});

describe('graphic shortcut definitions', () => {
  it.each([
    ['ctrl+shift+j', 'graphic-block'],
    ['alt+shift+j', 'graphic-inline-copy'],
  ] as const)('opens the graphic dialog for %s at the selected XML path', (shortcut, operation) => {
    document.body.innerHTML = '<tei><text><body><p data-editor-xml-path="0.0.0">Text</p></body></text></tei>';
    const text = document.querySelector('p')!.firstChild!;
    const selection = window.getSelection()!;
    const range = document.createRange();
    range.selectNodeContents(text);
    selection.removeAllRanges();
    selection.addRange(range);
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });

    allTimesAvailableKeyHandleDefinitions[shortcut].openDialogAction?.(store.dispatch, store.getState as unknown as () => RootState);

    expect(store.getState().editorLetter.dialogType).toBe(EditorConstants.dialogTypes.GRAPHIC_STRUCTURE);
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'p',
      elementXmlId: '0.0.0',
      elementKey: operation,
    });
  });
});

describe('foreign-hand annotation shortcut definition', () => {
  it('opens Ctrl+Alt+A with the exact collapsed caret reference', () => {
    document.body.innerHTML = '<div><p data-editor-xml-path="0.0.0.0">Alpha Beta</p></div>';
    const text = document.querySelector('p')!.firstChild!;
    const selection = window.getSelection()!;
    const range = document.createRange();
    range.setStart(text, 5);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch({
      type: 'editorLetter/setEditorLetter',
      payload: {
        letter: {
          xmlContent: `<TEI xmlns="${EditorConstants.TEI_NS}"><text><body><div><p>Alpha Beta</p></div></body></text></TEI>`,
        },
      },
    });

    allTimesAvailableKeyHandleDefinitions['ctrl+alt+a'].openDialogAction?.(store.dispatch, store.getState as unknown as () => RootState);

    expect(store.getState().editorLetter.dialogType).toBe(EditorConstants.dialogTypes.FOREIGN_HAND_ANNOTATION);
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'p',
      elementXmlId: '0.0.0.0',
      elementKey: 'caret:0:5',
    });
  });
});

describe('author-footnote shortcut definition', () => {
  it('opens Ctrl+Alt+F with the exact collapsed caret reference', () => {
    document.body.innerHTML = '<div><p data-editor-xml-path="0.0.0.0">Alpha Beta</p></div>';
    const text = document.querySelector('p')!.firstChild!;
    const selection = window.getSelection()!;
    const range = document.createRange();
    range.setStart(text, 5);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch({
      type: 'editorLetter/setEditorLetter',
      payload: {
        letter: {
          xmlContent: `<TEI xmlns="${EditorConstants.TEI_NS}"><text><body><div><p>Alpha Beta</p></div></body></text></TEI>`,
        },
      },
    });

    allTimesAvailableKeyHandleDefinitions['alt+ctrl+f'].openDialogAction?.(store.dispatch, store.getState as unknown as () => RootState);

    expect(store.getState().editorLetter.dialogType).toBe(EditorConstants.dialogTypes.ADD_FOOTNOTE_AUTHOR);
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'p',
      elementXmlId: '0.0.0.0',
      elementKey: 'caret:0:5',
    });
  });
});

describe('fraction shortcut definitions', () => {
  it.each([
    ['ctrl+2', EditorConstants.dialogTypes.HORIZONTAL_FRACTION],
    ['ctrl+3', EditorConstants.dialogTypes.VERTICAL_SLASH_FRACTION],
    ['ctrl+4', EditorConstants.dialogTypes.VERTICAL_NOSLASH_FRACTION],
  ])('opens %s with the exact collapsed caret reference', (shortcut, dialogType) => {
    document.body.innerHTML = '<div><p data-editor-xml-path="0.0.0.0">Alpha Beta</p></div>';
    const text = document.querySelector('p')!.firstChild!;
    const selection = window.getSelection()!;
    const range = document.createRange();
    range.setStart(text, 5);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch({
      type: 'editorLetter/setEditorLetter',
      payload: {
        letter: {
          xmlContent: `<TEI xmlns="${EditorConstants.TEI_NS}"><text><body><div><p>Alpha Beta</p></div></body></text></TEI>`,
        },
      },
    });

    allTimesAvailableKeyHandleDefinitions[shortcut].openDialogAction?.(store.dispatch, store.getState as unknown as () => RootState);

    expect(store.getState().editorLetter.dialogType).toBe(dialogType);
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'p',
      elementXmlId: '0.0.0.0',
      elementKey: 'caret:0:5',
    });
  });
});

describe('cross-reference shortcut definitions', () => {
  it('opens Ctrl+Alt+R with the exact collapsed caret and register kind', () => {
    document.body.innerHTML = '<div><p data-editor-xml-path="0.0.0.0">Alpha Beta</p></div>';
    const text = document.querySelector('p')!.firstChild!;
    const selection = window.getSelection()!;
    const range = document.createRange();
    range.setStart(text, 5);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch({
      type: 'editorLetter/setEditorLetter',
      payload: {
        letter: {
          xmlContent: `<TEI xmlns="${EditorConstants.TEI_NS}"><text><body><div><p>Alpha Beta</p></div></body></text></TEI>`,
        },
      },
    });

    allTimesAvailableKeyHandleDefinitions['ctrl+alt+r'].openDialogAction?.(store.dispatch, store.getState as unknown as () => RootState);

    expect(store.getState().editorLetter.dialogType).toBe(EditorConstants.dialogTypes.CROSS_REFERENCE);
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'register',
      elementXmlId: '0.0.0.0',
      elementKey: 'caret:0:5',
    });
  });

  it('opens a URL reference from the persisted marked selection', () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch({
      type: 'editorLetter/setEditorLetter',
      payload: {
        letter: {
          xmlContent: `<TEI xmlns="${EditorConstants.TEI_NS}"><text><body><div><p>Alpha <span class="marked">Beta</span></p></div></body></text></TEI>`,
        },
      },
    });

    contentMarkedKeyHandleDefinitions['ctrl+alt+u'].openDialogAction?.(store.dispatch, store.getState as unknown as () => RootState);

    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'external-url',
      elementXmlId: '',
      elementKey: 'selection',
    });
  });

  it('reserves the Oxygen Ctrl+Shift+Z shortcut and keeps redo on Ctrl+Y', () => {
    expect(allTimesAvailableKeyHandleDefinitions['ctrl+shift+z'].description).toBe('Unspezifischer Querverweis');
    expect(allTimesAvailableKeyHandleDefinitions['ctrl+y'].description).toBe('Historie -> Vorwärts');
  });
});

describe('foreign-text shortcut definition', () => {
  it('opens Ctrl+Alt+X for the persisted marked selection', () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch({
      type: 'editorLetter/setEditorLetter',
      payload: {
        letter: {
          xmlContent: `<TEI xmlns="${EditorConstants.TEI_NS}"><text><body><div><p><span class="marked">Bonjour</span></p></div></body></text></TEI>`,
        },
      },
    });

    contentMarkedKeyHandleDefinitions['ctrl+alt+x'].openDialogAction?.(store.dispatch, store.getState as unknown as () => RootState);

    expect(store.getState().editorLetter.dialogType).toBe(EditorConstants.dialogTypes.FOREIGN_TEXT);
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'foreign',
      elementXmlId: '',
      elementKey: 'create',
    });
  });
});

describe('abbreviation shortcut definition', () => {
  it('opens Ctrl+1 for the persisted marked selection', () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });
    store.dispatch({
      type: 'editorLetter/setEditorLetter',
      payload: {
        letter: {
          xmlContent: `<TEI xmlns="${EditorConstants.TEI_NS}"><text><body><div><p><span class="marked">Ch</span></p></div></body></text></TEI>`,
        },
      },
    });

    contentMarkedKeyHandleDefinitions['ctrl+1'].openDialogAction?.(store.dispatch, store.getState as unknown as () => RootState);

    expect(store.getState().editorLetter.dialogType).toBe(EditorConstants.dialogTypes.ABBREVIATION);
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'choice',
      elementXmlId: '',
      elementKey: 'create',
    });
  });
});

describe('superscript shortcut definition', () => {
  it('maps Ctrl+5 to the FMB-C superscript markup', () => {
    const xmlDoc = new DOMParser().parseFromString(
      '<TEI><text><body><p>Saint <span class="marked">1<hi rend="italic">st</hi></span></p></body></text></TEI>',
      'application/xml',
    );
    const definition = contentMarkedKeyHandleDefinitions['ctrl+5'];

    definition.xmlAction?.(xmlDoc);

    const superscript = xmlDoc.querySelector('hi[rend="superscript"]');
    expect(superscript?.textContent).toBe('1st');
    expect(superscript?.querySelector('hi[rend="italic"]')?.textContent).toBe('st');
    expect(xmlDoc.querySelector('span.marked')).toBeNull();
    expect(definition.operationType).toBe(EditorConstants.changeTypes.misc.CONTENT_FORMAT_CHANGED);
  });
});

describe('subscript shortcut definition', () => {
  it('maps Ctrl+6 to the FMB-C subscript markup', () => {
    const xmlDoc = new DOMParser().parseFromString(
      '<TEI><text><body><p>H<span class="marked">2<hi rend="italic">O</hi></span></p></body></text></TEI>',
      'application/xml',
    );
    const definition = contentMarkedKeyHandleDefinitions['ctrl+6'];

    definition.xmlAction?.(xmlDoc);

    const subscript = xmlDoc.querySelector('hi[rend="subscript"]');
    expect(subscript?.textContent).toBe('2O');
    expect(subscript?.querySelector('hi[rend="italic"]')?.textContent).toBe('O');
    expect(xmlDoc.querySelector('span.marked')).toBeNull();
    expect(definition.operationType).toBe(EditorConstants.changeTypes.misc.CONTENT_FORMAT_CHANGED);
  });
});

describe('groundline shortcut definition', () => {
  it('maps Ctrl+7 to the FMB-C groundline markup', () => {
    const xmlDoc = new DOMParser().parseFromString(
      '<TEI><text><body><p><span class="marked">ground<hi rend="italic">line</hi></span></p></body></text></TEI>',
      'application/xml',
    );
    const definition = contentMarkedKeyHandleDefinitions['ctrl+7'];

    definition.xmlAction?.(xmlDoc);

    const groundline = xmlDoc.querySelector('hi[rend="groundline"]');
    expect(groundline?.textContent).toBe('groundline');
    expect(groundline?.querySelector('hi[rend="italic"]')?.textContent).toBe('line');
    expect(xmlDoc.querySelector('span.marked')).toBeNull();
    expect(definition.operationType).toBe(EditorConstants.changeTypes.misc.CONTENT_FORMAT_CHANGED);
  });
});

describe('manuscript annotation shortcut definition', () => {
  it('opens Ctrl+Shift+D in creation mode without requiring a text selection', () => {
    const store = configureStore({ reducer: { editorLetter: editorLetterReducer } });

    allTimesAvailableKeyHandleDefinitions['ctrl+shift+d'].openDialogAction?.(store.dispatch, store.getState as unknown as () => RootState);

    expect(store.getState().editorLetter.dialogType).toBe(EditorConstants.dialogTypes.MANUSCRIPT_ANNOTATION);
    expect(store.getState().editorLetter.letterReference).toEqual({
      elementType: 'scriptDesc',
      elementXmlId: '',
      elementKey: 'create',
    });
  });
});
