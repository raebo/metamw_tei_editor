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

// Function to find a key handle definition based on a key combination string
// This function ignores the order of modifier keys and is case-insensitive
// Example: "Ctrl+Alt+K" will match "alt+ctrl+k" or "CTRL+ALT+K" or "alt+CTRL+k"
export const findKeyHandleDefinition = (comboToMatch: string, keyHandleDefinitions: Record<string, EditorKeyHandleItem>) : EditorKeyHandleItem | null => {
	const comboParts = comboToMatch.toLowerCase().split("+");
	if (comboParts.length < 2) return null;

	const mainKey = comboParts[comboParts.length - 1];
	const modifiers = comboParts.slice(0, -1);

	for (const [defCombo, definition] of Object.entries(keyHandleDefinitions)) {
		const defParts = defCombo.toLowerCase().split("+");
		const defMainKey = defParts[defParts.length - 1];
		const defModifiers = defParts.slice(0, -1);

		if (defMainKey !== mainKey) continue;

		if (defModifiers.length !== modifiers.length) continue;

		const allModifiersMatch = defModifiers.every((m) => modifiers.includes(m));
		if (allModifiersMatch) return definition;
	}

	return null;
}


export const allTimesAvailableKeyHandleDefinitions: Record<string, EditorKeyHandleItem> = {
	"alt+c": {
		key: "alt+c",
		description: "Header Hinzufügen",
		component: null,
		action: null,
		openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_TEI_HEADER) }
	},
	"alt+d": {
		key: "alt+d",
		description: "Empfänger Bearbeiten",
		component: null,
		action: null,
		openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.MANAGE_HEADER_RECEIVER) }
	},
	"alt+j": {
		key: "alt+j",
		description: "Sprachen Verwalten",
		component: null,
		action: null,
		openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.EDIT_LANGUAGES) }
	},
	"alt+n": {
		key: "alt+n",
		description: "Brief Erstellen",
		component: null,
		action: null,
		openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_NEW_LETTER) }
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
	"ctrl+alt+6": {
		key: "ctrl+alt+6",
		description: "add attachment to letter header",
		component: null,
		action: null,
		openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ATTACHMENT_ADD) }
	},
	"ctrl+shift+a": {
		key: "ctrl+shift+a",
		description: "manage address line for recipient",
		component: null,
		action: null,
		openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.MANAGE_ADDRESS_RECIPIENT) }
	},
	"ctrl+shift+b": {
		key: "ctrl+shift+b",
		description: "manage address line for sender",
		component: null,
		action: null,
		openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.MANAGE_ADDRESS_SENDER) }
	},
	"ctrl+shift+s": {
		key: "ctrl+shift+s",
		description: "Schreibakt Hinzufügen",
		component: null,
		action: null,
		openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_WRITING_PART) }
	},
}

export const contentMarkedKeyHandleDefinitions: Record<string, EditorKeyHandleItem> = {
	"alt+1": {
		key: 'alt+1',
		description: "insert line of date on top of the current element",
		component: null,
		action: null,
		openDialogAction: (_dispatch: AppDispatch) => {  }
	},
	"alt+v": {
		key: "alt+v",
		description: "move current writing act up",
		component: null,
		action: () => {
			return EditorUtils.keyPressHandles.baseHandling(EditorUtils.keyPressHandles.moveWritingActUp)
		}
	},
	"alt+shift+!": {
		key: "alt+shift+!",
		description: "date when marking content",
		component: null,
		action: null,
		openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_WHEN_ADD) }
	},
	'alt+shift+"': {
		key: 'alt+shift+"',
		description: "date 'when-custom' marking content",
		component: null,
		action: null,
		openDialogAction: (dispatch: AppDispatch) => { console.info("Date when custom add"); return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_WHEN_CUSTOM_ADD) }
	},
	'alt+shift+§': {
		key: 'alt+shift+§',
		description: "date 'notAfter' marking content",
		component: null,
		action: null,
		openDialogAction: (dispatch: AppDispatch) => { console.info("Date when custom add"); return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_NOT_AFTER_ADD) }
	},
	'alt+shift+$': {
		key: 'alt+shift+$',
		description: "date 'notBefore' marking content",
		component: null,
		action: null,
		openDialogAction: (dispatch: AppDispatch) => { console.info("Date when custom add"); return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_NOT_BEFORE_ADD) }
	},
	'alt+shift+%': {
		key: 'alt+shift+%',
		description: "date 'From-To' marking content",
		component: null,
		action: null,
		openDialogAction: (dispatch: AppDispatch) => { console.info("Date when custom add"); return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_FROM_TO_ADD) }
	},
	'alt+shift+&': {
		key: 'alt+shift+&',
		description: "date 'notBefore-notAfter' marking content",
		component: null,
		action: null,
		openDialogAction: (dispatch: AppDispatch) => { console.info("Date when custom add"); return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.DATE_NOT_BEFORE_AFTER_ADD) }
	},
	"shift+alt+v": {
		key: "shift+alt+v",
		description: "move current writing act down",
		component: null,
		action: () => {
			return EditorUtils.keyPressHandles.baseHandling(EditorUtils.keyPressHandles.moveWritingActDown)
		}
	},
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

  "ctrl+alt+v": {
    key: "ctrl+alt+v",
    description: "letters to protagonist",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_LETTER_TO_PROTAG) }
  },
  "ctrl+alt+b": {
    key: "ctrl+alt+b",
    description: "letters from protagonist",
    component: null,
    action: null,
    openDialogAction: (dispatch: AppDispatch) => { return EditorUtils.keyPressHandles.openDialog(dispatch, EditorConstants.dialogTypes.ADD_LETTER_FROM_PROTAG) }
  },
}
