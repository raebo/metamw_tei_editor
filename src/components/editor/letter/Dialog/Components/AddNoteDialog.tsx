import { FormControl, InputLabel, MenuItem, Select, TextareaAutosize } from "@mui/material";
import Button from "@mui/material/Button";
import React, { useState } from "react";
import { EditorUtils } from "../../../../../utils/editor";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../redux/redux.store";
import { MiscUtils } from "../../../../../utils/misc";
import { setReloadLetterContent } from "../../../../../redux/slices/editor.letter.slice";
import { useAppDispatch } from "../../../../../redux/hooks";
import { enqueueSnackbar } from "notistack";
import { EditorConstants } from "../../../../../constants/editor";

interface NoteDialogProps {
  onClose: () => void; // Function to close the dialog
}

const AddNoteDialog = (props: NoteDialogProps) => {
  const [comment, setComment] = useState("");
  const [noteType, setNoteType] = useState("");
  const [noteLanguage, setNoteLanguage] = useState("");
  const markedSpan = EditorUtils.textMarking.markedSpanEntry();
  const markedSection =
    markedSpan?.parentElement?.innerHTML || "<p>No marked section found</p>";


  const dispatch = useAppDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)

  const handleSubmit = () => {
    const xmlContent = EditorUtils.xmlCheck.letterXml();
    const userNameShort = MiscUtils.userHandling.nameShortCut(
      MiscUtils.userHandling.stateUserToAuthUser(user)
    );

    if (xmlContent !== null) {
      const noteMarkup = EditorUtils.markupGeneration.noteMarkup(xmlContent, userNameShort, comment, noteType);

      EditorUtils.backendService.patchContent(
        noteMarkup.xmlString, stateEditorLetter.id, EditorConstants.changeTypes.note.ADDED, noteMarkup.xmlId
      ).then(
        (result) => {
          if (result) {
            dispatch(setReloadLetterContent({ reloadLetterContent: true }))
            enqueueSnackbar("Note added", { variant: "success" })
          } else {
            enqueueSnackbar("Data could not be updated on backend side", { variant: "error" })
          }
        }
      ).catch((error) => {
        enqueueSnackbar("Data could not be updated on backend side: " +  error.toString(), { variant: "error" })
      })
    } else {
      enqueueSnackbar("No xml content found", { variant: "error" })
    }

    props.onClose();
  };

  return (
    <div style={{padding: 5}}>
      <div style={{padding: 5}}>
        <div id="noteReferencedXmlWrapper" style={{padding: 5}}>
          <div id="noteReferencedXml" dangerouslySetInnerHTML={{ __html: markedSection }} />
        </div>
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
              { EditorConstants.noteTypeItems.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              )) }
            </Select>
          </FormControl>
        </div>

        <div className="form-item form-item--key">
          <FormControl variant="filled" sx={{m: 1, minWidth: 120, width: '100%'}}>
            <InputLabel id="auto-anno-snippet-reference-type">Kommentar (Sprache)</InputLabel>
            <Select
              defaultValue={""}
              disabled={false}
              labelId="demo-simple-select-filled-label"
              id="demo-simple-select-filled"
              onChange={(event) => setNoteLanguage(event.target.value)}
            >
              { EditorConstants.noteTypeLanguages.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              )) }
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
              size={EditorConstants.styles.panel.buttonSize}
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              style={{ marginTop: 8 }}
              disabled={!comment.trim() || noteType === "" || noteLanguage === ""} // Disable if empty
            >
             Einfügen
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddNoteDialog
