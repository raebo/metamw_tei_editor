import React from 'react';
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../redux/redux.store";
import { useAppDispatch } from "../../../../../redux/hooks";
import { EditorUtils } from "../../../../../utils/editor";
import { setReloadLetterContent } from "../../../../../redux/slices/editor.letter.slice";
import { enqueueSnackbar } from "notistack";
import { EditorConstants } from "../../../../../constants/editor";
import { DefaultDialogProps } from '../EditorFormDialog';
import { Alert } from '@mui/material';

const PublishLetterDialog= (props: DefaultDialogProps) => {

  const dispatch = useAppDispatch();
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)

  const publishLetter = () => {

    if (stateEditorLetter?.id) {
      EditorUtils.backendService.publishLetter(
        stateEditorLetter.id
      ).then(() => {
        dispatch(setReloadLetterContent({ reloadLetterContent: true}))
        enqueueSnackbar(`Letter ${stateEditorLetter.name} successfully published!`, { variant: "success" })
        props.onClose();
      }
    ).catch((error) => {
      setErrorMessage(error.toString())
      enqueueSnackbar("Letter could not publisheed on backend side. Please check the details.",  { variant: "error" })
    })
    } else {
      enqueueSnackbar("Letter could not reset on backend side: No letter id found", { variant: "error" })
    }
  }

  return(
    <>
      <DialogContent>
        Sind Sie sicher, dass Sie den aktuellen Brief im Backend veröffentlichen möchten?

        <Alert severity="warning" sx={{ mt: 2 }}>
          ACHTUNG: Diese Aktion kann nicht rückgängig gemacht werden und der Brief wird im Dateisystem überschrieben!!!
        </Alert>

        {errorMessage && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
          )
        }
      </DialogContent>
      <DialogActions>
        <Button
          size={EditorConstants.styles.panel.buttonSize}
          variant="outlined"
          onClick={props.onClose}
          color="primary">
          Abbrechen
        </Button>
        <Button
          size={EditorConstants.styles.panel.buttonSize}
          variant="contained"
          onClick={ () => publishLetter() }
          color="primary"
          autoFocus>
          Veröffentlichen
        </Button>
      </DialogActions>
    </>
  )
}

export default  PublishLetterDialog;
