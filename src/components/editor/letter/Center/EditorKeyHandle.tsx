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
      const requiredModifiers = keys.slice(0, -1); // ["ctrl", "alt"]
      const mainKey = keys[keys.length - 1]; // "k"

      const isModifiersPressed = requiredModifiers.every((key) => {
        return (
          (key === "ctrl" && event.ctrlKey) ||
          (key === "meta" && event.metaKey) || // For macOS Cmd
          (key === "alt" && event.altKey) ||
          (key === "shift" && event.shiftKey)
        );
      });

      if (
        isModifiersPressed && event.key.toLowerCase() === mainKey
      ) {
        event.preventDefault(); // Prevent system default behavior
        event.stopPropagation(); // Prevent bubbling

        if ((!definition?.action && !definition.openDialogAction) || stateEditorLetter.id === null) return;

        if (definition.action) {
          definition.action().then((xmlContent) => {
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
            enqueueSnackbar(`Error during calling keybinding: '${definition.description} ${error.toString()}'`, { variant: "error" });
          })
        } else if (definition.openDialogAction) {
          definition.openDialogAction(dispatch);
        }
      }
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateEditorLetter]);

  useEffect(() => {
    const initContentMarkedKeyFunction= () => {
      document.addEventListener("keydown", handleFunction, false);
    }

    if (stateLetterContent.textIsMarked) {
      initContentMarkedKeyFunction()
    }

    return () => {
      for (const definition of Object.values(contentMarkedKeyHandleDefinitions)) {
        if (definition.action !== null) {
          document.removeEventListener("keydown", handleFunction, false);
          console.log("Removed key event listener")
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateLetterContent]);

  return (
    <>
    </>
  );
}

export default EditorKeyHandle;
