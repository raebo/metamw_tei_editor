import { ListItemButton, ListItemIcon } from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/redux.store";
import { contentMarkedKeyHandleDefinitions } from "../Center/lib/keyHandlerDefinitions";
import { enqueueSnackbar } from "notistack";
import { EditorUtils } from "../../../../utils/editor";
import { setReloadLetterContent } from "../../../../redux/slices/editor.letter.slice";
import { useAppDispatch } from "../../../../redux/hooks";

const QuickContentFormatter = () => {

  const dispatch = useAppDispatch();
  const contentTextIsMarked = useSelector((state: RootState) => state.editorLetter.content.textIsMarked);
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)
  const [iconsAreActive, setIconsAreActive] = useState<boolean>(false)

  useEffect(() => {
    setIconsAreActive(!!contentTextIsMarked);
  }, [contentTextIsMarked]);

  const onClickButton = (keyCombination: string) => {
    const handleDef = Object.values(contentMarkedKeyHandleDefinitions).filter(
      (item) => item.key === keyCombination
    )[0];

    if (!handleDef) {
      enqueueSnackbar(`Keybinding '${keyCombination}' not found`, { variant: "error" });
      return
    }

    if (handleDef.action !== null) {
      handleDef.action().then((xmlContent) => {
        if (xmlContent) {
          EditorUtils.backendService.patchContent(
            xmlContent,
            stateEditorLetter.id,
            "CONTENT_FORMAT_CHANGED",
            null
          ).then(() => {
            dispatch(setReloadLetterContent({reloadLetterContent: true}));
          })
        }
      }).catch((error) => {
        enqueueSnackbar(`Error during calling keybinding: '${handleDef.description}' ${error.toString()}`, {variant: "error"});
      })
    }
  }

  return (
    <>
      <ListItemButton onClick={() => onClickButton("ctrl+b")}>
        <ListItemIcon>
          <FormatBoldIcon color={iconsAreActive ? "primary" : "disabled"} />
        </ListItemIcon>
      </ListItemButton>
      <ListItemButton onClick={() => onClickButton("ctrl+i")}>
        <ListItemIcon>
          <FormatItalicIcon color={iconsAreActive ? "primary" : "disabled"} />
        </ListItemIcon>
      </ListItemButton>
      <ListItemButton onClick={() => onClickButton("ctrl+u")}>
        <ListItemIcon>
          <FormatUnderlinedIcon color={iconsAreActive ? "primary" : "disabled"} />
        </ListItemIcon>
      </ListItemButton>
    </>
  )
}

export default QuickContentFormatter;
