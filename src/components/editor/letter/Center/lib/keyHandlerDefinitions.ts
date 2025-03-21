import { EditorKeyHandleItem } from "../../../../../services/mappings/editorMappings";
import { EditorUtils } from "../../../../../utils/editor";
import { AppDispatch } from "../../../../../redux/redux.store";
import { EditorConstants } from "../../../../../constants/editor";

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
  }
}
