import {
  applyInlineFormatting,
  InlineFormattingError,
  removeInlineFormatting,
  resolveInlineFormatting,
} from '@src/utils/editor/inlineFormatting';

const parse = (content: string): XMLDocument => new DOMParser().parseFromString(`<TEI><text>${content}</text></TEI>`, 'application/xml');

describe('inline formatting', () => {
  it('wraps every selected child in an Oxygen-compatible superscript while preserving nested markup', () => {
    const xmlDoc = parse('<body><p>Saint <span class="marked">1<hi rend="italic">st</hi></span> letter</p></body>');

    const superscript = applyInlineFormatting(xmlDoc, 'superscript');

    expect(superscript.localName).toBe('hi');
    expect(superscript.namespaceURI).toBe('http://www.tei-c.org/ns/1.0');
    expect(superscript.getAttribute('rend')).toBe('superscript');
    expect(superscript.textContent).toBe('1st');
    expect(superscript.querySelector('hi[rend="italic"]')?.textContent).toBe('st');
    expect(xmlDoc.querySelector('span.marked')).toBeNull();
    expect(xmlDoc.querySelector('p')?.textContent).toBe('Saint 1st letter');
  });

  it.each([
    ['a missing selection', '<body><p>Text</p></body>', 'selectionMissing'],
    ['a selection outside the body', '<teiHeader><span class="marked">Text</span></teiHeader>', 'selectionInvalid'],
    ['a nested superscript selection', '<body><p><hi rend="superscript"><span class="marked">1</span></hi></p></body>', 'selectionNested'],
  ] as const)('rejects %s', (_label, content, code) => {
    const xmlDoc = parse(content);

    expect(() => applyInlineFormatting(xmlDoc, 'superscript')).toThrow(new InlineFormattingError(code));
  });

  it('resolves a legacy superscript by XML path and removes only its wrapper', () => {
    const xmlDoc = parse('<body><p>Saint <hi rend="superscript">1<hi rend="italic">st</hi></hi> letter</p></body>');
    const superscript = resolveInlineFormatting(xmlDoc, 'path:0.0.0.1', 'superscript');

    removeInlineFormatting(superscript, 'superscript');

    expect(xmlDoc.querySelector('hi[rend="superscript"]')).toBeNull();
    expect(xmlDoc.querySelector('hi[rend="italic"]')?.textContent).toBe('st');
    expect(xmlDoc.querySelector('p')?.textContent).toBe('Saint 1st letter');
  });

  it('resolves an identified superscript and rejects other inline formats', () => {
    const xmlDoc = parse('<body><p><hi xml:id="super_1" rend="superscript">1</hi><hi xml:id="italic_1" rend="italic">x</hi></p></body>');

    expect(resolveInlineFormatting(xmlDoc, 'super_1', 'superscript').textContent).toBe('1');
    expect(() => resolveInlineFormatting(xmlDoc, 'italic_1', 'superscript')).toThrow(new InlineFormattingError('elementMissing'));
  });
});
