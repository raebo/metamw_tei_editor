import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { Divider, Typography } from "@mui/material";
import DialogActions from "@mui/material/DialogActions";
import { EditorConstants } from "../../../../constants/editor";
import { ComponentMappingItem } from "../../../../services/mappings/editorMappings";
import AddNoteDialog from "./Components/AddNoteDialog";
import { setDialogType, setEditorSelectedItem } from "../../../../redux/slices/editor.letter.slice";
import { useAppDispatch } from "../../../../redux/hooks";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/redux.store";
import ResetLetterDialog from "./Components/ResetLetterDialog";
import EditNoteDialog from "./Components/EditNoteDialog";

interface EditorFormDialogProps {
  open: boolean
  // dialogType: string
  // handleClickSubmit: () => void;
  // handleClose: () => void;
}


const EditorFormDialog = (props: EditorFormDialogProps) => {
 const dispatch = useAppDispatch()

  const dialogType = useSelector((state: RootState) => state.editorLetter.dialogType)
  const [isOpen, setIsOpen] = React.useState(props.open)
  const [dialogTitle, setDialogTitle] = React.useState("")
  const [dialogContent, setDialogContent] = React.useState("")
  const [selectedDialogComp, setSelectedDialogComp] = useState<ReactNode| null>(null)

  const isMounted = useRef(false);

  useEffect(() => {
    const initDialog = () => {
      if (dialogType !== null) {
        setDialogTitle(DialogTitles[dialogType])
        setSelectedDialogComp(DialogContentComponents[dialogType])
        setIsOpen(true)
      }
    }

    initDialog()

    //eslint-disable-next-line
  }, [dialogType]);


  const handleClose = () => {
    setIsOpen(false)
    dispatch(setDialogType({ dialogType: null }))
    dispatch(setEditorSelectedItem({ selectedItem: { left: null, right: null } }))
  }

  const DialogTitles : Record<string, string> = {
    [EditorConstants.dialogTypes.ADD_NOTE]: "Kommentar Hinzufügen",
    [EditorConstants.dialogTypes.EDIT_NOTE]: "Kommentar Bearbeiten",
    [EditorConstants.dialogTypes.RESET_LETTER]: "Brief Zurücksetzen"
  }

  const DialogContentComponents : Record<string, React.ReactNode> = {
    [EditorConstants.dialogTypes.ADD_NOTE]: <AddNoteDialog onClose={handleClose} />,
    [EditorConstants.dialogTypes.EDIT_NOTE]: <EditNoteDialog onClose={handleClose} />,
    [EditorConstants.dialogTypes.RESET_LETTER]: <ResetLetterDialog onClose={handleClose} />
  }

  return (
    <React.Fragment>
      <Dialog
        onClose={handleClose}
        open={isOpen}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          { dialogTitle }
          <hr />
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          { selectedDialogComp }
        </DialogContent>
        <DialogActions>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="textSecondary">
            Zum Schließen auf den Hintergrund klicken oder ESC drücken
          </Typography>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  )
}

export default EditorFormDialog
