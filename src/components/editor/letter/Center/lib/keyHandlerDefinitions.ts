import { EditorKeyHandleItem } from '@src/services/mappings/editorMappings';
import { EditorUtils } from '@src/utils/editor';
import { AppDispatch, RootState } from '@src/redux/redux.store';
import { EditorConstants } from '@src/constants/editor';
import { enqueueSnackbar } from 'notistack';
import { MiscUtils } from '@src/utils/misc';
import { setContentTextIsMarked, setReloadLetterContent, setXmlLetterContent } from '@src/redux/slices/editor.letter.slice';
import { setEditorDialogAndReferenceThunk } from '@src/redux/thunks/editor.letter.thunk';
import type { GraphicStructureOperation } from '@src/components/editor/letter/Dialog/Components/GraphicStructureDialog';
import { captureForeignHandAnnotationCaret } from '@src/utils/editor/foreignHandAnnotation';

const selectedXmlPathElement = (): HTMLElement | null => {
  const selectionNode = window.getSelection()?.anchorNode ?? null;
  const selectionElement = selectionNode?.nodeType === Node.ELEMENT_NODE ? (selectionNode as HTMLElement) : selectionNode?.parentElement;
  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const candidate =
    selectionElement?.closest<HTMLElement>('[data-editor-xml-path]') ?? activeElement?.closest<HTMLElement>('[data-editor-xml-path]');
  if (!candidate?.closest('body')) return null;
  return candidate.closest<HTMLElement>('p[data-editor-xml-path]') ?? candidate;
};

const openGraphicStructureDialog = (dispatch: AppDispatch, operation: GraphicStructureOperation): void => {
  const anchor = selectedXmlPathElement();
  const sourcePath = anchor?.dataset.editorXmlPath;
  if (!anchor || sourcePath === undefined) {
    enqueueSnackbar('Bitte wählen Sie zuerst eine Einfügeposition im Brieftext aus.', {
      variant: 'error',
    });
    return;
  }
  dispatch(
    setEditorDialogAndReferenceThunk({
      dialogType: EditorConstants.dialogTypes.GRAPHIC_STRUCTURE,
      elementType: anchor.localName,
      elementXmlId: sourcePath,
      elementKey: operation,
    }),
  );
};

const openForeignHandAnnotationDialog = (dispatch: AppDispatch, getState: () => RootState): void => {
  const xmlContent = getState().editorLetter.letter.xmlContent;
  if (!xmlContent) {
    enqueueSnackbar('Kein Brieftext geladen.', { variant: 'error' });
    return;
  }
  try {
    const caret = captureForeignHandAnnotationCaret(xmlContent);
    dispatch(
      setEditorDialogAndReferenceThunk({
        dialogType: EditorConstants.dialogTypes.FOREIGN_HAND_ANNOTATION,
        elementType: caret.elementType,
        elementXmlId: caret.sourcePath,
        elementKey: caret.reference,
      }),
    );
  } catch (error) {
    enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
  }
};

export const filterForKeyHandleDefinitions = (keyHandleDefinitions: Record<string, EditorKeyHandleItem>, keyCombination: string) => {
  const filteredKeyHandle = Object.values(keyHandleDefinitions).filter((item) => item.key === keyCombination)[0];

  if (!filteredKeyHandle) {
    throw new Error('Keybinding not found: for' + keyCombination);
  }

  return filteredKeyHandle;
};

// Function to find a key handle definition based on a key combination string
// This function ignores the order of modifier keys and is case-insensitive
// Example: "Ctrl+Alt+K" will match "alt+ctrl+k" or "CTRL+ALT+K" or "alt+CTRL+k"
export const findKeyHandleDefinition = (
  comboToMatch: string,
  keyHandleDefinitions: Record<string, EditorKeyHandleItem>,
): EditorKeyHandleItem | null => {
  const comboParts = comboToMatch.toLowerCase().split('+');
  if (comboParts.length < 2) return null;

  const mainKey = comboParts[comboParts.length - 1];
  const modifiers = comboParts.slice(0, -1);

  for (const [defCombo, definition] of Object.entries(keyHandleDefinitions)) {
    const defParts = defCombo.toLowerCase().split('+');
    const defMainKey = defParts[defParts.length - 1];
    const defModifiers = defParts.slice(0, -1);

    if (defMainKey !== mainKey) continue;

    if (defModifiers.length !== modifiers.length) continue;

    const allModifiersMatch = defModifiers.every((m) => modifiers.includes(m));
    if (allModifiersMatch) return definition;
  }

  return null;
};

