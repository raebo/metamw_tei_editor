import React, { useCallback, useEffect, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { closeSnackbar, enqueueSnackbar, type SnackbarKey } from 'notistack';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '@src/redux/redux.store';
import { EditorConstants } from '@src/constants/editor';
import { useLetterStalenessPolling } from './hooks/useLetterStalenessPolling';
import { useRebaseLetter } from './hooks/useRebaseLetter';

const LetterStalenessMonitor = () => {
  const { t } = useTranslation();
  const activeLetter = useSelector((state: RootState) => state.editorLetter.letter);
  const pinnedLetter = useSelector((state: RootState) =>
    state.editorLetter.pinnedLetters.find(
      (letter) => letter.id === state.editorLetter.letter.id && letter.isPinned,
    ),
  );
  const rebaseLetter = useRebaseLetter();
  const snackbarKeyRef = useRef<SnackbarKey | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const letterId = pinnedLetter?.id ?? null;

  const closeStalenessNotice = useCallback(() => {
    if (snackbarKeyRef.current !== null) {
      closeSnackbar(snackbarKeyRef.current);
      snackbarKeyRef.current = null;
    }
  }, []);

  const reloadLetter = useCallback(async () => {
    if (letterId === null) return;
    const succeeded = await rebaseLetter(letterId, activeLetter.name);
    if (succeeded) {
      setConfirmationOpen(false);
      closeStalenessNotice();
    }
  }, [activeLetter.name, closeStalenessNotice, letterId, rebaseLetter]);

  const handleReload = useCallback(() => {
    if (pinnedLetter?.contentChanged) {
      setConfirmationOpen(true);
      return;
    }
    void reloadLetter();
  }, [pinnedLetter?.contentChanged, reloadLetter]);

  const handleStale = useCallback(() => {
    if (snackbarKeyRef.current !== null) return;
    snackbarKeyRef.current = enqueueSnackbar(t('editor:common.staleness.notice'), {
      persist: true,
      variant: 'warning',
      action: (
        <Button color="inherit" size="small" onClick={handleReload}>
          {t('editor:common.staleness.reload')}
        </Button>
      ),
    });
  }, [handleReload, t]);

  useLetterStalenessPolling({ letterId, onStale: handleStale });

  useEffect(() => {
    return () => {
      closeStalenessNotice();
    };
  }, [closeStalenessNotice, letterId]);

  return (
    <Dialog open={confirmationOpen} onClose={() => setConfirmationOpen(false)}>
      <DialogTitle>{t('editor:common.staleness.confirmTitle')}</DialogTitle>
      <DialogContent>{t('editor:common.staleness.confirmBody')}</DialogContent>
      <DialogActions>
        <Button
          size={EditorConstants.styles.panel.buttonSize}
          variant="outlined"
          onClick={() => setConfirmationOpen(false)}
        >
          {t('editor:common.staleness.cancel')}
        </Button>
        <Button
          size={EditorConstants.styles.panel.buttonSize}
          variant="contained"
          onClick={() => void reloadLetter()}
        >
          {t('editor:common.staleness.reload')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LetterStalenessMonitor;
