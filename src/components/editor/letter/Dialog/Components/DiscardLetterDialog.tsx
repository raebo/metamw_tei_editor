import React, { useState } from 'react';
import { Alert, Button, DialogActions, DialogContent, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { enqueueSnackbar } from 'notistack';
import type { DefaultDialogProps } from '../EditorFormDialog';
import { RootState } from '@src/redux/redux.store';
import { useAppDispatch } from '@src/redux/hooks';
import { EditorConstants } from '@src/constants/editor';
import { discardLetter, LetterLifecycleRequestError } from '@src/services/editor/apiLettersRequest.service';
import { refetchPinnedLetterAfterLifecycle } from '@src/services/editor/apiPinnedLettersRequest.service';
import { EditorUtils } from '@src/utils/editor';
import {
  setEditorLetter,
  setEditorPinnedLetters,
  setEditorTabNumber,
  setLifecycleOperationInProgress,
} from '@src/redux/slices/editor.letter.slice';

const DiscardLetterDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const letter = useSelector((state: RootState) => state.editorLetter.letter);
  const pinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters);
  const figureUploadInProgress = useSelector((state: RootState) => state.editorLetter.figureUploadInProgress);
  const [confirmation, setConfirmation] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const confirmed = letter.name !== null && confirmation === letter.name;

  const removeDiscardedLetter = () => {
    if (letter.id === null) return;
    const discardedLetter = pinnedLetters.find((pinnedLetter) => pinnedLetter.id === letter.id);
    if (!discardedLetter) {
      dispatch(setEditorLetter({ letter: { id: null, name: null, capabilities: null, version: null } }));
      navigate('/editor/', { replace: true });
      return;
    }

    const discardedIndex = EditorUtils.letterTabs.tabIndex(pinnedLetters, discardedLetter.id);
    const remainingLetters = EditorUtils.letterTabs.removePinnedLetter(pinnedLetters, discardedLetter.id);
    const nextIndex = remainingLetters.length === 0 ? -1 : Math.min(discardedIndex, remainingLetters.length - 1);
    dispatch(setEditorPinnedLetters({ pinnedLetters: remainingLetters }));
    dispatch(setEditorTabNumber({ tabNumber: nextIndex }));

    if (nextIndex === -1) {
      dispatch(
        setEditorLetter({
          letter: { id: null, name: null, capabilities: null, version: null, xmlContent: null },
        }),
      );
      navigate('/editor/', { replace: true });
      return;
    }

    const nextLetter = remainingLetters[nextIndex];
    dispatch(
      setEditorLetter({
        letter: {
          id: nextLetter.id,
          name: nextLetter.name,
          viewMode: nextLetter.viewMode,
          capabilities: nextLetter.capabilities,
          version: nextLetter.version,
          xmlContent: null,
        },
      }),
    );
    navigate(`/editor/letters/${nextLetter.id}/${nextLetter.name}`, { replace: true });
  };

  const submit = async () => {
    if (!confirmed || submitting || figureUploadInProgress || letter.id === null) return;

    setSubmitting(true);
    dispatch(setLifecycleOperationInProgress(true));
    setErrorKey(null);
    try {
      const freshLetter = await refetchPinnedLetterAfterLifecycle(letter.id);
      if (!freshLetter) throw new LetterLifecycleRequestError('letter_not_found', 404, 'letter_not_found');
      if (!freshLetter.capabilities.discard.allowed) {
        throw new LetterLifecycleRequestError(
          freshLetter.capabilities.discard.reasonCode ?? 'letter_operation_failed',
          409,
          freshLetter.capabilities.discard.reasonCode ?? 'letter_operation_failed',
        );
      }

      await discardLetter(letter.id, freshLetter.version);
      removeDiscardedLetter();
      enqueueSnackbar(t('editor:common.letterLifecycle.discardSuccess', { name: letter.name }), {
        variant: 'success',
      });
      props.onClose();
    } catch (error) {
      const reasonCode = error instanceof LetterLifecycleRequestError ? error.reasonCode : undefined;
      if (reasonCode === 'letter_index_pending') {
        const currentLetter = await refetchPinnedLetterAfterLifecycle(letter.id).catch(() => null);
        if (currentLetter === null) removeDiscardedLetter();
      }
      setErrorKey(reasonCode ? `reasons.${reasonCode}` : 'requestFailed');
    } finally {
      dispatch(setLifecycleOperationInProgress(false));
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('editor:common.letterLifecycle.discardWarning')}
        </Alert>
        <Typography sx={{ mb: 2 }}>{t('editor:common.letterLifecycle.discardConfirmation', { name: letter.name })}</Typography>
        <TextField
          fullWidth
          label={t('editor:common.letterLifecycle.confirmName')}
          value={confirmation}
          onChange={(event) => {
            setConfirmation(event.target.value);
            setErrorKey(null);
          }}
          error={errorKey !== null}
          helperText={errorKey ? t(`editor:common.letterLifecycle.${errorKey}`) : ' '}
        />
      </DialogContent>
      <DialogActions>
        <Button size={EditorConstants.styles.panel.buttonSize} variant="outlined" onClick={props.onClose} disabled={submitting}>
          {t('editor:common.letterLifecycle.cancel')}
        </Button>
        <Button
          size={EditorConstants.styles.panel.buttonSize}
          variant="contained"
          color="error"
          onClick={() => void submit()}
          disabled={!confirmed || submitting || figureUploadInProgress}
        >
          {t('editor:common.letterLifecycle.discard')}
        </Button>
      </DialogActions>
    </>
  );
};

export default DiscardLetterDialog;
