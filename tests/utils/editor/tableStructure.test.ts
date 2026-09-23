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
  tableDimensions,
  updateTableCell,
} from '@src/utils/editor/tableStructure';

const parseXml = (xml: string): XMLDocument => new DOMParser().parseFromString(xml, 'application/xml');

const letterXml = (body: string) => `<TEI xmlns="http://www.tei-c.org/ns/1.0"><text><body>${body}</body></text></TEI>`;

const cellTexts = (table: Element): string[][] =>
  Array.from(table.children)
    .filter((child) => child.localName === 'row')
    .map((row) =>
      Array.from(row.children)
        .filter((child) => child.localName === 'cell')
        .map((cell) => cell.textContent ?? ''),
    );

describe('tableStructure', () => {
  it('creates a rectangular table with synchronized dimensions', () => {
    const xmlDoc = parseXml(letterXml('<div><p>Anchor</p></div>'));

    const table = insertTableAfter(xmlDoc.querySelector('p')!, 2, 3);

    expect(table.getAttribute('rows')).toBe('2');
    expect(table.getAttribute('cols')).toBe('3');
    expect(cellTexts(table)).toEqual([
      ['', '', ''],
      ['', '', ''],
    ]);
  });

  it('inserts single and custom rows above and below the selected row', () => {
    const xmlDoc = parseXml(letterXml('<div><table><row><cell>A</cell><cell>B</cell></row></table></div>'));
    const table = xmlDoc.querySelector('table')!;
    const row = xmlDoc.querySelector('row')!;

    insertTableRows(row, 'before');
    insertTableRows(row, 'after', 2);

    expect(tableDimensions(table)).toEqual({ rows: 4, columns: 2 });
    expect(cellTexts(table)[1]).toEqual(['A', 'B']);
  });

  it('inserts cells and custom columns while keeping all rows rectangular', () => {
    const xmlDoc = parseXml(
      letterXml('<div><table><row><cell>A</cell><cell>B</cell></row><row><cell>C</cell><cell>D</cell></row></table></div>'),
    );
    const table = xmlDoc.querySelector('table')!;
    const firstCell = xmlDoc.querySelector('cell')!;

    insertTableCell(firstCell);
    insertTableColumns(firstCell, 'before', 2);

    expect(tableDimensions(table)).toEqual({ rows: 2, columns: 5 });
    expect(Array.from(table.querySelectorAll('row')).map((row) => row.querySelectorAll('cell').length)).toEqual([5, 5]);

    deleteTableColumn(firstCell);
    expect(tableDimensions(table)).toEqual({ rows: 2, columns: 4 });
  });

  it('joins cells horizontally and splits the joined cell to either side', () => {
    const xmlDoc = parseXml(letterXml('<div><table><row><cell>A</cell><cell>B</cell><cell>C</cell></row></table></div>'));
    const table = xmlDoc.querySelector('table')!;
    const firstCell = xmlDoc.querySelector('cell')!;

    joinTableCellsRight(firstCell);
    expect(firstCell.getAttribute('cols')).toBe('2');
    expect(firstCell.textContent).toBe('A B');
    expect(tableDimensions(table)).toEqual({ rows: 1, columns: 3 });

    const left = splitTableCellHorizontally(firstCell, 'left');
    expect(left.nextElementSibling).toBe(firstCell);
    expect(firstCell.hasAttribute('cols')).toBe(false);

    joinTableCellsRight(left);
    const right = splitTableCellHorizontally(left, 'right');
    expect(left.nextElementSibling).toBe(right);
    expect(tableDimensions(table)).toEqual({ rows: 1, columns: 3 });
  });

  it('joins vertically aligned cells and splits them above and below', () => {
    const xmlDoc = parseXml(
      letterXml('<div><table><row><cell>A</cell><cell>B</cell></row><row><cell>C</cell><cell>D</cell></row></table></div>'),
    );
    const table = xmlDoc.querySelector('table')!;
    const firstCell = xmlDoc.querySelector('cell')!;

    joinTableCellVertically(firstCell, 'below');
    expect(firstCell.getAttribute('rows')).toBe('2');
    expect(firstCell.textContent).toBe('A C');
    expect(tableDimensions(table)).toEqual({ rows: 2, columns: 2 });

    const below = splitTableCellVertically(firstCell, 'below');
    expect(below.parentElement).toBe(table.querySelectorAll('row')[1]);
    expect(firstCell.hasAttribute('rows')).toBe(false);

    joinTableCellVertically(below, 'above');
    const above = splitTableCellVertically(firstCell, 'above');
    expect(above.parentElement).toBe(table.querySelectorAll('row')[0]);
    expect(firstCell.parentElement).toBe(table.querySelectorAll('row')[1]);
  });

  it('deletes first and last rows while preserving a rectangular table', () => {
    const xmlDoc = parseXml(
      letterXml(
        '<div><table><row><cell>A</cell><cell>B</cell></row><row><cell>C</cell><cell>D</cell></row><row><cell>E</cell><cell>F</cell></row></table></div>',
      ),
    );
    const table = xmlDoc.querySelector('table')!;

    deleteTableRow(table.querySelectorAll('row')[0]);
    deleteTableRow(table.querySelectorAll('row')[1]);

    expect(cellTexts(table)).toEqual([['C', 'D']]);
    expect(tableDimensions(table)).toEqual({ rows: 1, columns: 2 });
  });

  it('sorts data rows by a selected column and keeps label rows fixed', () => {
    const xmlDoc = parseXml(
      letterXml(
        '<div><table><row role="label"><cell>Name</cell><cell>Value</cell></row><row><cell>B</cell><cell>10</cell></row><row><cell>A</cell><cell>2</cell></row></table></div>',
      ),
    );
    const table = xmlDoc.querySelector('table')!;

    sortTableRows(table, 2, 'ascending');
    expect(cellTexts(table)).toEqual([
      ['Name', 'Value'],
      ['A', '2'],
      ['B', '10'],
    ]);

    sortTableRows(table, 1, 'descending');
    expect(cellTexts(table).map((row) => row[0])).toEqual(['Name', 'B', 'A']);
  });

  it('updates a selected cell with plain text', () => {
    const xmlDoc = parseXml(letterXml('<div><table><row><cell><hi>Old</hi></cell></row></table></div>'));
    const cell = xmlDoc.querySelector('cell')!;

    updateTableCell(cell, ' New value ');

    expect(cell.textContent).toBe('New value');
    expect(cell.children).toHaveLength(0);
  });

  it('deletes the complete selected table', () => {
    const xmlDoc = parseXml(letterXml('<div><p>Before</p><table><row><cell>A</cell></row></table><p>After</p></div>'));

    deleteTable(xmlDoc.querySelector('cell')!);

    expect(xmlDoc.querySelector('table')).toBeNull();
    expect(Array.from(xmlDoc.querySelectorAll('p')).map((paragraph) => paragraph.textContent)).toEqual(['Before', 'After']);
  });

  it('rejects invalid contexts and operations that would empty the table', () => {
    const xmlDoc = parseXml(
      '<TEI xmlns="http://www.tei-c.org/ns/1.0"><teiHeader><p>Header</p></teiHeader><text><body><table><row><cell>A</cell></row></table></body></text></TEI>',
    );
    const cell = xmlDoc.querySelector('cell')!;

    expect(() => insertTableAfter(xmlDoc.querySelector('p')!, 2, 2)).toThrow(/TEI\/text\/body/);
    expect(() => deleteTableColumn(cell)).toThrow(/last table column/);
    expect(() => deleteTableRow(cell)).toThrow(/last table row/);
    expect(() => joinTableCellsRight(cell)).toThrow(/right/);
  });
});
