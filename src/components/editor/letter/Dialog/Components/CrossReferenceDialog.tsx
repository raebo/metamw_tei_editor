import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { EditorConstants } from '@src/constants/editor';
import {
  CROSS_REFERENCE_KINDS,
  crossReferenceKind,
  deleteCrossReference,
  insertCrossReference,
  readCrossReference,
  resolveCrossReference,
  updateCrossReference,
  type CrossReferenceKind,
} from '@src/utils/editor/crossReference';
import { MiscUtils } from '@src/utils/misc';
import type { DefaultDialogProps } from '../EditorFormDialog';

const CrossReferenceDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const reference = useSelector((state: RootState) => state.editorLetter.letterReference);
  const editing = reference.elementKey === 'edit' || reference.elementKey === 'delete';
  const requestedKind = reference.elementType as CrossReferenceKind;
  const [element, setElement] = useState<Element | null>(null);
  const [kind, setKind] = useState<CrossReferenceKind>(CROSS_REFERENCE_KINDS.includes(requestedKind) ? requestedKind : 'generic-start');
  const [target, setTarget] = useState('');
  const [deletePending, setDeletePending] = useState(reference.elementKey === 'delete');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!editing || !reference.elementXmlId) return;
    try {
      const selected = resolveCrossReference(props.xmlDoc, reference.elementXmlId);
      const data = readCrossReference(selected);
      setElement(selected);
      setKind(crossReferenceKind(selected));
      setTarget(data.target);
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  }, [editing, props.xmlDoc, reference.elementXmlId]);

  const targetRequired = kind !== 'generic-target';
  const submitDisabled = useMemo(() => deletePending || (targetRequired && !target.trim()), [deletePending, target, targetRequired]);

  const save = () => {
    setErrorMessage(null);
    try {
      let saved: Element;
      if (editing) {
        if (!element) throw new Error('The cross-reference could not be found.');
        saved = updateCrossReference(element, target);
      } else {
        saved = insertCrossReference(props.xmlDoc, reference.elementXmlId ?? '', reference.elementKey ?? '', { kind, target });
      }
      props.onSave(
        props.xmlDoc,
        editing
          ? EditorConstants.changeTypes.misc.BODY_CROSS_REFERENCE_CHANGED
          : EditorConstants.changeTypes.misc.BODY_CROSS_REFERENCE_ADDED,
        t(editing ? 'editor:dialog.crossReference.success.updated' : 'editor:dialog.crossReference.success.added'),
        saved.getAttribute('xml:id'),
      );
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  };

  const remove = () => {
    setErrorMessage(null);
    try {
      if (!element) throw new Error('The cross-reference could not be found.');
      deleteCrossReference(element);
      props.onSave(
        props.xmlDoc,
        EditorConstants.changeTypes.misc.BODY_CROSS_REFERENCE_REMOVED,
        t('editor:dialog.crossReference.success.deleted'),
        null,
      );
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  };

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Alert severity="info">{t(`editor:dialog.crossReference.contract.${kind}`)}</Alert>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      <Typography variant="subtitle2">{t(`editor:dialog.crossReference.kinds.${kind}`)}</Typography>
      {targetRequired && (
        <TextField
          required
          multiline={kind === 'register' || kind === 'letter-annotation' || kind === 'generic-start'}
          minRows={kind === 'register' || kind === 'letter-annotation' || kind === 'generic-start' ? 2 : undefined}
          disabled={deletePending}
          label={t('editor:dialog.crossReference.fields.target')}
          helperText={t(
            kind === 'external-url'
              ? 'editor:dialog.crossReference.hints.external'
              : kind === 'internal-url'
                ? 'editor:dialog.crossReference.hints.internal'
                : 'editor:dialog.crossReference.hints.ids',
          )}
          value={target}
          onChange={(event) => setTarget(event.target.value)}
        />
      )}
      {kind === 'generic-target' && editing && (
        <TextField label={t('editor:dialog.crossReference.fields.generatedId')} value={target} slotProps={{ input: { readOnly: true } }} />
      )}
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        {editing && !deletePending && (
          <Button variant="outlined" color="error" onClick={() => setDeletePending(true)}>
            {t('editor:dialog.crossReference.buttons.delete')}
          </Button>
        )}
        {deletePending ? (
          <>
            <Button variant="outlined" onClick={() => setDeletePending(false)}>
              {t('editor:dialog.crossReference.buttons.cancelDelete')}
            </Button>
            <Button variant="contained" color="error" onClick={remove}>
              {t('editor:dialog.crossReference.buttons.confirmDelete')}
            </Button>
          </>
        ) : (
          <Button variant="contained" disabled={submitDisabled} onClick={save}>
            {t(editing ? 'editor:dialog.crossReference.buttons.update' : 'editor:dialog.crossReference.buttons.add')}
          </Button>
        )}
      </Stack>
    </Stack>
  );
};

export default CrossReferenceDialog;
