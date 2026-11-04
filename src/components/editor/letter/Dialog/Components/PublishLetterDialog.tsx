import React from 'react';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { useAppDispatch } from '@src/redux/hooks';
import { EditorUtils } from '@src/utils/editor';
import {
  setEditorLetter,
  setEditorPinnedLetterContentChanged,
  setEditorPinnedLetterLifecycle,
  setReloadLetterContent,
} from '@src/redux/slices/editor.letter.slice';
import { enqueueSnackbar } from 'notistack';
import { EditorConstants } from '@src/constants/editor';
import { DefaultDialogProps } from '../EditorFormDialog';
import { Alert, Box, Typography } from '@mui/material';
import { MiscUtils } from '@src/utils/misc';
import { InvalidRevisionStatusError, LetterChangedSincePinnedError } from '@src/utils/editor/backendService';
import { useRebaseLetter } from '@src/components/editor/letter/hooks/useRebaseLetter';
import { useTranslation } from 'react-i18next';
import type { RevisionStatus } from '@src/schemas/editorMutationResponses';
import { fetchPinnedLetterData } from '@src/services/editor/apiPinnedLettersRequest.service';

const revisionStatusFromDocument = (xmlDoc: Document): RevisionStatus => {
  const revisionDesc = xmlDoc.getElementsByTagNameNS('*', 'revisionDesc').item(0) ?? xmlDoc.getElementsByTagName('revisionDesc').item(0);
  return revisionDesc?.getAttribute('status') === 'live' ? 'live' : 'draft';
};

