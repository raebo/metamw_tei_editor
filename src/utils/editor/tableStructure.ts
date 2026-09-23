import { EditorConstants } from '@src/constants/editor';

export type TableInsertPosition = 'before' | 'after';
export type TableSplitDirection = 'left' | 'right' | 'above' | 'below';
export type TableJoinDirection = 'right' | 'above' | 'below';
type TableVerticalJoinDirection = Exclude<TableJoinDirection, 'right'>;
export type TableSortDirection = 'ascending' | 'descending';

export type TableStructureOperation =
  | 'table-create'
  | 'table-row-above'
  | 'table-row-below'
  | 'table-cell-edit'
  | 'table-cell-insert'
  | 'table-column-before'
  | 'table-column-after'
  | 'table-columns-custom'
  | 'table-rows-custom'
  | 'table-cells-join-right'
  | 'table-cell-split-left'
  | 'table-cell-split-right'
  | 'table-cell-join-above'
  | 'table-cell-join-below'
  | 'table-cell-split-above'
  | 'table-cell-split-below'
  | 'table-column-delete'
  | 'table-row-delete'
  | 'table-delete'
  | 'table-sort'
  | 'table-join'
  | 'table-split';

type CellPlacement = {
  cell: Element;
  row: Element;
  anchorRow: number;
  anchorColumn: number;
  rowSpan: number;
  columnSpan: number;
};

type TableGrid = {
  table: Element;
  rows: Element[];
  width: number;
  grid: CellPlacement[][];
  placements: Map<Element, CellPlacement>;
};

const localName = (element: Element): string => element.localName.toLowerCase();

const directChildren = (element: Element, name: string): Element[] =>
  Array.from(element.children).filter((child) => localName(child) === name);

const assertInLetterBody = (element: Element): void => {
  let current: Element | null = element;
  while (current && localName(current) !== 'body') current = current.parentElement;

  if (!current?.parentElement || localName(current.parentElement) !== 'text') {
    throw new Error('The selected element is not inside TEI/text/body.');
  }
};

const ancestor = (source: Element, name: string): Element => {
  let current: Element | null = source;
  while (current && localName(current) !== name) current = current.parentElement;
  if (!current) throw new Error(`The selected element is not inside a ${name}.`);
  assertInLetterBody(current);
  return current;
};

const positiveInteger = (value: number, label: string): number => {
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    throw new Error(`${label} must be an integer between 1 and 100.`);
  }
  return value;
};

const spanValue = (cell: Element, attribute: 'rows' | 'cols'): number => {
  const rawValue = cell.getAttribute(attribute);
  if (rawValue === null) return 1;
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 1) throw new Error(`Cell attribute ${attribute} must be a positive integer.`);
  return value;
};

const setSpan = (cell: Element, attribute: 'rows' | 'cols', value: number): void => {
  if (value <= 1) cell.removeAttribute(attribute);
  else cell.setAttribute(attribute, String(value));
};

const createCell = (xmlDoc: Document, source?: Element): Element => {
  const cell = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'cell');
  const role = source?.getAttribute('role');
  if (role) cell.setAttribute('role', role);
  return cell;
};

const createRow = (xmlDoc: Document, columns: number): Element => {
  const row = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'row');
  for (let column = 0; column < columns; column += 1) row.appendChild(createCell(xmlDoc));
  return row;
};

const buildTableGrid = (source: Element): TableGrid => {
  const table = ancestor(source, 'table');
  const rows = directChildren(table, 'row');
  if (rows.length === 0) throw new Error('A TEI table requires at least one row.');

  const grid: CellPlacement[][] = rows.map(() => []);
  const placements = new Map<Element, CellPlacement>();
  let width = 0;

  rows.forEach((row, rowIndex) => {
    const cells = directChildren(row, 'cell');
    if (cells.length === 0) throw new Error('Every TEI table row requires at least one cell.');

    let columnIndex = 0;
    cells.forEach((cell) => {
      while (grid[rowIndex][columnIndex]) columnIndex += 1;
      const rowSpan = spanValue(cell, 'rows');
      const columnSpan = spanValue(cell, 'cols');
      if (rowIndex + rowSpan > rows.length) throw new Error('A cell row span exceeds the table.');

      const placement: CellPlacement = {
        cell,
        row,
        anchorRow: rowIndex,
        anchorColumn: columnIndex,
        rowSpan,
        columnSpan,
      };
      placements.set(cell, placement);

      for (let occupiedRow = rowIndex; occupiedRow < rowIndex + rowSpan; occupiedRow += 1) {
        for (let occupiedColumn = columnIndex; occupiedColumn < columnIndex + columnSpan; occupiedColumn += 1) {
          if (grid[occupiedRow][occupiedColumn]) throw new Error('Table cell spans overlap.');
          grid[occupiedRow][occupiedColumn] = placement;
        }
      }
      columnIndex += columnSpan;
      width = Math.max(width, columnIndex);
    });
  });

  if (
    width === 0 ||
    grid.some((row) => row.length !== width || Array.from({ length: width }, (_unused, column) => !row[column]).some(Boolean))
  ) {
    throw new Error('The table is not rectangular.');
  }

  return { table, rows, width, grid, placements };
};

