import { EditorKeyHandleItem } from '@src/services/mappings/editorMappings';
import { EditorUtils } from '@src/utils/editor';
import { AppDispatch, RootState } from '@src/redux/redux.store';
import { EditorConstants } from '@src/constants/editor';
import { enqueueSnackbar } from 'notistack';
import { MiscUtils } from '@src/utils/misc';
import { setContentTextIsMarked, setReloadLetterContent, setXmlLetterContent } from '@src/redux/slices/editor.letter.slice';

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

  xmlAction(xmlDoc);

  const xmlString = new XMLSerializer().serializeToString(xmlDoc);

  try {
    const result = await EditorUtils.backendService.patchContent(xmlString, stateEditorLetter.id, operationType, null);

    if (result) {
      dispatch(setXmlLetterContent({ content: { xmlContent: xmlString } }));
      dispatch(setReloadLetterContent({ reloadLetterContent: true }));
      dispatch(setContentTextIsMarked({ textIsMarked: false }));
      if (successMessage) enqueueSnackbar(successMessage, { variant: 'success' });
    }

    return result ? operationType : null;
  } catch (error) {
    enqueueSnackbar('Error during backend update. ' + MiscUtils.misc.getErrorMessage(error), {
      variant: 'error',
    });
    return null;
  }
}

export function generateKeyHandleAction(item: EditorKeyHandleItem) {
  if (item.openDialogAction) {
    return item.openDialogAction;
  }
  if (item.xmlAction && item.operationType) {
    return (dispatch: AppDispatch, getState: () => RootState) =>
      runXmlAction(dispatch, getState, item.xmlAction!, item.operationType!, item.successMessage);
  }
  return item.action ?? null;
}

export const allTimesAvailableKeyHandleDefinitions: Record<string, EditorKeyHandleItem> = {
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
  'alt+n': {
    key: 'alt+n',
    description: 'Brief Erstellen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_NEW_LETTER);
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
  },
  'ctrl+t': {
    key: 'ctrl+t',
    description: 'Quellenbeschreibung Handschrift',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.SOURCE_DESC_HANDWRITING);
    },
  },
  'ctrl+alt+6': {
    key: 'ctrl+alt+6',
    description: 'add attachment to letter header',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ATTACHMENT_ADD);
    },
  },
  'ctrl+shift+a': {
    key: 'ctrl+shift+a',
    description: 'manage address line for recipient',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.MANAGE_ADDRESS_RECIPIENT);
    },
  },
  'ctrl+shift+b': {
    key: 'ctrl+shift+b',
    description: 'manage address line for sender',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.MANAGE_ADDRESS_SENDER);
    },
  },
  'ctrl+shift+s': {
    key: 'ctrl+shift+s',
    description: 'Schreibakt Hinzufügen',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_WRITING_PART);
    },
  },
};

