import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { EditorConstants } from '@src/constants/editor';
import {
  deleteManuscriptAnnotation,
  insertManuscriptAnnotation,
  readManuscriptAnnotation,
  resolveManuscriptAnnotation,
  updateManuscriptAnnotation,
} from '@src/utils/editor/manuscriptAnnotation';
import { MiscUtils } from '@src/utils/misc';
import type { DefaultDialogProps } from '../EditorFormDialog';

const ManuscriptAnnotationDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const reference = useSelector((state: RootState) => state.editorLetter.letterReference);
  const editing = reference.elementKey === 'edit' || reference.elementKey === 'delete';
  const [annotation, setAnnotation] = useState<Element | null>(null);
  const [content, setContent] = useState('');
  const [deletePending, setDeletePending] = useState(reference.elementKey === 'delete');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!editing || !reference.elementXmlId) return;
    try {
      const selected = resolveManuscriptAnnotation(props.xmlDoc, reference.elementXmlId);
      setAnnotation(selected);
      setContent(readManuscriptAnnotation(selected));
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  }, [editing, props.xmlDoc, reference.elementXmlId]);

  const submitDisabled = useMemo(() => deletePending || !content.trim(), [content, deletePending]);

  const save = () => {
    setErrorMessage(null);
    try {
      let saved: Element;
      if (editing) {
        if (!annotation) throw new Error('The manuscript annotation could not be found.');
        saved = updateManuscriptAnnotation(annotation, content);
      } else {
        saved = insertManuscriptAnnotation(props.xmlDoc, content);
      }
      props.onSave(
        props.xmlDoc,
        editing
          ? EditorConstants.changeTypes.misc.HEADER_MANUSCRIPT_ANNOTATION_CHANGED
          : EditorConstants.changeTypes.misc.HEADER_MANUSCRIPT_ANNOTATION_ADDED,
        t(editing ? 'editor:dialog.manuscriptAnnotation.success.updated' : 'editor:dialog.manuscriptAnnotation.success.added'),
        saved.getAttribute('xml:id'),
      );
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  };

  const remove = () => {
    setErrorMessage(null);
    try {
      if (!annotation) throw new Error('The manuscript annotation could not be found.');
      deleteManuscriptAnnotation(annotation);
      props.onSave(
        props.xmlDoc,
        EditorConstants.changeTypes.misc.HEADER_MANUSCRIPT_ANNOTATION_REMOVED,
        t('editor:dialog.manuscriptAnnotation.success.deleted'),
        null,
      );
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  };

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Alert severity="info">{t('editor:dialog.manuscriptAnnotation.contract')}</Alert>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      <TextField
        required
        multiline
        minRows={5}
        disabled={deletePending}
        label={t('editor:dialog.manuscriptAnnotation.fields.content')}
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        {editing && !deletePending && (
          <Button variant="outlined" color="error" onClick={() => setDeletePending(true)}>
            {t('editor:dialog.manuscriptAnnotation.buttons.delete')}
          </Button>
        )}
        {deletePending ? (
          <>
            <Button variant="outlined" onClick={() => setDeletePending(false)}>
              {t('editor:dialog.manuscriptAnnotation.buttons.cancelDelete')}
            </Button>
            <Button variant="contained" color="error" onClick={remove}>
              {t('editor:dialog.manuscriptAnnotation.buttons.confirmDelete')}
            </Button>
          </>
        ) : (
          <Button variant="contained" disabled={submitDisabled} onClick={save}>
            {t(editing ? 'editor:dialog.manuscriptAnnotation.buttons.update' : 'editor:dialog.manuscriptAnnotation.buttons.add')}
          </Button>
        )}
      </Stack>
    </Stack>
  );
};

export default ManuscriptAnnotationDialog;
