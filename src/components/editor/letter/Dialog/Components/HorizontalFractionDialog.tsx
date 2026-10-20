import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { EditorConstants } from '@src/constants/editor';
import {
  deleteFraction,
  insertFraction,
  readFraction,
  resolveFraction,
  updateFraction,
  type FractionVariant,
} from '@src/utils/editor/horizontalFraction';
import { MiscUtils } from '@src/utils/misc';
import type { DefaultDialogProps } from '../EditorFormDialog';

type HorizontalFractionDialogProps = DefaultDialogProps & {
  variant?: FractionVariant;
};

const changeTypesByVariant: Record<FractionVariant, { added: string; changed: string; removed: string }> = {
  horizontal: {
    added: EditorConstants.changeTypes.misc.BODY_HORIZONTAL_FRACTION_ADDED,
    changed: EditorConstants.changeTypes.misc.BODY_HORIZONTAL_FRACTION_CHANGED,
    removed: EditorConstants.changeTypes.misc.BODY_HORIZONTAL_FRACTION_REMOVED,
  },
  'vertical-slash': {
    added: EditorConstants.changeTypes.misc.BODY_VERTICAL_SLASH_FRACTION_ADDED,
    changed: EditorConstants.changeTypes.misc.BODY_VERTICAL_SLASH_FRACTION_CHANGED,
    removed: EditorConstants.changeTypes.misc.BODY_VERTICAL_SLASH_FRACTION_REMOVED,
  },
  'vertical-noslash': {
    added: EditorConstants.changeTypes.misc.BODY_VERTICAL_NOSLASH_FRACTION_ADDED,
    changed: EditorConstants.changeTypes.misc.BODY_VERTICAL_NOSLASH_FRACTION_CHANGED,
    removed: EditorConstants.changeTypes.misc.BODY_VERTICAL_NOSLASH_FRACTION_REMOVED,
  },
};

const HorizontalFractionDialog = ({ variant = 'horizontal', ...props }: HorizontalFractionDialogProps) => {
  const { t } = useTranslation();
  const reference = useSelector((state: RootState) => state.editorLetter.letterReference);
  const editing = reference.elementKey === 'edit' || reference.elementKey === 'delete';
  const [formula, setFormula] = useState<Element | null>(null);
  const [numerator, setNumerator] = useState('');
  const [denominator, setDenominator] = useState('');
  const [deletePending, setDeletePending] = useState(reference.elementKey === 'delete');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const submitDisabled = useMemo(() => !numerator.trim() || !denominator.trim(), [denominator, numerator]);

  useEffect(() => {
    if (!editing || !reference.elementXmlId) return;
    try {
      const selected = resolveFraction(props.xmlDoc, reference.elementXmlId, variant);
      const data = readFraction(selected);
      setFormula(selected);
      setNumerator(data.numerator);
      setDenominator(data.denominator);
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  }, [editing, props.xmlDoc, reference.elementXmlId, variant]);

  const save = () => {
    setErrorMessage(null);
    try {
      const saved = editing
        ? updateFraction(
            formula ?? resolveFraction(props.xmlDoc, reference.elementXmlId ?? '', variant),
            {
              numerator,
              denominator,
            },
            variant,
          )
        : insertFraction(props.xmlDoc, reference.elementXmlId ?? '', reference.elementKey ?? '', { numerator, denominator }, variant);
      props.onSave(
        props.xmlDoc,
        editing ? changeTypesByVariant[variant].changed : changeTypesByVariant[variant].added,
        t(editing ? 'editor:dialog.horizontalFraction.success.updated' : 'editor:dialog.horizontalFraction.success.added'),
        saved.getAttribute('xml:id'),
      );
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  };

  const remove = () => {
    setErrorMessage(null);
    try {
      deleteFraction(formula ?? resolveFraction(props.xmlDoc, reference.elementXmlId ?? '', variant), variant);
      props.onSave(props.xmlDoc, changeTypesByVariant[variant].removed, t('editor:dialog.horizontalFraction.success.deleted'), null);
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  };

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Alert severity="info">{t(`editor:dialog.horizontalFraction.contract.${variant}`)}</Alert>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      <TextField
        required
        disabled={deletePending}
        label={t('editor:dialog.horizontalFraction.fields.numerator')}
        value={numerator}
        onChange={(event) => setNumerator(event.target.value)}
      />
      <TextField
        required
        disabled={deletePending}
        label={t('editor:dialog.horizontalFraction.fields.denominator')}
        value={denominator}
        onChange={(event) => setDenominator(event.target.value)}
      />
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        {editing && !deletePending && (
          <Button variant="outlined" color="error" onClick={() => setDeletePending(true)}>
            {t('editor:dialog.horizontalFraction.buttons.delete')}
          </Button>
        )}
        {deletePending ? (
          <>
            <Button variant="outlined" onClick={() => setDeletePending(false)}>
              {t('editor:dialog.horizontalFraction.buttons.cancelDelete')}
            </Button>
            <Button variant="contained" color="error" onClick={remove}>
              {t('editor:dialog.horizontalFraction.buttons.confirmDelete')}
            </Button>
          </>
        ) : (
          <Button variant="contained" disabled={submitDisabled} onClick={save}>
            {t(editing ? 'editor:dialog.horizontalFraction.buttons.update' : 'editor:dialog.horizontalFraction.buttons.add')}
          </Button>
        )}
      </Stack>
    </Stack>
  );
};

export default HorizontalFractionDialog;
