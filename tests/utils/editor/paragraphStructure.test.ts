import {
  canInsertSiblingSection,
  childSectionTag,
  convertParagraph,
  insertParagraphAfter,
  insertSection,
  resolveSourceElement,
  splitMarkedParagraph,
  updateSectionHeading,
} from '@src/utils/editor/paragraphStructure';

const parseXml = (xml: string): XMLDocument => new DOMParser().parseFromString(xml, 'application/xml');

const letterXml = (body: string) => `<TEI xmlns="http://www.tei-c.org/ns/1.0"><text><body>${body}</body></text></TEI>`;

describe('paragraphStructure', () => {
  it('inserts all paragraph variants after the selected paragraph', () => {
    const xmlDoc = parseXml(letterXml('<div><p>First</p></div>'));
    const firstParagraph = xmlDoc.querySelector('p')!;

    insertParagraphAfter(firstParagraph, 'without-indent', 'Second');
    insertParagraphAfter(firstParagraph, 'hanging', 'Third');
    insertParagraphAfter(firstParagraph, 'centered', 'Fourth');
    insertParagraphAfter(firstParagraph, 'right', 'Fifth');
    insertParagraphAfter(firstParagraph, 'without-indent-indented', 'Sixth');
    insertParagraphAfter(firstParagraph, 'indented', 'Seventh');

    const paragraphs = Array.from(xmlDoc.querySelectorAll('p'));
    expect(paragraphs.map((paragraph) => paragraph.getAttribute('style'))).toEqual([
      null,
      null,
      'paragraph_without_indent_indented',
      'paragraph_right',
      'paragraph centered',
      'paragraph_hanging',
      'paragraph_without_indent',
    ]);
  });

  it('converts an existing paragraph without changing its content or other attributes', () => {
    const xmlDoc = parseXml(letterXml('<div><p xml:id="p_1" n="2" style="paragraph_hanging">Text <hi rend="bold">bold</hi></p></div>'));
    const paragraph = xmlDoc.querySelector('p')!;

    convertParagraph(paragraph, 'centered');

    expect(paragraph.getAttribute('style')).toBe('paragraph centered');
    expect(paragraph.getAttribute('xml:id')).toBe('p_1');
    expect(paragraph.getAttribute('n')).toBe('2');
    expect(paragraph.querySelector('hi')?.textContent).toBe('bold');
  });

  it('splits a paragraph around the marked selection and keeps inline markup and a unique id', () => {
    const xmlDoc = parseXml(
      letterXml(
        '<div><p xml:id="p_1" style="paragraph_without_indent">Before <hi rend="italic"><span class="marked">selected</span> after</hi> end</p></div>',
      ),
    );

    const selected = splitMarkedParagraph(xmlDoc, 'right');
    const paragraphs = Array.from(xmlDoc.querySelectorAll('p'));

    expect(paragraphs).toHaveLength(3);
    expect(paragraphs.map((paragraph) => paragraph.textContent)).toEqual(['Before ', 'selected', ' after end']);
    expect(selected.getAttribute('style')).toBe('paragraph_right');
    expect(selected.querySelector('hi')?.getAttribute('rend')).toBe('italic');
    expect(xmlDoc.querySelectorAll('[xml\\:id="p_1"]')).toHaveLength(1);
    expect(xmlDoc.querySelector('span.marked')).toBeNull();
  });

  it('creates the next allowed numbered section and a sibling with head and paragraph', () => {
    const xmlDoc = parseXml(letterXml('<div1><head>One</head><p>Text</p></div1>'));
    const div1 = xmlDoc.querySelector('div1')!;

    expect(childSectionTag(div1)).toBe('div2');
    const child = insertSection(div1, 'child', 'Child', 'Child text');
    const sibling = insertSection(div1, 'sibling', 'Sibling', 'Sibling text');

    expect(child.localName).toBe('div2');
    expect(child.firstElementChild?.localName).toBe('head');
    expect(sibling.localName).toBe('div1');
    expect(div1.nextElementSibling).toBe(sibling);
  });

  it('rejects an invalid section level and edits an existing section heading', () => {
    const xmlDoc = parseXml(letterXml('<div7><head>Old</head><p>Text</p></div7>'));
    const div7 = xmlDoc.querySelector('div7')!;

    expect(childSectionTag(div7)).toBeNull();
    expect(() => insertSection(div7, 'child', 'Too deep', 'Text')).toThrow(/div7/);
    expect(canInsertSiblingSection(div7)).toBe(true);
    updateSectionHeading(div7, 'New');
    expect(div7.querySelector('head')?.textContent).toBe('New');
  });

  it('resolves rendered source paths from the TEI document element', () => {
    const xmlDoc = parseXml(letterXml('<div><p>Text</p></div>'));
    expect(resolveSourceElement(xmlDoc, '0.0.0.0').localName).toBe('p');
    expect(() => resolveSourceElement(xmlDoc, '0.invalid')).toThrow(/invalid/);
  });

  it('rejects paragraph operations outside TEI/text/body', () => {
    const xmlDoc = parseXml('<TEI xmlns="http://www.tei-c.org/ns/1.0"><teiHeader><p>Header</p></teiHeader><text><body/></text></TEI>');
    expect(() => convertParagraph(xmlDoc.querySelector('p')!, 'right')).toThrow(/TEI\/text\/body/);
  });
});
