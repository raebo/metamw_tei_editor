import React, { ReactNode, useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import { Divider, Typography } from "@mui/material";
import DialogActions from "@mui/material/DialogActions";
import { EditorConstants } from "../../../../constants/editor";
import AddNoteDialog from "./Components/AddNoteDialog";
import { setDialogType, setEditorSelectedItem } from "../../../../redux/slices/editor.letter.slice";
import { useAppDispatch } from "../../../../redux/hooks";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/redux.store";
import ResetLetterDialog from "./Components/ResetLetterDialog";
import EditNoteDialog from "./Components/EditNoteDialog";
import DateAddDialog from "./Components/Date/DateAddDialog";
import AttachmentAddDialog from "./Components/Misc/AttachmentAddDialog";
import AddWritingActDialog from './Components/AddWritingActDialog';
import ManageTeiHeaderDialog from './Components/ManageTeiHeaderDialog';
import AddNewLetterDialog from './Components/AddNewLetterDialog';
import PublishLetterDialog from './Components/PublishLetterDialog';
import ChooseGbLetterDialog from './Components/AssignLetterDialog/ChooseGbLetterDialog';
import ChooseProtagLetterDialog from './Components/AssignLetterDialog/ChooseProtagLetterDialog';
import ManageTeiHeaderAuthorWriterDialog from "./Components/ManageTeiHeaderAuthorWriterDialog";
import ManageTeiHeaderReceiverDialog from "./Components/ManageTeiHeaderReceiverDialog";

interface EditorFormDialogProps {
  open: boolean
  xmlRef:  React.RefObject<HTMLDivElement>,
}

export interface DefaultDialogProps {
  setWidth: (width: number | string) => void,
  xmlRef: React.RefObject<HTMLDivElement>;
  onClose: () => void,
}


const EditorFormDialog = (props: EditorFormDialogProps) => {
 const dispatch = useAppDispatch()

  const dialogType = useSelector((state: RootState) => state.editorLetter.dialogType)
  const [dialogWidth, setDialogWidth] = useState<string | number>('auto');
  const [isOpen, setIsOpen] = React.useState(props.open)
  const [dialogTitle, setDialogTitle] = React.useState("")
  const [selectedDialogComp, setSelectedDialogComp] = useState<ReactNode| null>(null)

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
    [EditorConstants.dialogTypes.EDIT_NOTE]: "Kommentar Bearbeiten/Löschen",
    [EditorConstants.dialogTypes.RESET_LETTER]: "Brief Zurücksetzen",
    [EditorConstants.dialogTypes.PUBLISH_LETTER]: "Brief Veröffentlichen",
    [EditorConstants.dialogTypes.DATE_WHEN_ADD]: "Datum 'WHEN' Auszeichnen",
    [EditorConstants.dialogTypes.DATE_WHEN_CUSTOM_ADD]: "Datum 'WHEN CUSTOM' Auszeichnen",
    [EditorConstants.dialogTypes.DATE_NOT_AFTER_ADD]: "Datum 'Not After' Auszeichnen",
    [EditorConstants.dialogTypes.DATE_NOT_BEFORE_ADD]: "Datum 'Not Before' Auszeichnen",
    [EditorConstants.dialogTypes.DATE_FROM_TO_ADD]: "Datum 'From To' Auszeichnen",
    [EditorConstants.dialogTypes.DATE_NOT_BEFORE_AFTER_ADD]: "Datum 'NotBefore NotAfter' Auszeichnen",
    [EditorConstants.dialogTypes.ATTACHMENT_ADD]: "Beilage Hinzufügen",
    [EditorConstants.dialogTypes.ADD_WRITING_PART]: "Schreibakt Hinzufügen",
    [EditorConstants.dialogTypes.ADD_TEI_HEADER]: "Header des Briefes Hinzufügen/Bearbeiten",
    [EditorConstants.dialogTypes.ADD_NEW_LETTER]: "Neuen Brief Hinzufügen",
    [EditorConstants.dialogTypes.ADD_LETTER_TO_PROTAG]: "Verweis an einen Brief an den Protagonisten Hinzufügen",
    [EditorConstants.dialogTypes.ADD_LETTER_FROM_PROTAG]: "Verweis an einen Brief vom Protagonisten Hinzufügen",
		[EditorConstants.dialogTypes.MANAGE_HEADER_AUTHOR_WRITER]: "Autoren/Schreiber Verwalten",
		[EditorConstants.dialogTypes.MANAGE_HEADER_RECEIVER]: "Empfänger Verwalten",
  }

  const DialogContentComponents : Record<string, React.ReactNode> = {
    [EditorConstants.dialogTypes.ADD_NOTE]: <AddNoteDialog xmlRef={props.xmlRef} onClose={handleClose} setWidth={setDialogWidth} />,
    [EditorConstants.dialogTypes.EDIT_NOTE]: <EditNoteDialog xmlRef={props.xmlRef} onClose={handleClose}  setWidth={setDialogWidth} />,
    [EditorConstants.dialogTypes.RESET_LETTER]: <ResetLetterDialog xmlRef={props.xmlRef} onClose={handleClose}  setWidth={setDialogWidth} />,
    [EditorConstants.dialogTypes.PUBLISH_LETTER]: <PublishLetterDialog xmlRef={props.xmlRef} onClose={handleClose}  setWidth={setDialogWidth} />,
    [EditorConstants.dialogTypes.DATE_WHEN_ADD]: <DateAddDialog xmlRef={props.xmlRef} onClose={handleClose} setWidth={setDialogWidth} dateType={EditorConstants.dateDialog.dateTypes.WHEN}/>,
    [EditorConstants.dialogTypes.DATE_WHEN_CUSTOM_ADD]: <DateAddDialog xmlRef={props.xmlRef} onClose={handleClose} setWidth={setDialogWidth} dateType={EditorConstants.dateDialog.dateTypes.WHEN_CUSTOM}/>,
    [EditorConstants.dialogTypes.DATE_NOT_AFTER_ADD]: <DateAddDialog xmlRef={props.xmlRef} onClose={handleClose} setWidth={setDialogWidth} dateType={EditorConstants.dateDialog.dateTypes.NOT_AFTER}/>,
    [EditorConstants.dialogTypes.DATE_NOT_BEFORE_ADD]: <DateAddDialog xmlRef={props.xmlRef} onClose={handleClose} setWidth={setDialogWidth} dateType={EditorConstants.dateDialog.dateTypes.NOT_BEFORE}/>,
    [EditorConstants.dialogTypes.DATE_FROM_TO_ADD]: <DateAddDialog xmlRef={props.xmlRef} onClose={handleClose} setWidth={setDialogWidth} dateType={EditorConstants.dateDialog.dateTypes.FROM_TO}/>,
    [EditorConstants.dialogTypes.DATE_NOT_BEFORE_AFTER_ADD]: <DateAddDialog xmlRef={props.xmlRef} onClose={handleClose} setWidth={setDialogWidth} dateType={EditorConstants.dateDialog.dateTypes.NOT_BEFORE_NOT_AFTER}/>,
    [EditorConstants.dialogTypes.ATTACHMENT_ADD]: <AttachmentAddDialog xmlRef={props.xmlRef} onClose={handleClose}  setWidth={setDialogWidth} />,
    [EditorConstants.dialogTypes.ADD_WRITING_PART]: <AddWritingActDialog xmlRef={props.xmlRef} onClose={handleClose}  setWidth={setDialogWidth} />,
    [EditorConstants.dialogTypes.ADD_TEI_HEADER]: <ManageTeiHeaderDialog xmlRef={props.xmlRef} onClose={handleClose} setWidth={setDialogWidth} />,
		[EditorConstants.dialogTypes.MANAGE_HEADER_AUTHOR_WRITER]: <ManageTeiHeaderAuthorWriterDialog xmlRef={props.xmlRef} onClose={handleClose} setWidth={setDialogWidth} />,
		[EditorConstants.dialogTypes.MANAGE_HEADER_RECEIVER]: <ManageTeiHeaderReceiverDialog xmlRef={props.xmlRef} onClose={handleClose} setWidth={setDialogWidth} />,
    [EditorConstants.dialogTypes.ADD_NEW_LETTER]: <AddNewLetterDialog xmlRef={props.xmlRef} onClose={handleClose}  setWidth={setDialogWidth} />,
    [EditorConstants.dialogTypes.ADD_LETTER_TO_PROTAG]: <ChooseGbLetterDialog xmlRef={props.xmlRef} onClose={handleClose}  setWidth={setDialogWidth} />,
    [EditorConstants.dialogTypes.ADD_LETTER_FROM_PROTAG]: <ChooseProtagLetterDialog xmlRef={props.xmlRef} onClose={handleClose}  setWidth={setDialogWidth} />,
  }

  return (
    <React.Fragment>
      <Dialog
        onClose={handleClose}
        open={isOpen}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        fullWidth
        maxWidth="lg"
        // sx={ { width: "auto" } }
      >
        <DialogTitle id="alert-dialog-title">
          { dialogTitle }
          <hr />
        </DialogTitle>
        <DialogContent sx={{ p: 2, width: dialogWidth }}>
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
