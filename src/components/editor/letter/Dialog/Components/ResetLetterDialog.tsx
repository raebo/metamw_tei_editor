import React, { useEffect, useRef } from 'react';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { useAppDispatch } from '@src/redux/hooks';
import { EditorUtils } from '@src/utils/editor';
import { setEditorPinnedLetterContentChanged, setEditorSelectedItem, setReloadLetterContent } from '@src/redux/slices/editor.letter.slice';
import { enqueueSnackbar } from 'notistack';
import { EditorConstants } from '@src/constants/editor';
import { DefaultDialogProps } from '../EditorFormDialog';
import { MiscUtils } from '@src/utils/misc';

const ResetLetterDialog = (props: DefaultDialogProps) => {
  const dispatch = useAppDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);
  const selectedItem = useSelector((state: RootState) => state.editorLetter.selectedItem);
  const figureUploadInProgress = useSelector((state: RootState) => state.editorLetter.figureUploadInProgress);

  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }

    if (selectedItem.right) {
      dispatch(
        setEditorSelectedItem({
          selectedItem: {
            left: selectedItem.left,
            right: null,
          },
        }),
      );
    }
    // Was `[props]` before: props is never read inside this effect at all (a leftover/
    // copy-paste dependency), so it neither satisfied nor needed to include the values
    // actually read here.
  }, [dispatch, selectedItem.left, selectedItem.right]);

  const resetLetter = async () => {
    if (figureUploadInProgress) return;
    if (!stateEditorLetter || !stateEditorLetter.id) {
      enqueueSnackbar('Letter could not reset on backend side: No letter id found', {
        variant: 'error',
      });
      props.onClose();
      return;
    }

    try {
      await EditorUtils.backendService.resetLetter(stateEditorLetter.id);
      dispatch(setReloadLetterContent({ reloadLetterContent: true }));
      dispatch(setEditorPinnedLetterContentChanged({ id: stateEditorLetter.id, contentChanged: false }));

      enqueueSnackbar(`Der Brief '${stateEditorLetter.name}' wurde zurückgesetzt!`, {
        variant: 'success',
      });
    } catch (error) {
      enqueueSnackbar('Error during backend update. ' + MiscUtils.misc.getErrorMessage(error), {
        variant: 'error',
      });
    }
    props.onClose();
  };

  return (
    <>
      <DialogContent>
        Sind Sie sicher, dass Sie alle bisherigen Anpassungen einschließlich unpublizierter Bild-Uploads verwerfen möchten?
      </DialogContent>
      <DialogActions>
        <Button
          ref={cancelButtonRef}
          size={EditorConstants.styles.panel.buttonSize}
          variant="outlined"
          onClick={props.onClose}
          color="primary"
        >
          Abbrechen
        </Button>
        <Button
          size={EditorConstants.styles.panel.buttonSize}
          variant="contained"
          onClick={() => resetLetter()}
          disabled={figureUploadInProgress}
          color="primary"
        >
          Zurücksetzen
        </Button>
      </DialogActions>
    </>
  );
};

export default ResetLetterDialog;