const syncTableMetadata = (table: Element): TableGrid => {
  const model = buildTableGrid(table);
  table.setAttribute('rows', String(model.rows.length));
  table.setAttribute('cols', String(model.width));
  return model;
};

const placementForCell = (cell: Element): { model: TableGrid; placement: CellPlacement } => {
  if (localName(cell) !== 'cell') throw new Error('The selected element is not a table cell.');
  const model = buildTableGrid(cell);
  const placement = model.placements.get(cell);
  if (!placement) throw new Error('The selected table cell could not be resolved.');
  return { model, placement };
};

const rowForSource = (source: Element): Element => ancestor(source, 'row');

const referenceCellAtColumn = (model: TableGrid, rowIndex: number, column: number): Element | null => {
  const directPlacements = Array.from(model.placements.values())
    .filter((placement) => placement.anchorRow === rowIndex && placement.anchorColumn >= column)
    .sort((left, right) => left.anchorColumn - right.anchorColumn);
  return directPlacements[0]?.cell ?? null;
};

const insertCellAtColumn = (model: TableGrid, rowIndex: number, column: number, cell: Element): void => {
  const row = model.rows[rowIndex];
  row.insertBefore(cell, referenceCellAtColumn(model, rowIndex, column));
};

const appendCellContent = (target: Element, source: Element): void => {
  const targetHasText = Boolean(target.textContent?.trim());
  const sourceHasText = Boolean(source.textContent?.trim());
  if (targetHasText && sourceHasText) target.appendChild(target.ownerDocument.createTextNode(' '));
  while (source.firstChild) target.appendChild(source.firstChild);
};

const insertColumnAtBoundary = (table: Element, boundary: number): void => {
  const model = buildTableGrid(table);
  if (boundary < 0 || boundary > model.width) throw new Error('The selected column boundary is invalid.');

  const expanded = new Set<Element>();
  model.rows.forEach((_row, rowIndex) => {
    const crossing =
      boundary > 0 && boundary < model.width && model.grid[rowIndex][boundary - 1] === model.grid[rowIndex][boundary]
        ? model.grid[rowIndex][boundary]
        : null;
    if (crossing) {
      if (!expanded.has(crossing.cell)) {
        setSpan(crossing.cell, 'cols', crossing.columnSpan + 1);
        expanded.add(crossing.cell);
      }
    } else {
      insertCellAtColumn(model, rowIndex, boundary, createCell(table.ownerDocument));
    }
  });
  syncTableMetadata(table);
};

const insertRowAtBoundary = (table: Element, boundary: number): void => {
  const model = buildTableGrid(table);
  if (boundary < 0 || boundary > model.rows.length) throw new Error('The selected row boundary is invalid.');

  const crossing = new Set<CellPlacement>();
  if (boundary > 0 && boundary < model.rows.length) {
    for (let column = 0; column < model.width; column += 1) {
      const above = model.grid[boundary - 1][column];
      const below = model.grid[boundary][column];
      if (above === below) crossing.add(above);
    }
  }

  const coveredColumns = new Set<number>();
  crossing.forEach((placement) => {
    for (let column = placement.anchorColumn; column < placement.anchorColumn + placement.columnSpan; column += 1) {
      coveredColumns.add(column);
    }
  });
  if (coveredColumns.size === model.width) {
    throw new Error('A row cannot be inserted entirely inside row-spanning cells.');
  }
  crossing.forEach((placement) => setSpan(placement.cell, 'rows', placement.rowSpan + 1));

  const row = table.ownerDocument.createElementNS(EditorConstants.TEI_NS, 'row');
  for (let column = 0; column < model.width; column += 1) {
    if (!coveredColumns.has(column)) row.appendChild(createCell(table.ownerDocument));
  }
  table.insertBefore(row, model.rows[boundary] ?? null);
  syncTableMetadata(table);
};

