import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { EditorConstants } from '@src/constants/editor';
import type { DefaultDialogProps } from '../EditorFormDialog';
import {
  PARAGRAPH_VARIANTS,
  appendParagraphToSection,
  convertParagraph,
  insertParagraphAfter,
  insertSection,
  paragraphVariantFromElement,
  resolveSourceElement,
  splitMarkedParagraph,
  type ParagraphStructureOperation,
  type ParagraphVariant,
  updatePlainParagraphText,
  updateSectionHeading,
} from '@src/utils/editor/paragraphStructure';
import { MiscUtils } from '@src/utils/misc';

const PARAGRAPH_OPERATIONS = new Set<ParagraphStructureOperation>([
  'paragraph-insert',
  'paragraph-append',
  'paragraph-convert',
  'paragraph-split',
]);

const ParagraphStructureDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const reference = useSelector((state: RootState) => state.editorLetter.letterReference);
  const operation = reference.elementKey as ParagraphStructureOperation | null;
  const sourcePath = reference.elementXmlId ?? '';
  const [variant, setVariant] = useState<ParagraphVariant>('indented');
  const [paragraphText, setParagraphText] = useState('');
  const [heading, setHeading] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isParagraphOperation = operation ? PARAGRAPH_OPERATIONS.has(operation) : false;
  const isSectionInsert = operation === 'section-child' || operation === 'section-sibling';

  useEffect(() => {
    if (!props.xmlDoc || !operation || operation === 'paragraph-split') return;
    try {
      const sourceElement = resolveSourceElement(props.xmlDoc, sourcePath);
      if (operation === 'paragraph-convert') {
        setVariant(paragraphVariantFromElement(sourceElement));
      } else if (operation === 'paragraph-edit') {
        if (sourceElement.children.length > 0) {
          throw new Error('Paragraphs with embedded markup cannot be edited directly.');
        }
        setParagraphText(sourceElement.textContent ?? '');
      } else if (operation === 'section-edit') {
        const directHead = Array.from(sourceElement.children).find((child) => child.localName.toLowerCase() === 'head');
        setHeading(directHead?.textContent ?? '');
      }
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  }, [operation, props.xmlDoc, sourcePath]);

  const submitDisabled = useMemo(() => {
    if (!operation || errorMessage) return true;
    if (operation === 'section-edit') return !heading.trim();
    return false;
  }, [errorMessage, heading, operation]);

  const save = () => {
    if (!props.xmlDoc || !operation) return;
    setErrorMessage(null);

    try {
      if (operation === 'paragraph-split') {
        splitMarkedParagraph(props.xmlDoc, variant);
      } else {
        const sourceElement = resolveSourceElement(props.xmlDoc, sourcePath);
        switch (operation) {
          case 'paragraph-insert':
            insertParagraphAfter(sourceElement, variant, paragraphText);
            break;
          case 'paragraph-append':
            appendParagraphToSection(sourceElement, variant, paragraphText);
            break;
          case 'paragraph-edit':
            updatePlainParagraphText(props.xmlDoc, sourcePath, paragraphText);
            break;
          case 'paragraph-convert':
            convertParagraph(sourceElement, variant);
            break;
          case 'section-child':
            insertSection(sourceElement, 'child', heading, paragraphText);
            break;
          case 'section-sibling':
            insertSection(sourceElement, 'sibling', heading, paragraphText);
            break;
          case 'section-edit':
            updateSectionHeading(sourceElement, heading);
            break;
        }
      }

      props.onSave(
        props.xmlDoc,
        operation === 'paragraph-edit'
          ? EditorConstants.changeTypes.MANUAL_CODE_CHANGE
          : EditorConstants.changeTypes.misc.BODY_STRUCTURE_CHANGED,
        t('editor:dialog.paragraphStructure.success'),
      );
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  };

  if (!operation) {
    return <Alert severity="error">{t('editor:dialog.paragraphStructure.errors.context')}</Alert>;
  }

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Alert severity="info">{t(`editor:dialog.paragraphStructure.operations.${operation}`)}</Alert>
      {errorMessage && (
        <Alert severity="error" role="alert">
          {errorMessage}
        </Alert>
      )}
      {isParagraphOperation && (
        <TextField
          select
          required
          label={t('editor:dialog.paragraphStructure.fields.variant')}
          value={variant}
          onChange={(event) => setVariant(event.target.value as ParagraphVariant)}
        >
          {PARAGRAPH_VARIANTS.map((item) => (
            <MenuItem key={item} value={item}>
              {t(`editor:dialog.paragraphStructure.variants.${item}`)}
            </MenuItem>
          ))}
        </TextField>
      )}
      {(operation === 'paragraph-insert' || operation === 'paragraph-append' || operation === 'paragraph-edit' || isSectionInsert) && (
        <TextField
          multiline
          minRows={2}
          label={t('editor:dialog.paragraphStructure.fields.paragraphText')}
          value={paragraphText}
          onChange={(event) => setParagraphText(event.target.value)}
        />
      )}
      {(isSectionInsert || operation === 'section-edit') && (
        <TextField
          required={operation === 'section-edit'}
          label={t('editor:dialog.paragraphStructure.fields.heading')}
          value={heading}
          onChange={(event) => setHeading(event.target.value)}
        />
      )}
      <Button variant="contained" disabled={submitDisabled} onClick={save}>
        {t('editor:dialog.paragraphStructure.submit')}
      </Button>
    </Stack>
  );
};

export default ParagraphStructureDialog;
