import React, { useEffect, useRef } from 'react';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { useAppDispatch } from '@src/redux/hooks';
import { EditorUtils } from '@src/utils/editor';
import { setReloadLetterContent } from '@src/redux/slices/editor.letter.slice';
import { enqueueSnackbar } from 'notistack';
import { EditorConstants } from '@src/constants/editor';
import { DefaultDialogProps } from '../EditorFormDialog';
import { Alert } from '@mui/material';
import { MiscUtils } from '@src/utils/misc';

const PublishLetterDialog = (props: DefaultDialogProps) => {
  const dispatch = useAppDispatch();
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);

  const publishButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (publishButtonRef.current) {
      publishButtonRef.current.focus();
    }
  }, [props]);

  const publishLetter = async () => {
    if (!stateEditorLetter?.id) {
      enqueueSnackbar('Letter could not publish on backend side: No letter id found', {
        variant: 'error',
      });
      props.onClose();
      return;
    }

    try {
      await EditorUtils.backendService.publishLetter(stateEditorLetter.id);

      dispatch(setReloadLetterContent({ reloadLetterContent: true }));
      enqueueSnackbar(`Letter ${stateEditorLetter.name} successfully published!`, {
        variant: 'success',
      });
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
      enqueueSnackbar('Letter could not publisheed on backend side. Please check the details.' + MiscUtils.misc.getErrorMessage(error), {
        variant: 'error',
      });
    }
  };

  return (
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
        )}
      </DialogContent>
      <DialogActions>
        <Button size={EditorConstants.styles.panel.buttonSize} variant="outlined" onClick={props.onClose} color="primary">
          Abbrechen
        </Button>
        <Button
          ref={publishButtonRef}
          size={EditorConstants.styles.panel.buttonSize}
          variant="contained"
          onClick={() => publishLetter()}
          color="primary"
        >
          Veröffentlichen
        </Button>
      </DialogActions>
    </>
  );
};

export default PublishLetterDialog;
