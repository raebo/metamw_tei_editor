import React, { useEffect, useState } from 'react';
import { Alert, Button, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { RootState } from '@src/redux/redux.store';
import { EditorConstants } from '@src/constants/editor';
import {
  deleteSectionAddressLine,
  readSectionAddressLine,
  resolveAddressSource,
  updateSectionAddressLine,
} from '@src/utils/editor/sectionAddressLine';
import type { DefaultDialogProps } from '../EditorFormDialog';

const SectionAddressLineDialog = ({ xmlDoc, onSave, onClose }: DefaultDialogProps) => {
  const { t } = useTranslation();
  const reference = useSelector((state: RootState) => state.editorLetter.letterReference);
  const deleting = reference.elementKey === 'delete';
  const [content, setContent] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const line = readSectionAddressLine(
        resolveAddressSource(xmlDoc, reference.elementXmlId ?? ''),
      );
      setContent(line.textContent ?? '');
      setError(!deleting && line.children.length > 0);
    } catch {
      setError(true);
    }
  }, [deleting, reference.elementXmlId, xmlDoc]);

  const save = () => {
    try {
      const line = resolveAddressSource(xmlDoc, reference.elementXmlId ?? '');
      if (deleting) deleteSectionAddressLine(line);
      else updateSectionAddressLine(line, content);
      onSave(
        xmlDoc,
        deleting
          ? EditorConstants.changeTypes.misc.ADDRLINE_REMOVED
          : EditorConstants.changeTypes.misc.ADDRLINE_CHANGED,
        t(`editor:dialog.sectionAddressLine.${deleting ? 'deleted' : 'saved'}`),
      );
    } catch {
      setError(true);
    }
  };

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      {error && <Alert severity="error">{t('editor:dialog.sectionAddressLine.error')}</Alert>}
      {deleting ? (
        <Alert severity="warning">{t('editor:dialog.sectionAddressLine.confirmDelete')}</Alert>
      ) : (
        <TextField
          fullWidth
          label={t('editor:dialog.sectionAddressLine.content')}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      )}
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button onClick={onClose}>{t('editor:dialog.sectionAddressLine.cancel')}</Button>
        <Button
          variant="contained"
          color={deleting ? 'error' : 'primary'}
          disabled={error}
          onClick={save}
        >
          {t(`editor:dialog.sectionAddressLine.${deleting ? 'delete' : 'save'}`)}
        </Button>
      </Stack>
    </Stack>
  );
};

export default SectionAddressLineDialog;