async function runXmlAction(
  dispatch: AppDispatch,
  getState: () => RootState,
  xmlAction: (xmlDoc: Document) => void,
  operationType: string,
  successMessage?: string,
): Promise<string | null> {
  const stateTeiXml = getState().editorLetter.letter.xmlContent;
  const stateEditorLetter = getState().editorLetter.letter;

  const xmlDoc = EditorUtils.xmlCheck.extractTeiDocumentFromString(stateTeiXml);

  try {
    xmlAction(xmlDoc);
  } catch (error) {
    enqueueSnackbar('Error during XML manipulation. ' + MiscUtils.misc.getErrorMessage(error), {
      variant: 'error',
    });
    return null;
  }
  try {
    const xmlString = new XMLSerializer().serializeToString(xmlDoc);

    await EditorUtils.backendOrchestrator.patchWithDispatch(dispatch, [xmlString, stateEditorLetter.id, operationType, null], {
      actionsOnSuccess: [
        setXmlLetterContent({ content: { xmlContent: xmlString } }),
        setReloadLetterContent({ reloadLetterContent: true }),
        setContentTextIsMarked({ contentTextIsMarked: false }),
      ],
      successMessage: successMessage,
      errorMessage: 'Error during backend update.',
    });

    return operationType;
  } catch (error) {
    enqueueSnackbar('Error during backend update. ' + MiscUtils.misc.getErrorMessage(error), {
      variant: 'error',
    });
    return null;
  }
}

export function generateKeyHandleAction(item: EditorKeyHandleItem) {
  try {
    if (item.openDialogAction) {
      return item.openDialogAction;
    }
    if (item.xmlAction && item.operationType) {
      return (dispatch: AppDispatch, getState: () => RootState) =>
        runXmlAction(dispatch, getState, item.xmlAction!, item.operationType!, item.successMessage);
    }
    return item.action ?? null;
  } catch (error) {
    throw error;
  }
}

