import Dialog from "@mui/material/Dialog";
import React from "react";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";

const SpecialDialogContainer = () => {

  const handleClose = () => {

  }

  return (
    <React.Fragment>
      <Dialog
        open={true}
        onClose={handleClose}
        >
        <DialogTitle id="alert-dialog-title">
          { "dialogTitle" }
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            { "DialogContent" }
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
}
