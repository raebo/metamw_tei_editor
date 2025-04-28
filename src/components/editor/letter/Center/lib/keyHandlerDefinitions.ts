import { EditorKeyHandleItem } from "../../../../../services/mappings/editorMappings";
import { EditorUtils } from "../../../../../utils/editor";
import { AppDispatch } from "../../../../../redux/redux.store";
import { EditorConstants } from "../../../../../constants/editor";

export const filterForKeyHandleDefinitions = (keyHandleDefinitions: Record<string, EditorKeyHandleItem>, keyCombination: string) => {
  const filteredKeyHandle = Object.values(keyHandleDefinitions).filter(
    (item) => item.key === keyCombination
  )[0];

  if (!filteredKeyHandle) {
    throw new Error("Keybinding not found: for" + keyCombination);
  }

  return filteredKeyHandle;
}

export const allTimesAvailableKeyHandleDefinitions: Record<string, EditorKeyHandleItem> = {
  "ctrl+alt+6": {
    key: "ctrl+alt+6",
    description: "add attachment to letter header",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ATTACHMENT_ADD) }
  },
  "alt+ctrl+f": {
    key: "alt+ctrl+f",
    description: "Fußnote des Briefautors",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_FOOTNOTE_AUTHOR) }
  },
  "ctrl+t": {
    key: "ctrl+t",
    description: "Quellenbeschreibung Handschrift",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.SOURCE_DESC_HANDWRITING) }
  },
  "ctrl+shift+s": {
    key: "ctrl+shift+s",
    description: "Schreibakt Hinzufügen",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_WRITING_PART) }
  },
  "alt+c": {
    key: "alt+c",
    description: "Header Hinzufügen",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_TEI_HEADER) }
  },
}

export const contentMarkedKeyHandleDefinitions: Record<string, EditorKeyHandleItem> = {
  "ctrl+b": {
    key: "ctrl+b",
    description: "mark content bold",
    component: null,
    action: () => { return EditorUtils.keyPressHandles.baseHandling(EditorUtils.keyPressHandles.markContentBold) }
  },
  "ctrl+i": {
    key: "ctrl+i",
    description: "mark content underline",
    component: null,
    action: () => { return EditorUtils.keyPressHandles.baseHandling(EditorUtils.keyPressHandles.markContentItalic) }
  },
  "ctrl+u": {
    key: "ctrl+u",
    description: "mark content underline",
    component: null,
    action: () => { return EditorUtils.keyPressHandles.baseHandling(EditorUtils.keyPressHandles.markContentUnderline) }
  },
  "ctrl+alt+k": {
    key: "ctrl+alt+k",
    description: "add note to content",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_NOTE) }
  },
  "alt+shift+1": {
    key: "alt+shift+1",
    description: "date when marking content",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_WHEN_ADD) }
  },
  "alt+shift+!": {
    key: "alt+shift+!",
    description: "date when marking content",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_WHEN_ADD) }
  },
}


// <String>&lt;accMat xmlns="http://www.tei-c.org/ns/1.0" type="${ask('Beilagentyp', combobox, ('Keine':'Keine';'certificate':'Zeugnis';'letter':'Brief';'letter_of_recommendation':'Empfehlungsschreiben';'notatedMusic':'Noten';'textTemplate':'Textvorlage';'drawing':'Zeichnung';'bill':'Rechnung';'print':'Druckerzeugnis';'diploma':'Diplom';'medal':'Orden';'other':  'Sonstiges'), 'Keine')}">${ask('Genaue Bezeichnung der Beilage eintragen (wenn keine Beilage vorhanden, einen Bindestrich (-) eintragen )', generic, '')}&lt;/accMat></String>


// Quellen hinzufügen (Quellenbeschreibung Rekonstruktion) (Alt+Q)
//
// Scheibakt (Strg+Umschalt+S)
//
// Schlussformel in neuer Zeile  hinzufügen - oberhalb des Schreibaktes (Alt+6)
//
// Standort der Quelle ändern (msIdentifier) (Alt+Umschalt+8)
//
// TEI Header Text Body (Alt+C)
//
// Unleserliche Zeichen - gap (Strg+Umschalt+X)
