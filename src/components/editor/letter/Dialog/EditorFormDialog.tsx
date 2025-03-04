import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { Divider, Typography } from "@mui/material";
import DialogActions from "@mui/material/DialogActions";
import { EditorConstants } from "../../../../constants/editor";
import { ComponentMappingItem } from "../../../../services/mappings/editorMappings";
import NoteDialog from "./Components/NoteDialog";

interface EditorFormDialogProps {
  open: boolean
  dialogType: string
  // handleClickSubmit: () => void;
  // handleClose: () => void;
}


const EditorFormDialog = (props: EditorFormDialogProps) => {

  const [isOpen, setIsOpen] = React.useState(props.open)
  const [dialogTitle, setDialogTitle] = React.useState("")
  const [dialogContent, setDialogContent] = React.useState("")
  const [selectedComponentRight, setSelectedComponentRight] = useState<ReactNode| null>(null)

  const isMounted = useRef(false);

  useEffect(() => {
    if(!isMounted.current) {
      setDialogTitle(DialogTitles[props.dialogType])
      setSelectedComponentRight(DialogContentComponents[props.dialogType])
      isMounted.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleClose = () => {
    setIsOpen(false)
  }

  const DialogTitles : Record<string, string> = {
    [EditorConstants.compMappingRight.ENT_NOTE]: "Kommentar Hinzufügen"
  }

  const DialogContentComponents : Record<string, React.ReactNode> = {
    [EditorConstants.compMappingRight.ENT_NOTE]: <NoteDialog onClose={handleClose} />
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
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          { selectedComponentRight }
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
