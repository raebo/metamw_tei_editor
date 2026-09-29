import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { EditorConstants } from '@src/constants/editor';
import {
  AbbreviationError,
  deleteAbbreviation,
  insertAbbreviation,
  readAbbreviationExpansion,
  resolveAbbreviation,
  updateAbbreviation,
} from '@src/utils/editor/abbreviation';
import { MiscUtils } from '@src/utils/misc';
import type { DefaultDialogProps } from '../EditorFormDialog';

const AbbreviationDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const reference = useSelector((state: RootState) => state.editorLetter.letterReference);
  const editing = reference.elementKey === 'edit' || reference.elementKey === 'delete';
  const [element, setElement] = useState<Element | null>(null);
  const [expansion, setExpansion] = useState('');
  const [deletePending, setDeletePending] = useState(reference.elementKey === 'delete');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showError = useCallback(
    (error: unknown) => {
      setErrorMessage(
        error instanceof AbbreviationError ? t(`editor:dialog.abbreviation.errors.${error.code}`) : MiscUtils.misc.getErrorMessage(error),
      );
    },
    [t],
  );

  useEffect(() => {
    if (!editing || !reference.elementXmlId) return;
    try {
      const selected = resolveAbbreviation(props.xmlDoc, reference.elementXmlId);
      setElement(selected);
      setExpansion(readAbbreviationExpansion(selected));
    } catch (error) {
      showError(error);
    }
  }, [editing, props.xmlDoc, reference.elementXmlId, showError]);

  const save = () => {
    setErrorMessage(null);
    try {
      const saved = editing
        ? updateAbbreviation(element ?? resolveAbbreviation(props.xmlDoc, reference.elementXmlId ?? ''), expansion)
        : insertAbbreviation(props.xmlDoc, expansion);
      props.onSave(
        props.xmlDoc,
        editing ? EditorConstants.changeTypes.misc.BODY_ABBREVIATION_CHANGED : EditorConstants.changeTypes.misc.BODY_ABBREVIATION_ADDED,
        t(editing ? 'editor:dialog.abbreviation.success.updated' : 'editor:dialog.abbreviation.success.added'),
        saved.getAttribute('xml:id'),
      );
    } catch (error) {
      showError(error);
    }
  };

  const remove = () => {
    setErrorMessage(null);
    try {
      deleteAbbreviation(element ?? resolveAbbreviation(props.xmlDoc, reference.elementXmlId ?? ''));
      props.onSave(
        props.xmlDoc,
        EditorConstants.changeTypes.misc.BODY_ABBREVIATION_REMOVED,
        t('editor:dialog.abbreviation.success.deleted'),
        null,
      );
    } catch (error) {
      showError(error);
    }
  };

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Alert severity="info">{t('editor:dialog.abbreviation.contract')}</Alert>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      <TextField
        required
        disabled={deletePending}
        label={t('editor:dialog.abbreviation.fields.expansion')}
        value={expansion}
        onChange={(event) => setExpansion(event.target.value)}
      />
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        {editing && !deletePending && (
          <Button variant="outlined" color="error" onClick={() => setDeletePending(true)}>
            {t('editor:dialog.abbreviation.buttons.delete')}
          </Button>
        )}
        {deletePending ? (
          <>
            <Button variant="outlined" onClick={() => setDeletePending(false)}>
              {t('editor:dialog.abbreviation.buttons.cancelDelete')}
            </Button>
            <Button variant="contained" color="error" onClick={remove}>
              {t('editor:dialog.abbreviation.buttons.confirmDelete')}
            </Button>
          </>
        ) : (
          <Button variant="contained" disabled={!expansion.trim()} onClick={save}>
            {t(editing ? 'editor:dialog.abbreviation.buttons.update' : 'editor:dialog.abbreviation.buttons.add')}
          </Button>
        )}
      </Stack>
    </Stack>
  );
};

export default AbbreviationDialog;
