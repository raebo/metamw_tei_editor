import React, { useRef, useState } from 'react';
import { Alert, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { enqueueSnackbar } from 'notistack';
import { RootState } from '@src/redux/redux.store';
import { useAppDispatch } from '@src/redux/hooks';
import {
  setEditorLetterUndoRedo,
  setEditorPinnedLetterContentChanged,
  setFigureUploadInProgress,
  setFocusedFigureXmlId,
  setXmlLetterContent,
} from '@src/redux/slices/editor.letter.slice';
import { uploadFigure } from '@src/services/editor/apiFigureRequest.service';
import type { FigureCategory, FigurePosition } from '@src/services/editor/apiFigureRequest.service';
import type { DefaultDialogProps } from '../EditorFormDialog';

const MAX_CLIENT_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set(['image/jpeg', 'image/png']);

const responseStatus = (error: unknown): number | undefined =>
  typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { status?: number } }).response?.status
    : undefined;

const FigureUploadDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const letterId = useSelector((state: RootState) => state.editorLetter.letter.id);
  const anchorXmlId = useSelector((state: RootState) => state.editorLetter.letterReference.elementXmlId);
  const uploadInProgress = useSelector((state: RootState) => state.editorLetter.figureUploadInProgress);
  const [image, setImage] = useState<File | null>(null);
  const [category, setCategory] = useState<FigureCategory>('drawing');
  const [position, setPosition] = useState<FigurePosition>('after');
  const [head, setHead] = useState('');
  const [figDesc, setFigDesc] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const submit = async () => {
    if (!letterId || !anchorXmlId || !image || uploadInProgress || submittingRef.current) return;
    if (!ALLOWED_FILE_TYPES.has(image.type)) {
      setErrorMessage(t('editor:dialog.figureUpload.errors.fileType'));
      return;
    }
    if (image.size > MAX_CLIENT_FILE_SIZE) {
      setErrorMessage(t('editor:dialog.figureUpload.errors.fileSize'));
      return;
    }

    submittingRef.current = true;
    dispatch(setFigureUploadInProgress(true));
    setErrorMessage(null);
    try {
      const result = await uploadFigure(letterId, {
        image,
        category,
        anchorXmlId,
        position,
        head,
        figDesc,
      });
      dispatch(setXmlLetterContent({ content: { xmlContent: result.xml_content } }));
      dispatch(
        setEditorLetterUndoRedo({
          letter: {
            undoAvailable: result.undo_available,
            redoAvailable: result.redo_available,
          },
        }),
      );
      dispatch(setEditorPinnedLetterContentChanged({ id: letterId, contentChanged: true }));
      dispatch(setFocusedFigureXmlId(result.figure_xml_id));
      dispatch(setFigureUploadInProgress(false));
      enqueueSnackbar(t('editor:dialog.figureUpload.success'), { variant: 'success' });
      props.onClose();
    } catch (error) {
      const status = responseStatus(error);
      const key =
        status && [401, 404, 409, 413, 415, 422].includes(status)
          ? `editor:dialog.figureUpload.errors.http${status}`
          : 'editor:dialog.figureUpload.errors.generic';
      setErrorMessage(t(key));
    } finally {
      submittingRef.current = false;
      dispatch(setFigureUploadInProgress(false));
    }
  };

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Alert severity="info">{t('editor:dialog.figureUpload.anchor', { anchor: anchorXmlId ?? '' })}</Alert>
      {errorMessage && (
        <Alert severity="error" role="alert">
          {errorMessage}
        </Alert>
      )}
      <Button component="label" variant="outlined" disabled={uploadInProgress}>
        {image?.name || t('editor:dialog.figureUpload.fields.image')}
        <input
          hidden
          type="file"
          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
          onChange={(event) => setImage(event.target.files?.[0] ?? null)}
        />
      </Button>
      <TextField
        select
        required
        label={t('editor:dialog.figureUpload.fields.category')}
        value={category}
        disabled={uploadInProgress}
        onChange={(event) => setCategory(event.target.value as FigureCategory)}
      >
        <MenuItem value="notation">{t('editor:dialog.figureUpload.categories.notation')}</MenuItem>
        <MenuItem value="drawing">{t('editor:dialog.figureUpload.categories.drawing')}</MenuItem>
      </TextField>
      <TextField
        select
        required
        label={t('editor:dialog.figureUpload.fields.position')}
        value={position}
        disabled={uploadInProgress}
        onChange={(event) => setPosition(event.target.value as FigurePosition)}
      >
        <MenuItem value="before">{t('editor:dialog.figureUpload.positions.before')}</MenuItem>
        <MenuItem value="after">{t('editor:dialog.figureUpload.positions.after')}</MenuItem>
        <MenuItem value="append">{t('editor:dialog.figureUpload.positions.append')}</MenuItem>
      </TextField>
      <TextField
        label={t('editor:dialog.figureUpload.fields.head')}
        value={head}
        disabled={uploadInProgress}
        onChange={(event) => setHead(event.target.value)}
      />
      <TextField
        label={t('editor:dialog.figureUpload.fields.description')}
        value={figDesc}
        disabled={uploadInProgress}
        multiline
        minRows={2}
        onChange={(event) => setFigDesc(event.target.value)}
      />
      <Button variant="contained" disabled={!letterId || !anchorXmlId || !image || uploadInProgress} onClick={() => void submit()}>
        {uploadInProgress ? t('editor:dialog.figureUpload.uploading') : t('editor:dialog.figureUpload.submit')}
      </Button>
    </Stack>
  );
};

export default FigureUploadDialog;
