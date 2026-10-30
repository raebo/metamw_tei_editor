import { DefaultDialogProps } from '@src/components/editor/letter/Dialog/EditorFormDialog';
import { useAppDispatch } from '@src/redux/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import React, { useEffect, useRef, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import { MiscUtils } from '@src/utils/misc';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { EditorConstants } from '@src/constants/editor';
import { setLetterPinStatus } from '@src/services/editor/apiPinnedLettersRequest.service';
import { EditorUtils } from '@src/utils/editor';
import { setLifecycleOperationInProgress } from '@src/redux/slices/editor.letter.slice';
import { useTranslation } from 'react-i18next';

const CloseTabWithContent = (props: DefaultDialogProps) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const tabLetterId = useSelector((state: RootState) => state.editorLetter.tabToCloseId);
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters);
  const pinnedLetter = statePinnedLetters.find((letter) => letter.id === tabLetterId);
  const figureUploadInProgress = useSelector((state: RootState) => state.editorLetter.figureUploadInProgress);
  const pendingContentUpdates = useSelector((state: RootState) => state.editorLetter.pendingContentUpdates);
  const lifecycleOperationInProgress = useSelector((state: RootState) => state.editorLetter.lifecycleOperationInProgress);
  const [submitting, setSubmitting] = useState(false);

  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [props]);

  const closeTab = async () => {
    if (figureUploadInProgress || pendingContentUpdates > 0 || lifecycleOperationInProgress || submittingRef.current) return;
    if (!tabLetterId || !pinnedLetter) {
      enqueueSnackbar(t('editor:dialog.closeWorkingLetter.invalidLetter'), {
        variant: 'error',
      });
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    dispatch(setLifecycleOperationInProgress(true));
    try {
      await setLetterPinStatus(pinnedLetter.id, false);
      EditorUtils.letterTabs.removeStateTab(
        dispatch,
        statePinnedLetters,
        pinnedLetter,
        EditorUtils.letterTabs.tabIndex(statePinnedLetters, tabLetterId),
      );
      props.onClose();
    } catch (error) {
      enqueueSnackbar(
        t('editor:dialog.closeWorkingLetter.requestFailed', {
          reason: MiscUtils.misc.getErrorMessage(error),
        }),
        {
          variant: 'error',
        },
      );
    } finally {
      dispatch(setLifecycleOperationInProgress(false));
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogContent>{t('editor:dialog.closeWorkingLetter.warning')}</DialogContent>
      <DialogActions>
        <Button
          ref={cancelButtonRef}
          size={EditorConstants.styles.panel.buttonSize}
          variant="outlined"
          onClick={props.onClose}
          disabled={submitting}
          color="primary"
        >
          {t('editor:dialog.closeWorkingLetter.cancel')}
        </Button>
        <Button
          size={EditorConstants.styles.panel.buttonSize}
          variant="contained"
          onClick={() => void closeTab()}
          disabled={figureUploadInProgress || pendingContentUpdates > 0 || lifecycleOperationInProgress || submitting}
          color="primary"
        >
          {t('editor:dialog.closeWorkingLetter.confirm')}
        </Button>
      </DialogActions>
    </>
  );
};

export default CloseTabWithContent;
