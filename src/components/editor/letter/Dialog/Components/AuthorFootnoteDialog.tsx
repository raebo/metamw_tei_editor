import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { EditorConstants } from '@src/constants/editor';
import {
  deleteAuthorFootnote,
  insertAuthorFootnote,
  readAuthorFootnote,
  resolveAuthorFootnote,
  updateAuthorFootnote,
  type AuthorFootnotePair,
} from '@src/utils/editor/authorFootnote';
import { MiscUtils } from '@src/utils/misc';
import type { DefaultDialogProps } from '../EditorFormDialog';

const AuthorFootnoteDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const reference = useSelector((state: RootState) => state.editorLetter.letterReference);
  const editing = reference.elementKey === 'edit' || reference.elementKey === 'delete';
  const [pair, setPair] = useState<AuthorFootnotePair | null>(null);
  const [content, setContent] = useState('');
  const [marker, setMarker] = useState('');
  const [deletePending, setDeletePending] = useState(reference.elementKey === 'delete');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!editing || !reference.elementXmlId) return;
    try {
      const selected = resolveAuthorFootnote(props.xmlDoc, reference.elementXmlId);
      const data = readAuthorFootnote(selected);
      setPair(selected);
      setContent(data.content);
      setMarker(data.marker);
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  }, [editing, props.xmlDoc, reference.elementXmlId]);

  const submitDisabled = useMemo(() => deletePending || !content.trim(), [content, deletePending]);

  const save = () => {
    setErrorMessage(null);
    try {
      let saved: AuthorFootnotePair;
      if (editing) {
        if (!pair) throw new Error('The footnote could not be found.');
        saved = updateAuthorFootnote(pair, { content, marker });
      } else {
        saved = insertAuthorFootnote(props.xmlDoc, reference.elementXmlId ?? '', reference.elementKey ?? '', {
          content,
          marker,
        });
      }
      props.onSave(
        props.xmlDoc,
        editing
          ? EditorConstants.changeTypes.misc.BODY_AUTHOR_FOOTNOTE_CHANGED
          : EditorConstants.changeTypes.misc.BODY_AUTHOR_FOOTNOTE_ADDED,
        t(editing ? 'editor:dialog.authorFootnote.success.updated' : 'editor:dialog.authorFootnote.success.added'),
        saved.note.getAttribute('xml:id'),
      );
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  };

  const remove = () => {
    setErrorMessage(null);
    try {
      if (!pair) throw new Error('The footnote could not be found.');
      deleteAuthorFootnote(pair);
      props.onSave(
        props.xmlDoc,
        EditorConstants.changeTypes.misc.BODY_AUTHOR_FOOTNOTE_REMOVED,
        t('editor:dialog.authorFootnote.success.deleted'),
        null,
      );
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  };

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Alert severity="info">{t('editor:dialog.authorFootnote.contract')}</Alert>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      <TextField
        label={t('editor:dialog.authorFootnote.fields.marker')}
        helperText={t('editor:dialog.authorFootnote.markerHint')}
        disabled={deletePending}
        value={marker}
        onChange={(event) => setMarker(event.target.value)}
      />
      <TextField
        required
        multiline
        minRows={5}
        disabled={deletePending}
        label={t('editor:dialog.authorFootnote.fields.content')}
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        {editing && !deletePending && (
          <Button variant="outlined" color="error" onClick={() => setDeletePending(true)}>
            {t('editor:dialog.authorFootnote.buttons.delete')}
          </Button>
        )}
        {deletePending ? (
          <>
            <Button variant="outlined" onClick={() => setDeletePending(false)}>
              {t('editor:dialog.authorFootnote.buttons.cancelDelete')}
            </Button>
            <Button variant="contained" color="error" onClick={remove}>
              {t('editor:dialog.authorFootnote.buttons.confirmDelete')}
            </Button>
          </>
        ) : (
          <Button variant="contained" disabled={submitDisabled} onClick={save}>
            {t(editing ? 'editor:dialog.authorFootnote.buttons.update' : 'editor:dialog.authorFootnote.buttons.add')}
          </Button>
        )}
      </Stack>
    </Stack>
  );
};

export default AuthorFootnoteDialog;
