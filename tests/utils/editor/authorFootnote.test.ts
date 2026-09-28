import { EditorConstants } from '@src/constants/editor';
import {
  deleteAuthorFootnote,
  insertAuthorFootnote,
  readAuthorFootnote,
  resolveAuthorFootnote,
  updateAuthorFootnote,
} from '@src/utils/editor/authorFootnote';

const parseXml = (content: string): XMLDocument => new DOMParser().parseFromString(content, 'application/xml');

const letter = (content: string): XMLDocument =>
  parseXml(`<TEI xmlns="${EditorConstants.TEI_NS}"><text><body>${content}</body></text></TEI>`);

describe('author footnotes', () => {
  it('creates a mutually linked reference and footnote at the caret', () => {
    const xmlDoc = letter('<div type="act_of_writing"><p>Alpha Beta</p></div>');

    const pair = insertAuthorFootnote(xmlDoc, '0.0.0.0', 'caret:0:5', {
      content: 'Author note',
      marker: '',
    });

    expect(pair.reference.getAttribute('type')).toBe('Footnotes_reference');
    expect(pair.reference.textContent).toBe('1');
    expect(pair.reference.previousSibling?.nodeValue).toBe('Alpha');
    expect(pair.reference.nextSibling?.nodeValue).toBe(' Beta');
    expect(pair.reference.getAttribute('target')).toBe(`#${pair.note.getAttribute('xml:id')}`);
    expect(pair.note.getAttribute('target')).toBe(pair.reference.getAttribute('xml:id'));
    expect(pair.note.getAttribute('type')).toBe('footnote');
    expect(pair.note.getAttribute('subtype')).toBe('author');
    expect(pair.note.getAttribute('n')).toBe('1');
    expect(pair.note.getAttribute('place')).toBe('in the footer of the page');
    expect(pair.note.parentElement?.localName).toBe('div');
    expect(pair.note.parentElement?.getAttribute('type')).toBe('footnotes_area');
  });

  it('numbers numeric references by their position while preserving diplomatic signs', () => {
    const xmlDoc = letter(
      '<div><p>A<ref type="Footnotes_reference" xml:id="fnr_1" target="#fn_1">8</ref>B<ref type="Footnotes_reference" xml:id="fnr_star" target="#fn_star">*</ref>C</p></div><div type="footnotes_area"><note type="footnote" xml:id="fn_1" target="fnr_1" n="8">First</note></div><div type="footnotes_area"><note type="footnote" xml:id="fn_star" target="fnr_star" n="*">Star</note></div>',
    );

    const pair = insertAuthorFootnote(xmlDoc, '0.0.0.0', 'caret:0:1', {
      content: 'Inserted first',
      marker: '',
    });

    expect(pair.note.getAttribute('n')).toBe('1');
    expect(pair.reference.textContent).toBe('1');
    expect(xmlDoc.querySelector('[xml\\:id="fn_1"]')?.getAttribute('n')).toBe('2');
    expect(xmlDoc.querySelector('[xml\\:id="fnr_1"]')?.textContent).toBe('2');
    expect(xmlDoc.querySelector('[xml\\:id="fn_star"]')?.getAttribute('n')).toBe('*');
  });

  it('resolves legacy reverse links and normalizes both targets on update', () => {
    const xmlDoc = letter(
      '<div><p>Text<ref type="Fußnotenreferenz" xml:id="fnr1" target="#fn1">x</ref></p></div><div type="footnotes_area"><note type="footnote" xml:id="fn1" target="#fnr1" n="x"><hi>Legacy</hi> note</note></div>',
    );
    const pair = resolveAuthorFootnote(xmlDoc, 'fnr1');

    expect(readAuthorFootnote(pair)).toEqual({ content: 'Legacy note', marker: 'x' });
    updateAuthorFootnote(pair, { content: 'Legacy note', marker: '*' });

    expect(pair.note.getAttribute('target')).toBe('fnr1');
    expect(pair.reference.getAttribute('type')).toBe('Footnotes_reference');
    expect(pair.reference.getAttribute('target')).toBe('#fn1');
    expect(pair.reference.textContent).toBe('*');
    expect(pair.note.querySelector('hi')).not.toBeNull();
  });

  it('deletes both sides, removes the empty area and renumbers remaining numeric footnotes', () => {
    const xmlDoc = letter(
      '<div><p>A<ref type="Footnotes_reference" xml:id="fnr1" target="#fn1">1</ref>B<ref type="Footnotes_reference" xml:id="fnr2" target="#fn2">2</ref></p></div><div type="footnotes_area"><note type="footnote" xml:id="fn1" target="fnr1" n="1">First</note></div><div type="footnotes_area" xml:id="area2"><note type="footnote" xml:id="fn2" target="fnr2" n="2">Second</note></div>',
    );

    deleteAuthorFootnote(resolveAuthorFootnote(xmlDoc, 'fn1'));

    expect(xmlDoc.querySelector('[xml\\:id="fn1"]')).toBeNull();
    expect(xmlDoc.querySelector('[xml\\:id="fnr1"]')).toBeNull();
    expect(xmlDoc.querySelectorAll('div[type="footnotes_area"]')).toHaveLength(1);
    expect(xmlDoc.querySelector('[xml\\:id="fn2"]')?.getAttribute('n')).toBe('1');
    expect(xmlDoc.querySelector('[xml\\:id="fnr2"]')?.textContent).toBe('1');
  });

  it('rejects empty content, nested positions and defective references', () => {
    const xmlDoc = letter(
      '<div><p>Text</p></div><div type="footnotes_area"><note type="footnote" xml:id="fn1" target="missing" n="1">Broken</note></div>',
    );

    expect(() => insertAuthorFootnote(xmlDoc, '0.0.0.0', 'caret:0:2', { content: ' ', marker: '' })).toThrow('content is required');
    expect(() => resolveAuthorFootnote(xmlDoc, 'fn1')).toThrow('missing or defective');
  });
});
