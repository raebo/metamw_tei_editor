import {
  appendParagraphToSection,
  canInsertSiblingSection,
  childSectionTag,
  convertParagraph,
  insertParagraphAfter,
  insertSection,
  removeSectionHeading,
  resolveSourceElement,
  splitMarkedParagraph,
  updatePlainParagraphText,
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

  it('inserts an empty paragraph that can be filled afterwards', () => {
    const xmlDoc = parseXml(letterXml('<div><p>First</p></div>'));

    const paragraph = insertParagraphAfter(xmlDoc.querySelector('p')!, 'indented', '');

    expect(paragraph.textContent).toBe('');
    expect(xmlDoc.querySelectorAll('p')).toHaveLength(2);
  });

  it('appends a paragraph directly to a writing act before nested sections', () => {
    const xmlDoc = parseXml(letterXml('<div type="act_of_writing"><docAuthor>A</docAuthor><p>First</p><div><p>Nested</p></div></div>'));
    const writingAct = xmlDoc.querySelector('div[type="act_of_writing"]')!;

    const paragraph = appendParagraphToSection(writingAct, 'without-indent', 'Second');

    expect(paragraph.parentElement).toBe(writingAct);
    expect(paragraph.getAttribute('style')).toBe('paragraph_without_indent');
    expect(Array.from(writingAct.children).map((child) => child.localName)).toEqual(['docAuthor', 'p', 'p', 'div']);
    expect(writingAct.querySelectorAll(':scope > div')).toHaveLength(1);
  });

  it('updates only plain paragraph text and rejects paragraphs with embedded markup', () => {
    const xmlDoc = parseXml(letterXml('<div><p xml:id="plain">Old</p><p xml:id="rich">Text <hi rend="italic">marked</hi></p></div>'));

    const plain = updatePlainParagraphText(xmlDoc, '0.0.0.0', 'Copied\r\ntext');

    expect(plain.textContent).toBe('Copied\ntext');
    expect(plain.getAttribute('xml:id')).toBe('plain');
    expect(() => updatePlainParagraphText(xmlDoc, '0.0.0.1', 'Replacement')).toThrow(/embedded markup/);
    expect(xmlDoc.querySelector('[xml\\:id="rich"] hi')?.textContent).toBe('marked');
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

  it('creates a section without a synthetic heading and keeps an empty editable paragraph', () => {
    const xmlDoc = parseXml(letterXml('<div><p>Text</p></div>'));
    const section = xmlDoc.querySelector('div')!;

    const child = insertSection(section, 'child', '', '');

    expect(child.querySelector(':scope > head')).toBeNull();
    expect(child.querySelector(':scope > p')).not.toBeNull();
    expect(child.querySelector(':scope > p')?.textContent).toBe('');
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

  it('removes only the direct section heading', () => {
    const xmlDoc = parseXml(letterXml('<div1><head>Heading</head><p>Text</p><div2><head>Nested</head><p>Nested text</p></div2></div1>'));
    const section = xmlDoc.querySelector('div1')!;

    removeSectionHeading(section);

    expect(section.querySelector(':scope > head')).toBeNull();
    expect(section.querySelector(':scope > p')?.textContent).toBe('Text');
    expect(section.querySelector('div2 > head')?.textContent).toBe('Nested');
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
