import Paper from "@mui/material/Paper";
import { FormControl, InputLabel, MenuItem, Select, TextareaAutosize } from "@mui/material";
import Button from "@mui/material/Button";
import React, { useState } from "react";
import { EditorUtils } from "../../../../../utils/editor";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../redux/redux.store";
import { MiscUtils } from "../../../../../utils/misc";
import { setEditorLetter, setReloadLetterContent } from "../../../../../redux/slices/editor.letter.slice";
import { useAppDispatch } from "../../../../../redux/hooks";
import { enqueueSnackbar } from "notistack";
import { Simulate } from "react-dom/test-utils";
import error = Simulate.error;

interface NoteDialogProps {
  onClose: () => void; // Function to close the dialog
}

const NoteDialog = (props: NoteDialogProps) => {
  const [comment, setComment] = useState("");
  const [noteType, setNoteType] = useState("");
  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters);
  const stateActiveTab = useSelector((state: RootState) => state.editorLetter.tabNumber);

  const noteTypeItems = [
    { value: "these_comment", label: "Themenkommentar" },
    { value: "single_place_comment", label: "Einzelstellenkommentar" },
    { value: "text_constitution", label: "Kommentar Textkonstitution" },
    { value: "word_description", label: "Worterklärung" },
  ];

  const handleSubmit = () => {
    const xmlContent = EditorUtils.xmlCheck.letterXml();
    const userNameShort = MiscUtils.userHandling.nameShortCut(
      MiscUtils.userHandling.stateUserToAuthUser(user)
    );

    if (xmlContent !== null) {
      const htmlString = EditorUtils.markupGeneration.noteMarkup(xmlContent, userNameShort, comment, noteType);
      const pinnedLetter = statePinnedLetters[stateActiveTab]
      let hasError = false

      EditorUtils.backendService.patchContent(
        htmlString, pinnedLetter.id
      ).then(
        (result) => {
          if (result) {
            dispatch(setReloadLetterContent({ reloadLetterContent: true }))
            enqueueSnackbar("Note added", { variant: "success" })
          } else {
            enqueueSnackbar("Data could not be updated on backend side", { variant: "error" })
            hasError = true
          }
        }
      ).catch((error) => {
        enqueueSnackbar("Data could not be updated on backend side: " +  error.toString(), { variant: "error" })
        hasError = true
      })
    } else {
      enqueueSnackbar("No xml content found", { variant: "error" })
    }

    props.onClose();
  };

  return (
    <>
      <div style={{padding: 5}}>
        <div className="form-item form-item--key">
          <FormControl variant="filled" sx={{m: 1, minWidth: 120, width: '100%'}}>
            <InputLabel id="auto-anno-snippet-reference-type">Kommentar (Typ)</InputLabel>
            <Select
              defaultValue={""}
              disabled={false}
              labelId="demo-simple-select-filled-label"
              id="demo-simple-select-filled"
              onChange={(event) => setNoteType(event.target.value)}
            >
              {noteTypeItems.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div className="form-item form-item--key" style={{margin: 5}}>
          <TextareaAutosize
            aria-label="comment"
            minRows={10}
            maxRows={20}
            placeholder="Kommentar"
            style={{ width: "100%", padding: 8 }}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div style={{ textAlign: "right" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              style={{ marginTop: 8 }}
              disabled={!comment.trim() || noteType === ""} // Disable if empty
            >
             Einfügen
            </Button>
          </div>
        </div>
      </div>
    </>
  );

}

export default NoteDialog
