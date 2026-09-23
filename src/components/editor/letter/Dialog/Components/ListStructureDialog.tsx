import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { EditorConstants } from '@src/constants/editor';
import type { DefaultDialogProps } from '../EditorFormDialog';
import { resolveSourceElement } from '@src/utils/editor/paragraphStructure';
import {
  appendListItem,
  convertMarkedSelectionToList,
  insertEmptyListAfter,
  removeList,
  removeListItem,
  sortListItems,
  updateListItem,
  type ListStructureOperation,
  type TeiListType,
} from '@src/utils/editor/listStructure';
import { MiscUtils } from '@src/utils/misc';

const listTypeFromOperation = (operation: ListStructureOperation): TeiListType =>
  operation.endsWith('ordered') && !operation.endsWith('unordered') ? 'ordered' : 'unordered';

const ListStructureDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const reference = useSelector((state: RootState) => state.editorLetter.letterReference);
  const operation = reference.elementKey as ListStructureOperation | null;
  const sourcePath = reference.elementXmlId ?? '';
  const [itemText, setItemText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!props.xmlDoc || operation !== 'list-edit-item') return;
    try {
      setItemText(resolveSourceElement(props.xmlDoc, sourcePath).textContent ?? '');
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  }, [operation, props.xmlDoc, sourcePath]);

  const submitDisabled = useMemo(
    () => !operation || Boolean(errorMessage) || ((operation === 'list-add-item' || operation === 'list-edit-item') && !itemText.trim()),
    [errorMessage, itemText, operation],
  );

  const save = () => {
    if (!props.xmlDoc || !operation) return;
    setErrorMessage(null);

    try {
      if (operation.startsWith('list-selection-')) {
        convertMarkedSelectionToList(props.xmlDoc, listTypeFromOperation(operation));
      } else {
        const sourceElement = resolveSourceElement(props.xmlDoc, sourcePath);
        switch (operation) {
          case 'list-empty-ordered':
          case 'list-empty-unordered':
            insertEmptyListAfter(sourceElement, listTypeFromOperation(operation));
            break;
          case 'list-add-item':
            appendListItem(sourceElement, itemText);
            break;
          case 'list-edit-item':
            updateListItem(sourceElement, itemText);
            break;
          case 'list-delete-item':
            removeListItem(sourceElement);
            break;
          case 'list-delete':
            removeList(sourceElement);
            break;
          case 'list-sort-ascending':
            sortListItems(sourceElement, 'ascending');
            break;
          case 'list-sort-descending':
            sortListItems(sourceElement, 'descending');
            break;
        }
      }

      props.onSave(props.xmlDoc, EditorConstants.changeTypes.misc.BODY_STRUCTURE_CHANGED, t('editor:dialog.listStructure.success'));
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  };

  if (!operation) {
    return <Alert severity="error">{t('editor:dialog.listStructure.errors.context')}</Alert>;
  }

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Alert severity="info">{t(`editor:dialog.listStructure.operations.${operation}`)}</Alert>
      {errorMessage && (
        <Alert severity="error" role="alert">
          {errorMessage}
        </Alert>
      )}
      {(operation === 'list-add-item' || operation === 'list-edit-item') && (
        <TextField
          required
          multiline
          minRows={2}
          label={t('editor:dialog.listStructure.fields.itemText')}
          value={itemText}
          onChange={(event) => setItemText(event.target.value)}
        />
      )}
      <Button variant="contained" disabled={submitDisabled} onClick={save}>
        {operation === 'list-delete' || operation === 'list-delete-item'
          ? t('editor:dialog.listStructure.submitDelete')
          : t('editor:dialog.listStructure.submit')}
      </Button>
    </Stack>
  );
};

export default ListStructureDialog;
