import {
  appendListItem,
  convertMarkedSelectionToList,
  insertEmptyListAfter,
  removeList,
  removeListItem,
  sortListItems,
  updateListItem,
} from '@src/utils/editor/listStructure';

const parseXml = (xml: string): XMLDocument => new DOMParser().parseFromString(xml, 'application/xml');

const letterXml = (body: string) => `<TEI xmlns="http://www.tei-c.org/ns/1.0"><text><body>${body}</body></text></TEI>`;

describe('listStructure', () => {
  it('inserts empty ordered and unordered lists after a body element', () => {
    const xmlDoc = parseXml(letterXml('<div><p>Text</p></div>'));
    const paragraph = xmlDoc.querySelector('p')!;

    const ordered = insertEmptyListAfter(paragraph, 'ordered');
    const unordered = insertEmptyListAfter(ordered, 'unordered');

    expect(ordered.outerHTML).toBe('<list xmlns="http://www.tei-c.org/ns/1.0" type="ordered"/>');
    expect(unordered.outerHTML).toBe('<list xmlns="http://www.tei-c.org/ns/1.0" type="unordered"/>');
  });

  it('converts a marked selection to a list item while preserving surrounding paragraphs and inline markup', () => {
    const xmlDoc = parseXml(
      letterXml(
        '<div><p xml:id="p_1" style="paragraph_right">Before <hi rend="italic"><span class="marked">Selected</span> tail</hi> after</p></div>',
      ),
    );

    const list = convertMarkedSelectionToList(xmlDoc, 'unordered');
    const children = Array.from(xmlDoc.querySelector('div')!.children);

    expect(children.map((element) => element.localName)).toEqual(['p', 'list', 'p']);
    expect(children.map((element) => element.textContent)).toEqual(['Before ', 'Selected', ' tail after']);
    expect(list.getAttribute('type')).toBe('unordered');
    expect(list.querySelector('item hi')?.getAttribute('rend')).toBe('italic');
    expect(xmlDoc.querySelectorAll('[xml\\:id="p_1"]')).toHaveLength(1);
    expect(xmlDoc.querySelector('span.marked')).toBeNull();
  });

  it('appends an item when the selected source is an existing item', () => {
    const xmlDoc = parseXml(letterXml('<div><list type="ordered"><item>First</item></list></div>'));

    appendListItem(xmlDoc.querySelector('item')!, ' Second ');

    expect(Array.from(xmlDoc.querySelectorAll('item')).map((item) => item.textContent)).toEqual(['First', 'Second']);
  });

  it('updates and removes individual items and the complete list', () => {
    const xmlDoc = parseXml(letterXml('<div><list type="ordered"><item><hi>First</hi></item><item>Second</item></list></div>'));
    const list = xmlDoc.querySelector('list')!;
    const [first, second] = Array.from(xmlDoc.querySelectorAll('item'));

    updateListItem(first, 'Updated');
    expect(first.textContent).toBe('Updated');
    expect(first.querySelector('hi')).toBeNull();

    removeListItem(second);
    expect(xmlDoc.querySelectorAll('item')).toHaveLength(1);

    removeList(list);
    expect(xmlDoc.querySelector('list')).toBeNull();
  });

  it('sorts direct items stably without changing their markup', () => {
    const xmlDoc = parseXml(
      letterXml(
        '<div><list type="ordered"><head>Heading</head><item n="2">Äpfel 10</item><item n="1"><hi>Äpfel 2</hi></item><item>Bananen</item></list></div>',
      ),
    );
    const list = xmlDoc.querySelector('list')!;

    sortListItems(list, 'ascending');
    expect(Array.from(list.querySelectorAll(':scope > item')).map((item) => item.textContent)).toEqual(['Äpfel 2', 'Äpfel 10', 'Bananen']);
    expect(list.firstElementChild?.localName).toBe('head');
    expect(list.querySelector('item hi')?.textContent).toBe('Äpfel 2');

    sortListItems(list, 'descending');
    expect(Array.from(list.querySelectorAll(':scope > item')).map((item) => item.textContent)).toEqual(['Bananen', 'Äpfel 10', 'Äpfel 2']);
  });

  it('rejects list operations outside TEI/text/body', () => {
    const xmlDoc = parseXml('<TEI xmlns="http://www.tei-c.org/ns/1.0"><teiHeader><p>Header</p></teiHeader><text><body/></text></TEI>');
    expect(() => insertEmptyListAfter(xmlDoc.querySelector('p')!, 'ordered')).toThrow(/TEI\/text\/body/);
  });
});
