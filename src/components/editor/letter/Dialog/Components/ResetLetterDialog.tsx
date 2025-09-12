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
import { DefaultDialogProps} from '../EditorFormDialog';
import {MiscUtils} from "../../../../../utils/misc";

const ResetLetterDialog = (props: DefaultDialogProps) => {

  const dispatch = useAppDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)

  const resetLetter = async  () => {
			if (!stateEditorLetter || !stateEditorLetter.id) {
				enqueueSnackbar("Letter could not reset on backend side: No letter id found", { variant: "error" })
				props.onClose();
				return;
			}

			try {
				await EditorUtils.backendService.resetLetter(stateEditorLetter.id)
				dispatch(setReloadLetterContent({ reloadLetterContent: true}))
				enqueueSnackbar(`Der Brief '${stateEditorLetter.name}' wurde zurückgesetzt!`, { variant: "success" })
			} catch (error) {
				enqueueSnackbar("Error during backend update. " + MiscUtils.misc.getErrorMessage(error), { variant: "error" });
      }
		props.onClose();
  }

  return(
    <>
      <DialogContent>
        Sind Sie sicher, dass Sie alle bisherigen Anpassungen verwerfen möchten?
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
          onClick={ () => resetLetter() }
          color="primary"
          autoFocus>
          Zurücksetzen
        </Button>
      </DialogActions>
    </>
  )
}

export default  ResetLetterDialog;
