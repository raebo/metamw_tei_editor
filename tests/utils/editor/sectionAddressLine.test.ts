import { EditorConstants } from '@src/constants/editor';
import {
  canInsertSectionAddressLine,
  deleteSectionAddressLine,
  insertSectionAddressLine,
  resolveAddressSource,
  updateSectionAddressLine,
} from '@src/utils/editor/sectionAddressLine';

const parse = (body: string) =>
  new DOMParser().parseFromString(
    `<TEI xmlns="${EditorConstants.TEI_NS}"><text><body>${body}</body></text></TEI>`,
    'application/xml',
  );

describe('section address lines', () => {
  it('inserts before the selected section and reuses its address for further lines', () => {
    const doc = parse(
      '<div xml:id="first"><p>First</p></div><div xml:id="second"><p>Second</p></div>',
    );
    const section = resolveAddressSource(doc, 'second');
    const first = insertSectionAddressLine(section);
    const second = insertSectionAddressLine(section);
    expect(first.textContent).toBe('ADRLINE');
    expect(second.textContent).toBe('ADRLINE');
    expect(first.parentElement).toBe(second.parentElement);
    expect(section.previousElementSibling?.getAttribute('type')).toBe('addrline');
    expect(section.previousElementSibling?.previousElementSibling?.getAttribute('xml:id')).toBe(
      'first',
    );
    expect(first.namespaceURI).toBe(EditorConstants.TEI_NS);
    expect(first.getAttribute('xml:id')).not.toBe(second.getAttribute('xml:id'));
    expect(doc.querySelectorAll('address')).toHaveLength(1);
  });

  it('reuses and edits existing addrLine blocks and removes their last line', () => {
    const doc = parse(
      '<div type="addrLine"><p><address><addrLine xml:id="line"/></address></p></div><div xml:id="section"><p>Text</p></div>',
    );
    const existing = resolveAddressSource(doc, 'line');
    updateSectionAddressLine(existing, 'Berlin');
    const inserted = insertSectionAddressLine(resolveAddressSource(doc, 'section'));
    expect(inserted.parentElement).toBe(existing.parentElement);
    deleteSectionAddressLine(inserted);
    expect(existing.textContent).toBe('Berlin');
    deleteSectionAddressLine(existing);
    expect(doc.querySelector('address')).toBeNull();
    expect(doc.querySelector('[type="addrLine"]')).toBeNull();
  });

  it('keeps the level of numbered nested sections', () => {
    const doc = parse('<div1><div2 xml:id="section"><p>Text</p></div2></div1>');
    const section = resolveAddressSource(doc, 'section');
    insertSectionAddressLine(section);
    expect(section.previousElementSibling?.localName).toBe('div2');
    expect(section.textContent).toBe('Text');
  });

  it('preserves other lines and removes address and empty wrappers after the last deletion', () => {
    const doc = parse('<div xml:id="section"><p>Text</p></div>');
    const section = resolveAddressSource(doc, 'section');
    const first = insertSectionAddressLine(section);
    const second = insertSectionAddressLine(section);
    updateSectionAddressLine(second, 'Berlin');
    deleteSectionAddressLine(first);
    expect(doc.querySelector('address')?.textContent).toBe('Berlin');
    deleteSectionAddressLine(second);
    expect(doc.querySelector('address')).toBeNull();
    expect(doc.querySelector('[type="addrline"]')).toBeNull();
    expect(doc.querySelector('body')?.children).toHaveLength(1);
    expect(section.textContent).toBe('Text');
  });

  it('preserves other content in the wrapper when removing an empty address', () => {
    const doc = parse(
      '<div type="addrline"><p><address><addrLine xml:id="line">A</addrLine></address><note>Keep</note></p></div><div><p>Text</p></div>',
    );
    deleteSectionAddressLine(resolveAddressSource(doc, 'line'));
    expect(doc.querySelector('address')).toBeNull();
    expect(doc.querySelector('note')?.textContent).toBe('Keep');
  });

  it('refuses to discard non-line address content', () => {
    const doc = parse(
      '<div type="addrline"><p><address><addrLine xml:id="line">A</addrLine><street>Keep</street></address></p></div>',
    );
    const before = new XMLSerializer().serializeToString(doc);
    expect(() => deleteSectionAddressLine(resolveAddressSource(doc, 'line'))).toThrow();
    expect(new XMLSerializer().serializeToString(doc)).toBe(before);
  });

  it('stores markup-like input as text and preserves IDs and attributes', () => {
    const doc = parse('<div><p>Text</p></div>');
    const line = insertSectionAddressLine(doc.querySelector('div')!);
    const id = line.getAttribute('xml:id');
    line.setAttribute('rend', 'latintype');
    updateSectionAddressLine(line, '<script>alert("x")</script> & Berlin');
    expect(line.children).toHaveLength(0);
    expect(line.getAttribute('xml:id')).toBe(id);
    expect(line.getAttribute('rend')).toBe('latintype');
    const roundtrip = new DOMParser().parseFromString(
      new XMLSerializer().serializeToString(doc),
      'application/xml',
    );
    expect(roundtrip.querySelector('parsererror')).toBeNull();
    expect(roundtrip.querySelector('addrLine')?.textContent).toBe(
      '<script>alert("x")</script> & Berlin',
    );
  });

  it.each(['A\nB', 'A\rB', 'A\u2028B', 'A\u0000B'])(
    'rejects multiline or invalid text without mutation',
    (content) => {
      const doc = parse('<div><p>Text</p></div>');
      const line = insertSectionAddressLine(doc.querySelector('div')!);
      expect(() => updateSectionAddressLine(line, content)).toThrow();
      expect(line.textContent).toBe('ADRLINE');
    },
  );

  it('does not flatten existing inline markup', () => {
    const doc = parse(
      '<div type="addrline"><p><address><addrLine xml:id="line"><hi>Keep</hi></addrLine></address></p></div>',
    );
    expect(() => updateSectionAddressLine(resolveAddressSource(doc, 'line'), 'New')).toThrow();
    expect(doc.querySelector('hi')?.textContent).toBe('Keep');
  });

  it('rejects insertions outside the body and into paragraphs', () => {
    const doc = new DOMParser().parseFromString(
      '<TEI><teiHeader><div/></teiHeader><text><body><div><p>Text</p></div></body></text></TEI>',
      'application/xml',
    );
    expect(canInsertSectionAddressLine(doc.querySelector('teiHeader div')!)).toBe(false);
    expect(() => insertSectionAddressLine(doc.querySelector('p')!)).toThrow();
  });
});
