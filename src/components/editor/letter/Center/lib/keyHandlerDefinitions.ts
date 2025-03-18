import { EditorKeyHandleItem } from "../../../../../services/mappings/editorMappings";
import { EditorUtils } from "../../../../../utils/editor";

export const contentMarkedKeyHandleDefinitions: Record<string, EditorKeyHandleItem> = {
  "ctrl+b": {
    key: "ctrl+b",
      description: "mark content bold",
      component: null,
      action: ((letterId: number) => { return EditorUtils.keyPressHandles.baseHandling({letterId}, 'CONTENT_FORMAT_CHANGED', EditorUtils.keyPressHandles.markContentBold) })
  },
  "ctrl+i": {
    key: "ctrl+i",
      description: "mark content Italic",
      component: null,
      action: ((letterId: number) => { return EditorUtils.keyPressHandles.baseHandling({letterId}, 'CONTENT_FORMAT_CHANGED', EditorUtils.keyPressHandles.markContentItalic) })
  },
}
