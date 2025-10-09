import { DefaultDialogProps } from '@src/components/editor/letter/Dialog/EditorFormDialog';
import { useAppDispatch } from '@src/redux/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import React, { useEffect, useRef } from 'react';
import { enqueueSnackbar } from 'notistack';
import { MiscUtils } from '@src/utils/misc';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { EditorConstants } from '@src/constants/editor';
import { setLetterPinStatus } from '@src/services/editor/apiPinnedLettersRequest.service';
import { EditorUtils } from '@src/utils/editor';

const CloseTabWithContent = (props: DefaultDialogProps) => {
  const dispatch = useAppDispatch();
  const tabLetterId = useSelector((state: RootState) => state.editorLetter.tabToCloseId);
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters);
  const pinnedLetter = statePinnedLetters.find((letter) => letter.id === tabLetterId);

  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [props]);

  const closeTab = async () => {
    if (!tabLetterId || !pinnedLetter) {
      enqueueSnackbar('No valid if value for letter given.', {
        variant: 'error',
      });
      props.onClose();
      return;
    }

    try {
      const success = await setLetterPinStatus(pinnedLetter, false);
      // const success = true;

      if (success) {
        EditorUtils.letterTabs.removeStateTab(
          dispatch,
          statePinnedLetters,
          pinnedLetter,
          EditorUtils.letterTabs.tabIndex(statePinnedLetters, tabLetterId),
        );
      }
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
        Für dieses Tab existieren ungespeicherte Änderungen. Möchten Sie den Brief zurücksetzen und das Tab schließen?
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
        <Button size={EditorConstants.styles.panel.buttonSize} variant="contained" onClick={() => closeTab()} color="primary">
          Brief Schließen
        </Button>
      </DialogActions>
    </>
  );
};

export default CloseTabWithContent;
