import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../redux/redux.store";
import { useAppDispatch } from "../../../../../redux/hooks";
import { EditorUtils } from "../../../../../utils/editor";
import { setReloadLetterContent } from "../../../../../redux/slices/editor.letter.slice";
import { enqueueSnackbar } from "notistack";

interface ResetLetterDialogProps {
  onClose: () => void; // Function to close the dialog
}

const ResetLetterDialog = (props: ResetLetterDialogProps) => {

  const dispatch = useAppDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)

  const resetLetter = () => {

    if (stateEditorLetter?.id) {
      EditorUtils.backendService.resetLetter(
        stateEditorLetter.id
      ).then(() => {
        dispatch(setReloadLetterContent({ reloadLetterContent: true}))
        enqueueSnackbar(`Letter content for ${stateEditorLetter.name} reset!`, { variant: "success" })
        props.onClose();
      }
    ).catch((error) => {
        enqueueSnackbar("Letter could not reset on backend side: " +  error.toString(), { variant: "error" })
      })
    } else {
      enqueueSnackbar("Letter could not reset on backend side: No letter id found", { variant: "error" })
    }

  }

  return(
    <>
      <DialogContent>
        Sind Sie sicher, dass Sie alle bisherigen Anpassungen verwerfen möchten?
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={props.onClose} color="primary">
          Abbrechen
        </Button>
        <Button variant="contained" onClick={ () => resetLetter() } color="primary" autoFocus>
          Zurücksetzen
        </Button>
      </DialogActions>
    </>
  )
}

export default  ResetLetterDialog;
