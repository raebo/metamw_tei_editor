import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, FormControl, InputLabel, MenuItem, Select, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { EditorConstants } from '@src/constants/editor';
import {
  deleteForeignText,
  ForeignTextError,
  FOREIGN_TEXT_LANGUAGE_SUGGESTIONS,
  insertForeignText,
  resolveForeignText,
  updateForeignText,
} from '@src/utils/editor/foreignText';
import { MiscUtils } from '@src/utils/misc';
import type { DefaultDialogProps } from '../EditorFormDialog';

const ForeignTextDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const reference = useSelector((state: RootState) => state.editorLetter.letterReference);
  const editing = reference.elementKey === 'edit' || reference.elementKey === 'delete';
  const [element, setElement] = useState<Element | null>(null);
  const [language, setLanguage] = useState('fr');
  const [deletePending, setDeletePending] = useState(reference.elementKey === 'delete');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showError = useCallback(
    (error: unknown) => {
      setErrorMessage(
        error instanceof ForeignTextError ? t(`editor:dialog.foreignText.errors.${error.code}`) : MiscUtils.misc.getErrorMessage(error),
      );
    },
    [t],
  );

  useEffect(() => {
    if (!editing || !reference.elementXmlId) return;
    try {
      const selected = resolveForeignText(props.xmlDoc, reference.elementXmlId);
      setElement(selected);
      setLanguage(selected.getAttribute('xml:lang') ?? '');
    } catch (error) {
      showError(error);
    }
  }, [editing, props.xmlDoc, reference.elementXmlId, showError]);

  const save = () => {
    setErrorMessage(null);
    try {
      const saved = editing
        ? updateForeignText(element ?? resolveForeignText(props.xmlDoc, reference.elementXmlId ?? ''), language)
        : insertForeignText(props.xmlDoc, language);
      props.onSave(
        props.xmlDoc,
        editing ? EditorConstants.changeTypes.misc.BODY_FOREIGN_TEXT_CHANGED : EditorConstants.changeTypes.misc.BODY_FOREIGN_TEXT_ADDED,
        t(editing ? 'editor:dialog.foreignText.success.updated' : 'editor:dialog.foreignText.success.added'),
        saved.getAttribute('xml:id'),
      );
    } catch (error) {
      showError(error);
    }
  };

  const remove = () => {
    setErrorMessage(null);
    try {
      const selected = element ?? resolveForeignText(props.xmlDoc, reference.elementXmlId ?? '');
      deleteForeignText(selected);
      props.onSave(
        props.xmlDoc,
        EditorConstants.changeTypes.misc.BODY_FOREIGN_TEXT_REMOVED,
        t('editor:dialog.foreignText.success.deleted'),
        null,
      );
    } catch (error) {
      showError(error);
    }
  };

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Alert severity="info">{t('editor:dialog.foreignText.contract')}</Alert>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      <FormControl required disabled={deletePending}>
        <InputLabel id="foreign-text-language-label">{t('editor:dialog.foreignText.fields.language')}</InputLabel>
        <Select
          labelId="foreign-text-language-label"
          label={t('editor:dialog.foreignText.fields.language')}
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          {editing &&
            language &&
            !FOREIGN_TEXT_LANGUAGE_SUGGESTIONS.includes(language as (typeof FOREIGN_TEXT_LANGUAGE_SUGGESTIONS)[number]) && (
              <MenuItem value={language}>{t('editor:dialog.foreignText.legacyLanguage', { language })}</MenuItem>
            )}
          {FOREIGN_TEXT_LANGUAGE_SUGGESTIONS.map((code) => (
            <MenuItem key={code} value={code}>
              {t(`editor:dialog.foreignText.languages.${code}`)} ({code})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        {editing && !deletePending && (
          <Button variant="outlined" color="error" onClick={() => setDeletePending(true)}>
            {t('editor:dialog.foreignText.buttons.delete')}
          </Button>
        )}
        {deletePending ? (
          <>
            <Button variant="outlined" onClick={() => setDeletePending(false)}>
              {t('editor:dialog.foreignText.buttons.cancelDelete')}
            </Button>
            <Button variant="contained" color="error" onClick={remove}>
              {t('editor:dialog.foreignText.buttons.confirmDelete')}
            </Button>
          </>
        ) : (
          <Button variant="contained" disabled={!language.trim()} onClick={save}>
            {t(editing ? 'editor:dialog.foreignText.buttons.update' : 'editor:dialog.foreignText.buttons.add')}
          </Button>
        )}
      </Stack>
    </Stack>
  );
};

export default ForeignTextDialog;
