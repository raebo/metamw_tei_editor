import { useCallback, useEffect } from "react";
import { useAppDispatch } from "../../../../redux/hooks";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/redux.store";
import { contentMarkedKeyHandleDefinitions } from "./lib/keyHandlerDefinitions";
import { setReloadLetterContent } from "../../../../redux/slices/editor.letter.slice";
import { enqueueSnackbar } from "notistack";
import { EditorUtils } from "../../../../utils/editor";

const EditorKeyHandle = () => {

  const dispatch = useAppDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)
  const stateLetterContent= useSelector((state: RootState) => state.editorLetter.content);

  const handleFunction = useCallback((event: any) => {
    for (const [keyCombo, definition] of Object.entries(contentMarkedKeyHandleDefinitions)) {
      const keys = keyCombo.split("+"); // Split "ctrl+b" into ["ctrl", "b"]

      const isCtrlPressed = keys.includes("ctrl") && event.ctrlKey;
      const isMetaPressed = keys.includes("meta") && event.metaKey; // For macOS Cmd
      const isAltPressed = keys.includes("alt") && event.altKey;
      const isShiftPressed = keys.includes("shift") && event.shiftKey;
      const mainKey = keys[keys.length - 1]; // Last part should be the main key (e.g., "b")

      if (
        (isCtrlPressed || isMetaPressed || isAltPressed || isShiftPressed) &&
        event.key.toLowerCase() === mainKey
      ) {
        event.preventDefault(); // Prevent system default behavior
        event.stopPropagation(); // Prevent bubbling

        if (!definition?.action || stateEditorLetter.id === null) return;

        definition.action(stateEditorLetter.id).then((xmlContent) => {
          if (xmlContent) {
            EditorUtils.backendService.patchContent(
              xmlContent,
              stateEditorLetter.id,
              "CONTENT_FORMAT_CHANGED",
              null
            ).then(() => {
              dispatch(setReloadLetterContent({ reloadLetterContent: true }));
            })
          }
        }).catch((error) => {
          enqueueSnackbar(`Error during calling keybinding: '${definition.description}'`, { variant: "error" });
        })

      }
    }
  }, [stateEditorLetter]);

  useEffect(() => {
    const initContentMarkedKeyFunction= () => {
      document.addEventListener("keydown", handleFunction, false);
    }

    if (stateLetterContent.textIsMarked) {
      initContentMarkedKeyFunction()
    }

    return () => {
      for (const [key, definition] of Object.entries(contentMarkedKeyHandleDefinitions)) {
        if (definition.action !== null) {
          document.removeEventListener("keydown", handleFunction, false);
          console.log("Removed key event listener")
        }
      }
    };
  }, [stateLetterContent]);

  return (
    <>
    </>
  );
}

export default EditorKeyHandle;
