import React, { useEffect, useState } from "react";
import { useAppDispatch } from "../../../../../redux/hooks";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../redux/redux.store";
import { EditorUtils } from "../../../../../utils/editor";
import Button from "@mui/material/Button";
import {Divider, FormControl, InputLabel, MenuItem, Select, TextareaAutosize} from "@mui/material";
import { EditorConstants } from "../../../../../constants/editor";
import { setReloadLetterContent } from "../../../../../redux/slices/editor.letter.slice";
import { enqueueSnackbar } from "notistack";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import { DefaultDialogProps } from '../EditorFormDialog';


const EditNoteDialog = (props: DefaultDialogProps) => {

  const dispatch = useAppDispatch();
  const stateLetterReference = useSelector((state: RootState) => state.editorLetter.letterReference)
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("");
  const [noteLanguage, setNoteLanguage] = useState("");
  const noteTypeItems = EditorConstants.noteTypeItems;
  const noteLanguages = EditorConstants.noteTypeLanguages;
  const [noteParentContent, setNoteParentContent] = useState("")
  const [noteXmlId, setNoteXmlId] = useState("")
  const [deleteButtonsVisible, setDeleteButtonsVisible] = useState(false)

  useEffect(() => {
    const initNoteContent = (xmlId: string) => {
      const note = EditorUtils.xmlCheck.elementByXmlTypeAndId(xmlId, 'note')
      if (note) {
        if (note?.parentElement) {
          setNoteParentContent(note?.parentElement?.innerHTML)
        }

        setNoteContent(note?.textContent?.trim() || "")
        setNoteXmlId(xmlId)

        const currentNoteTypes = noteTypeItems.filter((item) => item.value === note.getAttribute('type'))
        if (currentNoteTypes.any()) { setNoteType(currentNoteTypes[0].value) }

        const currentNoteLangs = noteLanguages.filter((item) => item.value === note.getAttribute('xml:lang'))
        if (currentNoteLangs.any()) { setNoteLanguage(currentNoteLangs[0].value) }
      }
    }

    if (stateLetterReference.elementXmlId) {
      initNoteContent(stateLetterReference.elementXmlId)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateLetterReference]);

  const handleDeleteNote= () => {
    try {
      const noteMarkup = EditorUtils.markupGeneration.deleteNoteMarkup(noteXmlId)

      EditorUtils.backendService.patchContent(
        noteMarkup.xmlString, stateEditorLetter.id, EditorConstants.changeTypes.note.REMOVED, noteXmlId
      ).then((result) => {
        if (result) {
          dispatch(setReloadLetterContent({reloadLetterContent: true}))
          enqueueSnackbar("Note deleted", {variant: "success"})
        } else {
          enqueueSnackbar("Data could not be updated on backend side", {variant: "error"})
        }
      }).catch(error => {
        enqueueSnackbar("Data could not be updated on backend side: " + error.toString(), {variant: "error"})
      })
    } catch (error) {
      enqueueSnackbar("No xml content found", {variant: "error"})
    }

    props.onClose()
  }

  const handleUpdateNote= () => {
    try {
      const noteMarkup =
        EditorUtils.markupGeneration.updateNoteMarkup(
          noteXmlId,
          noteType,
          noteLanguage,
          noteContent
        )

      EditorUtils.backendService.patchContent(
        noteMarkup.xmlString, stateEditorLetter.id, EditorConstants.changeTypes.note.ADDED, noteXmlId
      ).then(
        (result) => {
          if (result) {
            dispatch(setReloadLetterContent({ reloadLetterContent: true }))
            enqueueSnackbar("Note updated", { variant: "success" })
          } else {
            enqueueSnackbar("Data could not be updated on backend side", { variant: "error" })
          }
        }
      ).catch((error) => {
        enqueueSnackbar("Data could not be updated on backend side: " +  error.toString(), { variant: "error" })
      })
    } catch {
      enqueueSnackbar("No xml content found", { variant: "error" })
    }
    props.onClose()
  }

  return(
    <div style={{padding: 5}}>
      <DialogContent>
        <div id="noteReferencedXmlWrapper" style={{padding: 5}}>
          <div id="noteReferencedXml" dangerouslySetInnerHTML={{ __html: noteParentContent }} />
        </div>
        <div className="form-item form-item--key">
          <FormControl variant="filled" sx={{m: 1, minWidth: 120, width: '100%'}}>
            <InputLabel id="auto-anno-snippet-reference-type">Kommentar (Typ)</InputLabel>
            <Select
              value={noteType}
              disabled={deleteButtonsVisible}
              labelId="demo-simple-select-filled-label"
              id="demo-simple-select-filled"
              onChange={(event) => setNoteType(event.target.value)}
            >
              { noteTypeItems.map((item) => (
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
              value={noteLanguage}
              disabled={deleteButtonsVisible}
              labelId="demo-simple-select-filled-label"
              id="demo-simple-select-filled"
              onChange={(event) => setNoteLanguage(event.target.value)}
            >
              { noteLanguages.map((item) => (
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
            disabled={deleteButtonsVisible}
            placeholder="Kommentar"
            style={{ width: "100%", padding: 8 }}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
        </div>
        </DialogContent>
				<Divider />
        <DialogActions>
          { !deleteButtonsVisible && <Button
              variant="contained"
              color="primary"
              size={EditorConstants.styles.panel.buttonSize}
              onClick={() => { setDeleteButtonsVisible(true) }}
              style={{ marginTop: 8 }}
          >
              Löschen
          </Button> }
          { !deleteButtonsVisible && <Button
            variant="contained"
            color="primary"
            size={EditorConstants.styles.panel.buttonSize}
            onClick={ handleUpdateNote }
            style={{ marginTop: 8 }}
            disabled={!noteContent.trim() || noteType === "" || noteLanguage === ""}
          >
            Aktualisieren
          </Button> }

          { deleteButtonsVisible && <Button
              variant="outlined"
              size={EditorConstants.styles.panel.buttonSize}
              color="primary"
              onClick={() => { setDeleteButtonsVisible(false) }}
              style={{ marginTop: 8 }}
          >
              Abbrechen
          </Button> }

          { deleteButtonsVisible && <Button
              variant="contained"
              size={EditorConstants.styles.panel.buttonSize}
              color="primary"
              onClick={ handleDeleteNote }
              style={{ marginTop: 8 }}
          >
              Löschen
          </Button> }
        </DialogActions>
    </div>
  )
}

export default  EditNoteDialog;