export const allTimesAvailableKeyHandleDefinitions: Record<string, EditorKeyHandleItem> = {
  'ctrl+alt+a': {
    key: 'ctrl+alt+a',
    description: 'Anmerkung fremder Hand hinzufügen',
    component: null,
    action: null,
    openDialogAction: openForeignHandAnnotationDialog,
  },
  'alt+c': {
    key: 'alt+c',
    description: 'Header Hinzufügen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_TEI_HEADER);
    },
  },
  'alt+d': {
    key: 'alt+d',
    description: 'Empfänger Bearbeiten',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.MANAGE_HEADER_RECEIVER);
    },
  },
  'alt+j': {
    key: 'alt+j',
    description: 'Sprachen Verwalten',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.EDIT_LANGUAGES);
    },
  },
  'alt+k': {
    key: 'alt+k',
    component: null,
    description: 'Zeige Hilfsmenü der Shortcuts',
    action: async (dispatch: AppDispatch, _getState: () => RootState) => {
      return EditorUtils.keyPressHandles.openLeftPanel(dispatch, EditorConstants.compMappingLeft.HELP_SHORTCUTS);
    },
    skipForHelp: true,
  },
  'alt+n': {
    key: 'alt+n',
    description: 'Brief Erstellen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_NEW_LETTER);
    },
  },
  'alt+s': {
    key: 'alt+s',
    component: null,
    description: 'Suche nach Briefen',
    action: async (dispatch: AppDispatch, _getState: () => RootState) => {
      return EditorUtils.keyPressHandles.openLeftPanel(dispatch, EditorConstants.compMappingLeft.SEARCH);
    },
    skipForHelp: true,
  },
  'alt+shift+d': {
    key: 'alt+shift+d',
    description: 'Vorgängerbrief nachtragen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.MANAGE_PRECURSOR_LETTER);
    },
  },
  'alt+shift+e': {
    key: 'alt+shift+e',
    description: 'Nachfolgerbrief nachtragen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.MANAGE_SUCCESSOR_LETTER);
    },
  },
  'alt+ctrl+f': {
    key: 'alt+ctrl+f',
    description: 'Fußnote des Briefautors',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_FOOTNOTE_AUTHOR);
    },
    skipForHelp: true,
  },
  'ctrl+t': {
    key: 'ctrl+t',
    description: 'Quellenbeschreibung Handschrift',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.SOURCE_DESC_HANDWRITING);
    },
    skipForHelp: true,
  },
  'ctrl+z': {
    key: 'ctrl+z',
    description: 'Historie -> Zurück',
    component: null,
    action: async (dispatch: AppDispatch, getState: () => RootState) => {
      const stateEditorLetter = getState().editorLetter.letter;

      if (!stateEditorLetter.id) {
        enqueueSnackbar('No letter loaded to perform undo', { variant: 'error' });
        return null;
      }

      if (!stateEditorLetter.undoAvailable) {
        enqueueSnackbar('No more undo steps available', { variant: 'error' });
        return null;
      }

      await EditorUtils.backendService.undoLetterChange(stateEditorLetter.id);
      dispatch(setReloadLetterContent({ reloadLetterContent: true }));

      return null;
    },
  },
  'ctrl+alt+6': {
    key: 'ctrl+alt+6',
    description: 'Beilage Hinzufügen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ATTACHMENT_ADD);
    },
  },
  'ctrl+shift+a': {
    key: 'ctrl+shift+a',
    description: 'Adresse Empfänger verwalten',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.MANAGE_ADDRESS_RECIPIENT);
    },
  },
  'ctrl+shift+b': {
    key: 'ctrl+shift+b',
    description: 'Adresse Sender verwalten',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.MANAGE_ADDRESS_SENDER);
    },
  },
  'ctrl+shift+s': {
    key: 'ctrl+shift+s',
    description: 'Schreibakt hinzufügen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_WRITING_PART);
    },
  },
  'ctrl+shift+z': {
    key: 'ctrl+shift+z',
    description: 'Historie -> Vorwärts',
    component: null,
    action: async (dispatch: AppDispatch, getState: () => RootState) => {
      const stateEditorLetter = getState().editorLetter.letter;

      if (!stateEditorLetter.id) {
        enqueueSnackbar('No letter loaded to perform undo', { variant: 'error' });
        return null;
      }

      if (!stateEditorLetter.redoAvailable) {
        enqueueSnackbar('No more undo steps available', { variant: 'error' });
        return null;
      }

      await EditorUtils.backendService.redoLetterChange(stateEditorLetter.id);
      dispatch(setReloadLetterContent({ reloadLetterContent: true }));

      return null;
    },
    operationType: undefined,
  },
  'ctrl+m': {
    key: 'ctrl+m',
    description: 'Standort Hinzufügen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_RISM_ENTRY);
    },
  },
  'ctrl+shift+n': {
    key: 'ctrl+shift+n',
    description: 'Provenienz Eintrag Hinzufügen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_PROVENANCE_ENTRY);
    },
  },
  'ctrl+shift+j': {
    key: 'ctrl+shift+j',
    description: 'Grafisches Element hinzufügen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => openGraphicStructureDialog(dispatch, 'graphic-block'),
  },
  'alt+shift+j': {
    key: 'alt+shift+j',
    description: 'Grafisches Inline-Element hinzufügen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => openGraphicStructureDialog(dispatch, 'graphic-inline-copy'),
  },
};

export const contentMarkedKeyHandleDefinitions: Record<string, EditorKeyHandleItem> = {
  'ctrl+shift+p': {
    key: 'ctrl+shift+p',
    description: 'Auswahl als Absatz mit Einzug abtrennen',
    component: null,
    xmlAction: (xmlDoc) => EditorUtils.keyPressHandles.splitParagraph(xmlDoc, 'indented'),
    operationType: EditorConstants.changeTypes.misc.BODY_STRUCTURE_CHANGED,
    successMessage: 'Absatz eingefügt',
  },
  'ctrl+shift+d': {
    key: 'ctrl+shift+d',
    description: 'Auswahl als hängenden Absatz abtrennen',
    component: null,
    xmlAction: (xmlDoc) => EditorUtils.keyPressHandles.splitParagraph(xmlDoc, 'hanging'),
    operationType: EditorConstants.changeTypes.misc.BODY_STRUCTURE_CHANGED,
    successMessage: 'Absatz eingefügt',
  },
  'alt+shift+a': {
    key: 'alt+shift+a',
    description: 'Auswahl als zentrierten Absatz abtrennen',
    component: null,
    xmlAction: (xmlDoc) => EditorUtils.keyPressHandles.splitParagraph(xmlDoc, 'centered'),
    operationType: EditorConstants.changeTypes.misc.BODY_STRUCTURE_CHANGED,
    successMessage: 'Absatz eingefügt',
  },
  'ctrl+alt+4': {
    key: 'ctrl+alt+4',
    description: 'Auswahl als rechtsbündigen Absatz abtrennen',
    component: null,
    xmlAction: (xmlDoc) => EditorUtils.keyPressHandles.splitParagraph(xmlDoc, 'right'),
    operationType: EditorConstants.changeTypes.misc.BODY_STRUCTURE_CHANGED,
    successMessage: 'Absatz eingefügt',
  },
  'ctrl+alt+5': {
    key: 'ctrl+alt+5',
    description: 'Auswahl als Absatz ohne Einzug abtrennen',
    component: null,
    xmlAction: (xmlDoc) => EditorUtils.keyPressHandles.splitParagraph(xmlDoc, 'without-indent'),
    operationType: EditorConstants.changeTypes.misc.BODY_STRUCTURE_CHANGED,
    successMessage: 'Absatz eingefügt',
  },
  'alt+9': {
    key: 'alt+9',
    description: 'Auswahl als eingerückten Absatz ohne Einzug abtrennen',
    component: null,
    xmlAction: (xmlDoc) => EditorUtils.keyPressHandles.splitParagraph(xmlDoc, 'without-indent-indented'),
    operationType: EditorConstants.changeTypes.misc.BODY_STRUCTURE_CHANGED,
    successMessage: 'Absatz eingefügt',
  },
  'alt+1': {
    key: 'alt+1',
    description: 'Datum oberhalb einfügen',
    component: null,
    action: null,
    openDialogAction: (_dispatch: AppDispatch) => {},
  },
  'alt+v': {
    key: 'alt+v',
    description: 'Schreibakt nach oben verschieben',
    component: null,
    xmlAction: (xmlDoc) => {
      return EditorUtils.keyPressHandles.baseHandling(xmlDoc, EditorUtils.keyPressHandles.moveWritingActUp);
    },
    operationType: EditorConstants.changeTypes.writing_act.CHANGED_ORDER,
  },
  'alt+shift+!': {
    key: 'alt+shift+!',
    description: 'Datum "when" einfügen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_WHEN_ADD);
    },
  },

  'alt+shift+"': {
    key: 'alt+shift+"',
    description: "Datum'when-custom' einfügen",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_WHEN_CUSTOM_ADD);
    },
  },
  'alt+shift+§': {
    key: 'alt+shift+§',
    description: "Datum 'notAfter' einfügen",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_NOT_AFTER_ADD);
    },
  },
  'alt+shift+$': {
    key: 'alt+shift+$',
    description: "Datum 'notBefore' einfügen",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_NOT_BEFORE_ADD);
    },
  },
  'alt+shift+%': {
    key: 'alt+shift+%',
    description: "Datum 'From-To' einfügen",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_FROM_TO_ADD);
    },
  },
  'alt+shift+&': {
    key: 'alt+shift+&',
    description: "Datum 'notBefore-notAfter' einfügen",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_NOT_BEFORE_AFTER_ADD);
    },
  },
  'alt+shift+v': {
    key: 'alt+shift+v',
    description: 'Schreibakt nach unten verschieben',
    component: null,
    xmlAction: (xmlDoc) => {
      EditorUtils.keyPressHandles.baseHandling(xmlDoc, EditorUtils.keyPressHandles.moveWritingActDown);
    },
    operationType: EditorConstants.changeTypes.writing_act.CHANGED_ORDER,
  },
  'ctrl+b': {
    key: 'ctrl+b',
    description: 'Inhalt fett markieren',
    component: null,
    xmlAction: (xmlDoc) => EditorUtils.keyPressHandles.baseHandling(xmlDoc, EditorUtils.keyPressHandles.markContentBold),
    operationType: EditorConstants.changeTypes.misc.CONTENT_FORMAT_CHANGED,
  },
  'ctrl+i': {
    key: 'ctrl+i',
    description: 'Inhalt kursiv markieren',
    component: null,
    xmlAction: (xmlDoc) => {
      return EditorUtils.keyPressHandles.baseHandling(xmlDoc, EditorUtils.keyPressHandles.markContentItalic);
    },
    operationType: EditorConstants.changeTypes.misc.CONTENT_FORMAT_CHANGED,
  },
  'ctrl+u': {
    key: 'ctrl+u',
    description: 'Inhalt mit Unterstrich markieren.',
    component: null,
    xmlAction: (xmlDoc) => {
      return EditorUtils.keyPressHandles.baseHandling(xmlDoc, EditorUtils.keyPressHandles.markContentUnderline);
    },
    operationType: EditorConstants.changeTypes.misc.CONTENT_FORMAT_CHANGED,
  },
  'ctrl+alt+k': {
    key: 'ctrl+alt+k',
    description: 'Kommentar einfügen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_NOTE);
    },
  },
  'ctrl+alt+o': {
    key: 'ctrl+alt+o',
    description: 'Markierung mit Ort auszeichnen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openRightPanel(dispatch, EditorConstants.compMappingRight.ENT_PLACE);
    },
  },
  'ctrl+alt+p': {
    key: 'ctrl+alt+p',
    description: 'Markierung mit Person auszeichnen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openRightPanel(dispatch, EditorConstants.compMappingRight.ENT_PERSON);
    },
  },
  'ctrl+alt+w': {
    key: 'ctrl+alt+w',
    description: 'Markierung mit Werk auszeichnen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openRightPanel(dispatch, EditorConstants.compMappingRight.ENT_CREATION);
    },
  },
  'ctrl+alt+v': {
    key: 'ctrl+alt+v',
    description: 'Markierung mit Werk Protagonist auszeichnen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_LETTER_TO_PROTAG);
    },
  },
  'ctrl+alt+b': {
    key: 'ctrl+alt+b',
    description: 'Markierung mit Briefe Protagonist auszeichnen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_LETTER_FROM_PROTAG);
    },
  },
  'ctrl+shift+h': {
    key: 'ctrl+shift+h',
    description: 'Seitenumbruch an der aktuellen Position einfügen',
    component: null,
    xmlAction: (xmlDoc) => EditorUtils.contentFlow.insertPageBreak(xmlDoc),
    operationType: EditorConstants.changeTypes.misc.BODY_PAGEBREAK_ADDED,
    successMessage: 'Seitenumbruch Eingefügt',
  },
  'ctrl+shift+i': {
    key: 'ctrl+shift+i',
    description: 'Spaltenumbruch an der aktuellen Position einfügen',
    component: null,
    xmlAction: (xmlDoc) => EditorUtils.contentFlow.insertColumnBreak(xmlDoc),
    operationType: EditorConstants.changeTypes.misc.BODY_COLUMNBREAK_ADDED,
    successMessage: 'Spaltenumbruch Eingefügt',
  },
};