export const contentMarkedKeyHandleDefinitions: Record<string, EditorKeyHandleItem> = {
  'alt+1': {
    key: 'alt+1',
    description: 'insert line of date on top of the current element',
    component: null,
    action: null,
    openDialogAction: (_dispatch: AppDispatch) => {},
  },
  'alt+v': {
    key: 'alt+v',
    description: 'move current writing act up',
    component: null,
    xmlAction: (xmlDoc) => {
      return EditorUtils.keyPressHandles.baseHandling(xmlDoc, EditorUtils.keyPressHandles.moveWritingActUp);
    },
    operationType: EditorConstants.changeTypes.writing_act.CHANGED_ORDER,
  },
  'alt+shift+!': {
    key: 'alt+shift+!',
    description: 'date when marking content',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_WHEN_ADD);
    },
  },
  'alt+shift+"': {
    key: 'alt+shift+"',
    description: "date 'when-custom' marking content",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_WHEN_CUSTOM_ADD);
    },
  },
  'alt+shift+§': {
    key: 'alt+shift+§',
    description: "date 'notAfter' marking content",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_NOT_AFTER_ADD);
    },
  },
  'alt+shift+$': {
    key: 'alt+shift+$',
    description: "date 'notBefore' marking content",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_NOT_BEFORE_ADD);
    },
  },
  'alt+shift+%': {
    key: 'alt+shift+%',
    description: "date 'From-To' marking content",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_FROM_TO_ADD);
    },
  },
  'alt+shift+&': {
    key: 'alt+shift+&',
    description: "date 'notBefore-notAfter' marking content",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_NOT_BEFORE_AFTER_ADD);
    },
  },
  'alt+shift+v': {
    key: 'alt+shift+v',
    description: 'move current writing act down',
    component: null,
    xmlAction: (xmlDoc) => {
      EditorUtils.keyPressHandles.baseHandling(xmlDoc, EditorUtils.keyPressHandles.moveWritingActDown);
    },
    operationType: EditorConstants.changeTypes.writing_act.CHANGED_ORDER,
  },
  'ctrl+b': {
    key: 'ctrl+b',
    description: 'mark content bold',
    component: null,
    xmlAction: (xmlDoc) => EditorUtils.keyPressHandles.baseHandling(xmlDoc, EditorUtils.keyPressHandles.markContentBold),
    operationType: EditorConstants.changeTypes.misc.CONTENT_FORMAT_CHANGED,
  },
  'ctrl+i': {
    key: 'ctrl+i',
    description: 'mark content underline',
    component: null,
    xmlAction: (xmlDoc) => {
      return EditorUtils.keyPressHandles.baseHandling(xmlDoc, EditorUtils.keyPressHandles.markContentItalic);
    },
    operationType: EditorConstants.changeTypes.misc.CONTENT_FORMAT_CHANGED,
  },
  'ctrl+u': {
    key: 'ctrl+u',
    description: 'mark content underline',
    component: null,
    xmlAction: (xmlDoc) => {
      return EditorUtils.keyPressHandles.baseHandling(xmlDoc, EditorUtils.keyPressHandles.markContentUnderline);
    },
    operationType: EditorConstants.changeTypes.misc.CONTENT_FORMAT_CHANGED,
  },
  'ctrl+alt+k': {
    key: 'ctrl+alt+k',
    description: 'add note to content',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_NOTE);
    },
  },
  'ctrl+alt+o': {
    key: 'ctrl+alt+o',
    description: 'add place annotation to marked content',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openRightPanel(dispatch, EditorConstants.compMappingRight.ENT_PLACE);
    },
  },
  'ctrl+alt+p': {
    key: 'ctrl+alt+p',
    description: 'add person annotation to marked content',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openRightPanel(dispatch, EditorConstants.compMappingRight.ENT_PERSON);
    },
  },
  'ctrl+alt+w': {
    key: 'ctrl+alt+w',
    description: 'add creation annotation to marked content',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openRightPanel(dispatch, EditorConstants.compMappingRight.ENT_CREATION);
    },
  },
  'ctrl+alt+v': {
    key: 'ctrl+alt+v',
    description: 'letters to protagonist',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_LETTER_TO_PROTAG);
    },
  },
  'ctrl+alt+b': {
    key: 'ctrl+alt+b',
    description: 'letters from protagonist',
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => {
      return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_LETTER_FROM_PROTAG);
    },
  },
  'ctrl+shift+v': {
    key: 'ctrl+shift+v',
    description: 'insert a pagebreak at the current position',
    component: null,
    xmlAction: (xmlDoc) => EditorUtils.contentFlow.insertPageBreak(xmlDoc),
    operationType: EditorConstants.changeTypes.misc.BODY_PAGEBREAK_ADDED,
    successMessage: 'Seitenumbruch eingefügt',
    // action: (dispatch, getState) =>
    //   runXmlAction(
    //     dispatch,
    //     getState,
    //     (xmlDoc) => EditorUtils.contentFlow.insertPageBreak(xmlDoc),
    //   ),
  },
};
