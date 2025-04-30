import React from 'react';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import { useEffect, } from "react";
import { fetchMetamwEntityData } from "../../../services/auto_anno/apiMetaMw.service";
import { enqueueSnackbar } from "notistack";
import DynamicDataDisplay from "../../support/DynamicDataDisplay";
import { DISPLAY_NAME_MAP } from "../../../utils/entityMappings";
import { Divider, Typography } from "@mui/material";

interface SnippetReferencesInfoDialogProps {
  open: boolean,
  referenceKey: string | null,
  handleClose: () => void
}

const SnippetEntityInfoDialog = (props: SnippetReferencesInfoDialogProps) => {

  const [displayData, setDisplayData] = React.useState<{ [key: string]:string}|null>(null);

  useEffect(() => {
    (async () => {
      if (props.referenceKey) {
        try {
          const result = await fetchMetamwEntityData(String(props.referenceKey));

          setDisplayData(result)
        } catch (error) {
          enqueueSnackbar(`Error fetching data for entity with key: ${props.referenceKey}` , { variant: "error" });
        }
      }
    })();
  }, [props.referenceKey]);

  return (
    <React.Fragment>
      <Dialog
        open={props.open}
        onClose={props.handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        fullWidth={true}
        maxWidth={"lg"}
      >
        <DialogTitle id="alert-dialog-title">
          { `Informationen für - ${props.referenceKey}` }
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
          </DialogContentText>
            <DynamicDataDisplay data={displayData} displayNameMap={DISPLAY_NAME_MAP} />
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

export default SnippetEntityInfoDialog
