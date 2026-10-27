import React, { useMemo, useState } from 'react';
import { Alert, Button, DialogActions, DialogContent, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { enqueueSnackbar } from 'notistack';
import type { DefaultDialogProps } from '../EditorFormDialog';
import { RootState } from '@src/redux/redux.store';
import { useAppDispatch } from '@src/redux/hooks';
import { EditorConstants } from '@src/constants/editor';
import { fetchMetamwLetterData } from '@src/services/auto_anno/apiMetaMw.service';
import { LetterLifecycleRequestError, renameLetter } from '@src/services/editor/apiLettersRequest.service';
import { refetchPinnedLetterAfterLifecycle } from '@src/services/editor/apiPinnedLettersRequest.service';
import {
  setEditorLetter,
  setEditorPinnedLetters,
  setLifecycleOperationInProgress,
  setReloadLetterContent,
} from '@src/redux/slices/editor.letter.slice';

const LETTER_NAME_PATTERN = /^(fmb|gb)-(\d{4})-(\d{2})-(\d{2})-(\d{2})$/;

const validateRename = (currentName: string, candidateName: string): string | null => {
  const candidateMatch = candidateName.toLowerCase().match(LETTER_NAME_PATTERN);
  if (!candidateMatch) return 'invalidFormat';

  const [, , year, month, day, sequence] = candidateMatch;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day) || sequence === '00') {
    return 'invalidFormat';
  }
  if (candidateName.toLowerCase() === currentName.toLowerCase()) return 'unchanged';
  return null;
};

const RenameLetterDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const letter = useSelector((state: RootState) => state.editorLetter.letter);
  const pinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters);
  const figureUploadInProgress = useSelector((state: RootState) => state.editorLetter.figureUploadInProgress);
  const [name, setName] = useState(letter.name ?? '');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validationError = useMemo(() => (letter.name ? validateRename(letter.name, name.trim()) : 'noLetter'), [letter.name, name]);
  const displayedErrorKey = errorKey ?? (nameTouched ? validationError : null);

  const updateFromPinnedShow = (letterData: NonNullable<Awaited<ReturnType<typeof refetchPinnedLetterAfterLifecycle>>>) => {
    dispatch(
      setEditorPinnedLetters({
        pinnedLetters: pinnedLetters.map((pinnedLetter) =>
          pinnedLetter.id === letterData.id
            ? {
                ...pinnedLetter,
                name: letterData.name,
                capabilities: letterData.capabilities,
                version: letterData.version,
              }
            : pinnedLetter,
        ),
      }),
    );
    dispatch(
      setEditorLetter({
        letter: {
          name: letterData.name,
          xmlContent: letterData.xmlContent,
          undoAvailable: letterData.undoAvailable,
          redoAvailable: letterData.redoAvailable,
          capabilities: letterData.capabilities,
          version: letterData.version,
        },
      }),
    );
    dispatch(setReloadLetterContent({ reloadLetterContent: true }));
  };

  const submit = async () => {
    if (submitting || figureUploadInProgress || letter.id === null || letter.name === null) return;
    if (validationError) {
      setErrorKey(validationError);
      return;
    }

    setSubmitting(true);
    dispatch(setLifecycleOperationInProgress(true));
    setErrorKey(null);
    try {
      const normalizedName = name.trim().toLowerCase();
      const existingLetter = await fetchMetamwLetterData(normalizedName);
      if (existingLetter !== null) {
        setErrorKey('nameTaken');
        return;
      }

      const freshLetter = await refetchPinnedLetterAfterLifecycle(letter.id);
      if (!freshLetter) throw new LetterLifecycleRequestError('letter_not_found', 404, 'letter_not_found');
      if (!freshLetter.capabilities.rename.allowed) {
        throw new LetterLifecycleRequestError(
          freshLetter.capabilities.rename.reasonCode ?? 'letter_operation_failed',
          409,
          freshLetter.capabilities.rename.reasonCode ?? 'letter_operation_failed',
        );
      }

      await renameLetter(letter.id, normalizedName, freshLetter.version);
      const renamedPinnedLetter = await refetchPinnedLetterAfterLifecycle(letter.id);
      if (!renamedPinnedLetter) throw new LetterLifecycleRequestError('letter_not_found', 404, 'letter_not_found');

      updateFromPinnedShow(renamedPinnedLetter);
      navigate(`/editor/letters/${letter.id}/${renamedPinnedLetter.name}`, { replace: true });
      enqueueSnackbar(t('editor:common.letterLifecycle.renameSuccess', { name: renamedPinnedLetter.name }), {
        variant: 'success',
      });
      props.onClose();
    } catch (error) {
      if (error instanceof LetterLifecycleRequestError && error.reasonCode === 'letter_index_pending') {
        const currentLetter = await refetchPinnedLetterAfterLifecycle(letter.id).catch(() => null);
        if (currentLetter) updateFromPinnedShow(currentLetter);
      }
      const reasonCode = error instanceof LetterLifecycleRequestError ? error.reasonCode : undefined;
      setErrorKey(reasonCode ? `reasons.${reasonCode}` : 'requestFailed');
    } finally {
      dispatch(setLifecycleOperationInProgress(false));
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('editor:common.letterLifecycle.renameHint')}
        </Alert>
        <TextField
          fullWidth
          label={t('editor:common.letterLifecycle.newName')}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setNameTouched(true);
            setErrorKey(null);
          }}
          onBlur={() => setNameTouched(true)}
          error={displayedErrorKey !== null}
          helperText={displayedErrorKey ? t(`editor:common.letterLifecycle.${displayedErrorKey}`) : ' '}
          slotProps={{
            formHelperText: {
              'aria-live': 'polite',
            },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button size={EditorConstants.styles.panel.buttonSize} variant="outlined" onClick={props.onClose} disabled={submitting}>
          {t('editor:common.letterLifecycle.cancel')}
        </Button>
        <Button
          size={EditorConstants.styles.panel.buttonSize}
          variant="contained"
          onClick={() => void submit()}
          disabled={submitting || figureUploadInProgress || validationError !== null}
        >
          {t('editor:common.letterLifecycle.rename')}
        </Button>
      </DialogActions>
    </>
  );
};

export default RenameLetterDialog;
