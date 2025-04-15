import React, { useCallback, useEffect } from "react";
import { useAppDispatch } from "../../../../redux/hooks";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/redux.store";
import { allTimesAvailableKeyHandleDefinitions, contentMarkedKeyHandleDefinitions } from "./lib/keyHandlerDefinitions";
import { setReloadLetterContent } from "../../../../redux/slices/editor.letter.slice";
import { enqueueSnackbar } from "notistack";
import { EditorUtils } from "../../../../utils/editor";
import { EditorKeyHandleItem } from "../../../../services/mappings/editorMappings";

const EditorKeyHandle = () => {

  const dispatch = useAppDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)
  const stateLetterContent= useSelector((state: RootState) => state.editorLetter.content);

  const handleFunction = useCallback((event: KeyboardEvent, keyDefinitions: Record<string, EditorKeyHandleItem>) => {
    for (const [keyCombo, definition] of Object.entries(keyDefinitions)) {
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
    const globalKeyListener = (event: KeyboardEvent) => {
      handleFunction(event, allTimesAvailableKeyHandleDefinitions); }
    document.addEventListener("keydown", globalKeyListener, false);

    let markedKeyListener: (event: KeyboardEvent) => void;
    if (stateLetterContent.textIsMarked) {
      markedKeyListener = (event: KeyboardEvent) => {
        handleFunction(event, contentMarkedKeyHandleDefinitions); }
      document.addEventListener("keydown", markedKeyListener, false);
    }

    return () => {
      document.removeEventListener("keydown", globalKeyListener, false);
      if (stateLetterContent.textIsMarked && markedKeyListener) {
        document.removeEventListener("keydown", markedKeyListener, false);
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