export const insertTableAfter = (anchor: Element, rows: number, columns: number): Element => {
  assertInLetterBody(anchor);
  if (!anchor.parentNode || localName(anchor) === 'body') throw new Error('A table cannot be inserted after the selected element.');
  const rowCount = positiveInteger(rows, 'Row count');
  const columnCount = positiveInteger(columns, 'Column count');
  const table = anchor.ownerDocument.createElementNS(EditorConstants.TEI_NS, 'table');
  for (let row = 0; row < rowCount; row += 1) table.appendChild(createRow(anchor.ownerDocument, columnCount));
  anchor.parentNode.insertBefore(table, anchor.nextSibling);
  syncTableMetadata(table);
  return table;
};

export const insertTableRows = (source: Element, position: TableInsertPosition, count = 1): Element => {
  const table = ancestor(source, 'table');
  const row = rowForSource(source);
  const rowCount = positiveInteger(count, 'Row count');
  const initialModel = buildTableGrid(table);
  const rowIndex = initialModel.rows.indexOf(row);
  if (rowIndex < 0) throw new Error('The selected table row could not be resolved.');
  const boundary = position === 'before' ? rowIndex : rowIndex + 1;
  for (let index = 0; index < rowCount; index += 1) insertRowAtBoundary(table, boundary);
  return table;
};

export const insertTableColumns = (source: Element, position: TableInsertPosition, count = 1): Element => {
  const columnCount = positiveInteger(count, 'Column count');
  const { model, placement } = placementForCell(source);
  const boundary = position === 'before' ? placement.anchorColumn : placement.anchorColumn + placement.columnSpan;
  for (let index = 0; index < columnCount; index += 1) insertColumnAtBoundary(model.table, boundary);
  return model.table;
};

export const insertTableCell = (source: Element): Element => insertTableColumns(source, 'after', 1);

export const updateTableCell = (source: Element, text: string): Element => {
  placementForCell(source);
  source.textContent = text.trim();
  return source;
};

export const deleteTableColumn = (source: Element): Element => {
  const { model, placement } = placementForCell(source);
  if (model.width <= 1) throw new Error('The last table column cannot be deleted.');
  const affected = new Set(Array.from(model.grid, (row) => row[placement.anchorColumn]));

  affected.forEach((item) => {
    if (item.columnSpan === 1 && directChildren(item.row, 'cell').length <= 1) {
      throw new Error('Deleting this column would leave an empty TEI row.');
    }
  });
  affected.forEach((item) => {
    if (item.columnSpan > 1) setSpan(item.cell, 'cols', item.columnSpan - 1);
    else item.cell.remove();
  });
  syncTableMetadata(model.table);
  return model.table;
};

export const deleteTableRow = (source: Element): Element => {
  const table = ancestor(source, 'table');
  const row = rowForSource(source);
  const model = buildTableGrid(table);
  const rowIndex = model.rows.indexOf(row);
  if (model.rows.length <= 1) throw new Error('The last table row cannot be deleted.');
  if (rowIndex < 0) throw new Error('The selected table row could not be resolved.');

  const anchored = Array.from(model.placements.values()).filter((placement) => placement.anchorRow === rowIndex);
  const spanningFromAbove = new Set<CellPlacement>();
  for (let column = 0; column < model.width; column += 1) {
    const item = model.grid[rowIndex][column];
    if (item.anchorRow < rowIndex) spanningFromAbove.add(item);
  }
  spanningFromAbove.forEach((item) => setSpan(item.cell, 'rows', item.rowSpan - 1));

  const survivors = anchored.filter((item) => item.rowSpan > 1).sort((left, right) => left.anchorColumn - right.anchorColumn);
  const nextRowIndex = rowIndex + 1;
  survivors.forEach((item) => {
    setSpan(item.cell, 'rows', item.rowSpan - 1);
    insertCellAtColumn(model, nextRowIndex, item.anchorColumn, item.cell);
  });
  row.remove();
  syncTableMetadata(table);
  return table;
};

export const deleteTable = (source: Element): Element => {
  const table = ancestor(source, 'table');
  table.remove();
  return table;
};

export const joinTableCellsRight = (source: Element): Element => {
  const { model, placement } = placementForCell(source);
  const rightColumn = placement.anchorColumn + placement.columnSpan;
  if (rightColumn >= model.width) throw new Error('There is no cell to the right.');
  const right = model.grid[placement.anchorRow][rightColumn];
  if (right.anchorRow !== placement.anchorRow || right.rowSpan !== placement.rowSpan) {
    throw new Error('Only adjacent cells with the same row span can be joined.');
  }

  appendCellContent(placement.cell, right.cell);
  setSpan(placement.cell, 'cols', placement.columnSpan + right.columnSpan);
  right.cell.remove();
  syncTableMetadata(model.table);
  return placement.cell;
};