const PublishLetterDialog = (props: DefaultDialogProps) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const rebaseLetter = useRebaseLetter();
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const [conflictMessage, setConflictMessage] = React.useState<string>();
  const [confirmRebase, setConfirmRebase] = React.useState(false);
  const currentRevisionStatus = revisionStatusFromDocument(props.xmlDoc);
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);
  const figureUploadInProgress = useSelector((state: RootState) => state.editorLetter.figureUploadInProgress);
  const pinnedLetter = useSelector((state: RootState) =>
    state.editorLetter.pinnedLetters.find((letter) => letter.id === state.editorLetter.letter.id),
  );

  const publishLetter = async (revisionStatus: RevisionStatus) => {
    if (figureUploadInProgress) return;
    if (!stateEditorLetter?.id) {
      enqueueSnackbar('Letter could not publish on backend side: No letter id found', {
        variant: 'error',
      });
      props.onClose();
      return;
    }

    try {
      setErrorMessage(undefined);
      await EditorUtils.backendService.publishLetter(stateEditorLetter.id, revisionStatus);

      try {
        const refreshedLetter = await fetchPinnedLetterData(stateEditorLetter.id);
        if (refreshedLetter.id !== stateEditorLetter.id) {
          throw new Error('The refreshed pinned letter does not match the published letter.');
        }
        dispatch(
          setEditorLetter({
            letter: {
              name: refreshedLetter.name,
              xmlContent: refreshedLetter.xmlContent,
              undoAvailable: refreshedLetter.undoAvailable,
              redoAvailable: refreshedLetter.redoAvailable,
              capabilities: refreshedLetter.capabilities,
              version: refreshedLetter.version,
            },
          }),
        );
        dispatch(
          setEditorPinnedLetterLifecycle({
            id: refreshedLetter.id,
            name: refreshedLetter.name,
            capabilities: refreshedLetter.capabilities,
            version: refreshedLetter.version,
          }),
        );
        dispatch(
          setEditorPinnedLetterContentChanged({
            id: refreshedLetter.id,
            contentChanged: false,
          }),
        );
        dispatch(setReloadLetterContent({ reloadLetterContent: false }));
      } catch (reloadError) {
        dispatch(setReloadLetterContent({ reloadLetterContent: true }));
        enqueueSnackbar(
          t('editor:dialog.publishLetter.reloadError', {
            reason: MiscUtils.misc.getErrorMessage(reloadError),
          }),
          { variant: 'warning' },
        );
        props.onClose();
        return;
      }

      enqueueSnackbar(t('editor:dialog.publishLetter.success', { name: stateEditorLetter.name ?? '' }), {
        variant: 'success',
      });
      props.onClose();
    } catch (error) {
      if (error instanceof LetterChangedSincePinnedError) {
        setConflictMessage(error.message);
        return;
      }
      const message =
        error instanceof InvalidRevisionStatusError
          ? t('editor:dialog.publishLetter.invalidRevisionStatus')
          : MiscUtils.misc.getErrorMessage(error);
      setErrorMessage(message);
      enqueueSnackbar(t('editor:dialog.publishLetter.error', { reason: message }), {
        variant: 'error',
      });
    }
  };

  const reloadLetter = async () => {
    if (figureUploadInProgress) return;
    if (!stateEditorLetter.id) return;
    if (pinnedLetter?.contentChanged && !confirmRebase) {
      setConfirmRebase(true);
      return;
    }
    const succeeded = await rebaseLetter(stateEditorLetter.id, stateEditorLetter.name);
    if (succeeded) props.onClose();
  };

  if (conflictMessage) {
    return (
      <>
        <DialogContent>
          <Alert severity="warning">
            {confirmRebase
              ? t('editor:common.staleness.confirmBody')
              : t('editor:common.staleness.publishConflict', { message: conflictMessage })}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button size={EditorConstants.styles.panel.buttonSize} variant="outlined" onClick={props.onClose} color="primary">
            {t('editor:common.staleness.cancel')}
          </Button>
          <Button
            size={EditorConstants.styles.panel.buttonSize}
            variant="contained"
            onClick={() => void reloadLetter()}
            disabled={figureUploadInProgress}
            color="primary"
          >
            {t('editor:common.staleness.reload')}
          </Button>
        </DialogActions>
      </>
    );
  }

  return (
    <>
      <DialogContent>
        {t('editor:dialog.publishLetter.question')}
        <Box
          sx={{
            alignItems: 'center',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            display: 'flex',
            gap: 1,
            mt: 2,
            px: 2,
            py: 1.5,
          }}
        >
          <Typography component="span">{t('editor:dialog.publishLetter.currentStatusLabel')}</Typography>
          <Typography component="strong" sx={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {t(`editor:dialog.publishLetter.status${currentRevisionStatus === 'live' ? 'Live' : 'Draft'}`)}
          </Typography>
        </Box>
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('editor:dialog.publishLetter.statusEffect')}
        </Alert>
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('editor:dialog.publishLetter.visibilityNotice')}
        </Alert>
        <Alert severity="warning" sx={{ mt: 2 }}>
          {t('editor:dialog.publishLetter.warning')}
        </Alert>
        {errorMessage && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 3 }}>
          <Button
            size="large"
            variant={currentRevisionStatus === 'draft' ? 'contained' : 'outlined'}
            onClick={() => void publishLetter('draft')}
            disabled={figureUploadInProgress}
            color="primary"
            sx={{ minWidth: 160, py: 1.25, fontSize: '1rem' }}
          >
            {t('editor:dialog.publishLetter.statusDraft')}
          </Button>
          <Button
            size="large"
            variant={currentRevisionStatus === 'live' ? 'contained' : 'outlined'}
            onClick={() => void publishLetter('live')}
            disabled={figureUploadInProgress}
            color="primary"
            sx={{ minWidth: 160, py: 1.25, fontSize: '1rem' }}
          >
            {t('editor:dialog.publishLetter.statusLive')}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button size={EditorConstants.styles.panel.buttonSize} variant="outlined" onClick={props.onClose} color="primary">
          {t('editor:dialog.publishLetter.cancel')}
        </Button>
      </DialogActions>
    </>
  );
};

export default PublishLetterDialog;
