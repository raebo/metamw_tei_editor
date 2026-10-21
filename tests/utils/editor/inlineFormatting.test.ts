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

  it('wraps the selection in an Oxygen-compatible subscript without changing an adjacent superscript', () => {
    const xmlDoc = parse('<body><p>H<span class="marked">2<hi rend="italic">O</hi></span><hi rend="superscript">+</hi></p></body>');

    const subscript = applyInlineFormatting(xmlDoc, 'subscript');

    expect(subscript.getAttribute('rend')).toBe('subscript');
    expect(subscript.textContent).toBe('2O');
    expect(subscript.querySelector('hi[rend="italic"]')?.textContent).toBe('O');
    expect(xmlDoc.querySelector('hi[rend="superscript"]')?.textContent).toBe('+');
    expect(xmlDoc.querySelector('p')?.textContent).toBe('H2O+');
  });

  it('creates the FMB-C groundline markup without changing a regular underline', () => {
    const xmlDoc = parse(
      '<body><p><hi rend="underline">regular</hi> <span class="marked">ground<hi rend="italic">line</hi></span></p></body>',
    );

    const groundline = applyInlineFormatting(xmlDoc, 'groundline');

    expect(groundline.getAttribute('rend')).toBe('groundline');
    expect(groundline.textContent).toBe('groundline');
    expect(groundline.querySelector('hi[rend="italic"]')?.textContent).toBe('line');
    expect(xmlDoc.querySelector('hi[rend="underline"]')?.textContent).toBe('regular');
    expect(xmlDoc.querySelector('p')?.textContent).toBe('regular groundline');
  });

  it('creates local FMB-C latintype markup without adding a document-wide classification', () => {
    const xmlDoc = parse('<body><p><span class="marked">Amicus <hi rend="italic">certus</hi></span></p></body>');

    const latintype = applyInlineFormatting(xmlDoc, 'latintype');

    expect(latintype.getAttribute('rend')).toBe('latintype');
    expect(latintype.textContent).toBe('Amicus certus');
    expect(latintype.querySelector('hi[rend="italic"]')?.textContent).toBe('certus');
    expect(xmlDoc.documentElement.hasAttribute('rend')).toBe(false);
    expect(xmlDoc.querySelector('text')?.hasAttribute('rend')).toBe(false);
    expect(xmlDoc.querySelector('body')?.hasAttribute('rend')).toBe(false);
  });

  it.each([
    ['a missing selection', '<body><p>Text</p></body>', 'selectionMissing'],
    ['a selection outside the body', '<teiHeader><span class="marked">Text</span></teiHeader>', 'selectionInvalid'],
    ['a nested superscript selection', '<body><p><hi rend="superscript"><span class="marked">1</span></hi></p></body>', 'selectionNested'],
  ] as const)('rejects %s', (_label, content, code) => {
    const xmlDoc = parse(content);

    expect(() => applyInlineFormatting(xmlDoc, 'superscript')).toThrow(new InlineFormattingError(code));
  });

  it('rejects a selection nested in an existing subscript', () => {
    const xmlDoc = parse('<body><p><hi rend="subscript"><span class="marked">2</span></hi></p></body>');

    expect(() => applyInlineFormatting(xmlDoc, 'subscript')).toThrow(new InlineFormattingError('selectionNested'));
  });

  it('rejects a selection nested in an existing groundline underline', () => {
    const xmlDoc = parse('<body><p><hi rend="groundline"><span class="marked">Text</span></hi></p></body>');

    expect(() => applyInlineFormatting(xmlDoc, 'groundline')).toThrow(new InlineFormattingError('selectionNested'));
  });

  it('rejects a selection nested in an existing latintype passage', () => {
    const xmlDoc = parse('<body><p><hi rend="latintype"><span class="marked">Amicus</span></hi></p></body>');

    expect(() => applyInlineFormatting(xmlDoc, 'latintype')).toThrow(new InlineFormattingError('selectionNested'));
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

  it('resolves and removes only the requested subscript wrapper', () => {
    const xmlDoc = parse('<body><p>H<hi xml:id="sub_1" rend="subscript">2</hi><hi xml:id="super_1" rend="superscript">+</hi></p></body>');
    const subscript = resolveInlineFormatting(xmlDoc, 'sub_1', 'subscript');

    removeInlineFormatting(subscript, 'subscript');

    expect(xmlDoc.querySelector('hi[rend="subscript"]')).toBeNull();
    expect(xmlDoc.querySelector('hi[rend="superscript"]')?.textContent).toBe('+');
    expect(xmlDoc.querySelector('p')?.textContent).toBe('H2+');
    expect(() => resolveInlineFormatting(xmlDoc, 'super_1', 'subscript')).toThrow(new InlineFormattingError('elementMissing'));
  });

  it('removes only the groundline wrapper and preserves a regular underline', () => {
    const xmlDoc = parse(
      '<body><p><hi xml:id="under_1" rend="underline">regular</hi><hi xml:id="ground_1" rend="groundline">ground</hi></p></body>',
    );
    const groundline = resolveInlineFormatting(xmlDoc, 'ground_1', 'groundline');

    removeInlineFormatting(groundline, 'groundline');

    expect(xmlDoc.querySelector('hi[rend="groundline"]')).toBeNull();
    expect(xmlDoc.querySelector('hi[rend="underline"]')?.textContent).toBe('regular');
    expect(xmlDoc.querySelector('p')?.textContent).toBe('regularground');
    expect(() => resolveInlineFormatting(xmlDoc, 'under_1', 'groundline')).toThrow(new InlineFormattingError('elementMissing'));
  });

  it('removes only the local latintype wrapper', () => {
    const xmlDoc = parse(
      '<body><p><hi xml:id="latin_1" rend="latintype">Amicus</hi><hi xml:id="italic_1" rend="italic">certus</hi></p></body>',
    );
    const latintype = resolveInlineFormatting(xmlDoc, 'latin_1', 'latintype');

    removeInlineFormatting(latintype, 'latintype');

    expect(xmlDoc.querySelector('hi[rend="latintype"]')).toBeNull();
    expect(xmlDoc.querySelector('hi[rend="italic"]')?.textContent).toBe('certus');
    expect(xmlDoc.querySelector('p')?.textContent).toBe('Amicuscertus');
  });
});