export const splitTableCellHorizontally = (source: Element, direction: 'left' | 'right'): Element => {
  const { model, placement } = placementForCell(source);
  if (placement.columnSpan <= 1) throw new Error('The selected cell does not span multiple columns.');
  const newCell = createCell(source.ownerDocument, source);
  setSpan(newCell, 'rows', placement.rowSpan);
  setSpan(source, 'cols', placement.columnSpan - 1);
  if (direction === 'left') placement.row.insertBefore(newCell, source);
  else placement.row.insertBefore(newCell, source.nextSibling);
  syncTableMetadata(model.table);
  return newCell;
};

export const joinTableCellVertically = (source: Element, direction: TableVerticalJoinDirection): Element => {
  const { model, placement } = placementForCell(source);
  const targetRow = direction === 'above' ? placement.anchorRow - 1 : placement.anchorRow + placement.rowSpan;
  if (targetRow < 0 || targetRow >= model.rows.length) throw new Error(`There is no cell ${direction} the selection.`);
  const other = model.grid[targetRow][placement.anchorColumn];
  const adjacent =
    direction === 'above'
      ? other.anchorRow + other.rowSpan === placement.anchorRow
      : other.anchorRow === placement.anchorRow + placement.rowSpan;
  if (!adjacent || other.anchorColumn !== placement.anchorColumn || other.columnSpan !== placement.columnSpan) {
    throw new Error('Only vertically aligned cells with the same column span can be joined.');
  }
  const keeper = direction === 'above' ? other : placement;
  const donor = direction === 'above' ? placement : other;
  if (directChildren(donor.row, 'cell').length <= 1) {
    throw new Error('Joining these cells would leave an empty TEI row.');
  }
  appendCellContent(keeper.cell, donor.cell);
  setSpan(keeper.cell, 'rows', keeper.rowSpan + donor.rowSpan);
  donor.cell.remove();
  syncTableMetadata(model.table);
  return keeper.cell;
};

export const splitTableCellVertically = (source: Element, direction: 'above' | 'below'): Element => {
  const { model, placement } = placementForCell(source);
  if (placement.rowSpan <= 1) throw new Error('The selected cell does not span multiple rows.');
  const newCell = createCell(source.ownerDocument, source);
  setSpan(newCell, 'cols', placement.columnSpan);
  setSpan(source, 'rows', placement.rowSpan - 1);

  if (direction === 'above') {
    placement.row.insertBefore(newCell, source);
    insertCellAtColumn(model, placement.anchorRow + 1, placement.anchorColumn, source);
  } else {
    insertCellAtColumn(model, placement.anchorRow + placement.rowSpan - 1, placement.anchorColumn, newCell);
  }
  syncTableMetadata(model.table);
  return newCell;
};

export const sortTableRows = (source: Element, column: number, direction: TableSortDirection): Element => {
  const model = buildTableGrid(source);
  const columnIndex = positiveInteger(column, 'Sort column') - 1;
  if (columnIndex >= model.width) throw new Error('The selected sort column does not exist.');
  if (Array.from(model.placements.values()).some((placement) => placement.rowSpan !== 1 || placement.columnSpan !== 1)) {
    throw new Error('Tables containing joined cells cannot be sorted.');
  }

  const sortable = model.rows.filter((row) => row.getAttribute('role') !== 'label');
  const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
  const sorted = sortable
    .map((row, index) => ({
      row,
      index,
      text: model.grid[model.rows.indexOf(row)][columnIndex].cell.textContent?.trim() ?? '',
    }))
    .sort((left, right) => {
      const comparison = collator.compare(left.text, right.text);
      const directed = direction === 'ascending' ? comparison : -comparison;
      return directed || left.index - right.index;
    });

  const placeholders = sortable.map((row) => {
    const marker = row.ownerDocument.createComment('table-sort-row');
    row.parentNode?.insertBefore(marker, row);
    row.remove();
    return marker;
  });
  sorted.forEach(({ row }, index) => placeholders[index].parentNode?.replaceChild(row, placeholders[index]));
  return syncTableMetadata(model.table).table;
};

export const tableDimensions = (source: Element): { rows: number; columns: number } => {
  const model = buildTableGrid(source);
  return { rows: model.rows.length, columns: model.width };
};
