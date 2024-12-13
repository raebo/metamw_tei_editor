import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { SnippetDialogType } from "../../../services/mappings/autoAnnoMappings";


interface SnippetFormDialogProps {
  open: boolean;
  dialogType: SnippetDialogType;
  handleClickSubmit: () => void;
  handleClose: () => void;
}

export default function SnippetFormDialog(props: SnippetFormDialogProps) {
  const { dialogType } = props;

  let dialogTitle = ""; let dialogContent = ""; let dialogSubmit = "";

  if (dialogType === "REJECT") {
    dialogTitle = "Auszeichnung Löschen";
    dialogContent = "Sind Sie sicher, dass Sie diese Auszeichnung löschen möchten?";
    dialogSubmit = "Löschen";
  }

  if (dialogType === "ACCEPT") {
    dialogTitle = "Auszeichnung Übernehmen";
    dialogContent = "Sind Sie sicher, dass Sie diese Auszeichnung speichern möchten?";
    dialogSubmit = "Speichern";
  }

  return (
    <React.Fragment>
      <Dialog
        open={props.open}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          { dialogTitle }
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            { dialogContent }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={props.handleClose}>Zurück</Button>
          <Button onClick={props.handleClickSubmit} autoFocus>
            { dialogSubmit }
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}