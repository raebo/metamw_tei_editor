import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, MenuItem, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { EditorConstants } from '@src/constants/editor';
import type { DefaultDialogProps } from '../EditorFormDialog';
import { resolveSourceElement } from '@src/utils/editor/paragraphStructure';
import {
  deleteTable,
  deleteTableColumn,
  deleteTableRow,
  insertTableAfter,
  insertTableCell,
  insertTableColumns,
  insertTableRows,
  joinTableCellsRight,
  joinTableCellVertically,
  sortTableRows,
  splitTableCellHorizontally,
  splitTableCellVertically,
  updateTableCell,
  type TableJoinDirection,
  type TableSortDirection,
  type TableSplitDirection,
  type TableStructureOperation,
} from '@src/utils/editor/tableStructure';
import { MiscUtils } from '@src/utils/misc';

const TableStructureDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const reference = useSelector((state: RootState) => state.editorLetter.letterReference);
  const operation = reference.elementKey as TableStructureOperation | null;
  const sourcePath = reference.elementXmlId ?? '';
  const [rowCount, setRowCount] = useState(2);
  const [columnCount, setColumnCount] = useState(2);
  const [customCount, setCustomCount] = useState(1);
  const [sortColumn, setSortColumn] = useState(1);
  const [sortDirection, setSortDirection] = useState<TableSortDirection>('ascending');
  const [joinDirection, setJoinDirection] = useState<TableJoinDirection>('right');
  const [splitDirection, setSplitDirection] = useState<TableSplitDirection>('right');
  const [cellText, setCellText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!props.xmlDoc || operation !== 'table-cell-edit') return;
    try {
      setCellText(resolveSourceElement(props.xmlDoc, sourcePath).textContent ?? '');
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  }, [operation, props.xmlDoc, sourcePath]);

  const submitDisabled = useMemo(
    () => !operation || Boolean(errorMessage) || rowCount < 1 || columnCount < 1 || customCount < 1 || sortColumn < 1,
    [columnCount, customCount, errorMessage, operation, rowCount, sortColumn],
  );

  const save = () => {
    if (!props.xmlDoc || !operation) return;
    setErrorMessage(null);

    try {
      const sourceElement = resolveSourceElement(props.xmlDoc, sourcePath);
      switch (operation) {
        case 'table-create':
          insertTableAfter(sourceElement, rowCount, columnCount);
          break;
        case 'table-row-above':
          insertTableRows(sourceElement, 'before');
          break;
        case 'table-row-below':
          insertTableRows(sourceElement, 'after');
          break;
        case 'table-cell-edit':
          updateTableCell(sourceElement, cellText);
          break;
        case 'table-cell-insert':
          insertTableCell(sourceElement);
          break;
        case 'table-column-before':
          insertTableColumns(sourceElement, 'before');
          break;
        case 'table-column-after':
          insertTableColumns(sourceElement, 'after');
          break;
        case 'table-columns-custom':
          insertTableColumns(sourceElement, 'after', customCount);
          break;
        case 'table-rows-custom':
          insertTableRows(sourceElement, 'after', customCount);
          break;
        case 'table-cells-join-right':
          joinTableCellsRight(sourceElement);
          break;
        case 'table-cell-split-left':
          splitTableCellHorizontally(sourceElement, 'left');
          break;
        case 'table-cell-split-right':
          splitTableCellHorizontally(sourceElement, 'right');
          break;
        case 'table-cell-join-above':
          joinTableCellVertically(sourceElement, 'above');
          break;
        case 'table-cell-join-below':
          joinTableCellVertically(sourceElement, 'below');
          break;
        case 'table-cell-split-above':
          splitTableCellVertically(sourceElement, 'above');
          break;
        case 'table-cell-split-below':
          splitTableCellVertically(sourceElement, 'below');
          break;
        case 'table-column-delete':
          deleteTableColumn(sourceElement);
          break;
        case 'table-row-delete':
          deleteTableRow(sourceElement);
          break;
        case 'table-delete':
          deleteTable(sourceElement);
          break;
        case 'table-sort':
          sortTableRows(sourceElement, sortColumn, sortDirection);
          break;
        case 'table-join':
          if (joinDirection === 'right') joinTableCellsRight(sourceElement);
          else joinTableCellVertically(sourceElement, joinDirection);
          break;
        case 'table-split':
          if (splitDirection === 'left' || splitDirection === 'right') splitTableCellHorizontally(sourceElement, splitDirection);
          else splitTableCellVertically(sourceElement, splitDirection);
          break;
      }

      props.onSave(props.xmlDoc, EditorConstants.changeTypes.misc.BODY_STRUCTURE_CHANGED, t('editor:dialog.tableStructure.success'));
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  };

  if (!operation) return <Alert severity="error">{t('editor:dialog.tableStructure.errors.context')}</Alert>;

  const customOperation = operation === 'table-columns-custom' || operation === 'table-rows-custom';

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Alert severity="info">{t(`editor:dialog.tableStructure.operations.${operation}`)}</Alert>
      {errorMessage && (
        <Alert severity="error" role="alert">
          {errorMessage}
        </Alert>
      )}
      {operation === 'table-create' && (
        <>
          <TextField
            type="number"
            required
            label={t('editor:dialog.tableStructure.fields.rows')}
            value={rowCount}
            slotProps={{ htmlInput: { min: 1, max: 100 } }}
            onChange={(event) => setRowCount(Number(event.target.value))}
          />
          <TextField
            type="number"
            required
            label={t('editor:dialog.tableStructure.fields.columns')}
            value={columnCount}
            slotProps={{ htmlInput: { min: 1, max: 100 } }}
            onChange={(event) => setColumnCount(Number(event.target.value))}
          />
        </>
      )}
      {customOperation && (
        <TextField
          type="number"
          required
          label={t('editor:dialog.tableStructure.fields.count')}
          value={customCount}
          slotProps={{ htmlInput: { min: 1, max: 100 } }}
          onChange={(event) => setCustomCount(Number(event.target.value))}
        />
      )}
      {operation === 'table-cell-edit' && (
        <TextField
          multiline
          minRows={2}
          label={t('editor:dialog.tableStructure.fields.cellText')}
          value={cellText}
          onChange={(event) => setCellText(event.target.value)}
        />
      )}
      {operation === 'table-sort' && (
        <>
          <TextField
            type="number"
            required
            label={t('editor:dialog.tableStructure.fields.sortColumn')}
            value={sortColumn}
            slotProps={{ htmlInput: { min: 1, max: 100 } }}
            onChange={(event) => setSortColumn(Number(event.target.value))}
          />
          <TextField
            select
            label={t('editor:dialog.tableStructure.fields.sortDirection')}
            value={sortDirection}
            onChange={(event) => setSortDirection(event.target.value as TableSortDirection)}
          >
            <MenuItem value="ascending">{t('editor:dialog.tableStructure.directions.ascending')}</MenuItem>
            <MenuItem value="descending">{t('editor:dialog.tableStructure.directions.descending')}</MenuItem>
          </TextField>
        </>
      )}
      {operation === 'table-join' && (
        <TextField
          select
          label={t('editor:dialog.tableStructure.fields.joinDirection')}
          value={joinDirection}
          onChange={(event) => setJoinDirection(event.target.value as TableJoinDirection)}
        >
          {(['right', 'above', 'below'] as const).map((direction) => (
            <MenuItem key={direction} value={direction}>
              {t(`editor:dialog.tableStructure.directions.${direction}`)}
            </MenuItem>
          ))}
        </TextField>
      )}
      {operation === 'table-split' && (
        <TextField
          select
          label={t('editor:dialog.tableStructure.fields.splitDirection')}
          value={splitDirection}
          onChange={(event) => setSplitDirection(event.target.value as TableSplitDirection)}
        >
          {(['left', 'right', 'above', 'below'] as const).map((direction) => (
            <MenuItem key={direction} value={direction}>
              {t(`editor:dialog.tableStructure.directions.${direction}`)}
            </MenuItem>
          ))}
        </TextField>
      )}
      <Button variant="contained" disabled={submitDisabled} onClick={save}>
        {t(operation === 'table-delete' ? 'editor:dialog.tableStructure.submitDelete' : 'editor:dialog.tableStructure.submit')}
      </Button>
    </Stack>
  );
};

export default TableStructureDialog;
