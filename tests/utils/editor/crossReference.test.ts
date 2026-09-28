import {
  deleteCrossReference,
  insertCrossReference,
  normalizeCrossReferenceTarget,
  resolveCrossReference,
  updateCrossReference,
} from '@src/utils/editor/crossReference';

const parse = (body: string): XMLDocument =>
  new DOMParser().parseFromString(`<TEI><text><body><div><p>${body}</p></div></body></text></TEI>`, 'application/xml');

describe('cross references', () => {
  it('normalizes multiple internal IDs and rejects malformed targets', () => {
    expect(normalizeCrossReferenceTarget('register', 'one #two 003')).toBe('#one #two #003');
    expect(() => normalizeCrossReferenceTarget('register', '#one javascript:alert(1)')).toThrow();
  });

  it('allows HTTP(S) external URLs without embedded credentials', () => {
    expect(normalizeCrossReferenceTarget('external-url', 'https://example.test/path?q=1')).toBe('https://example.test/path?q=1');
    expect(() => normalizeCrossReferenceTarget('external-url', 'javascript:alert(1)')).toThrow();
    expect(() => normalizeCrossReferenceTarget('external-url', 'https://user:secret@example.test')).toThrow();
  });

  it('accepts relative internal URLs and rejects schemes and protocol-relative URLs', () => {
    expect(normalizeCrossReferenceTarget('internal-url', '../resources/file.xml#entry')).toBe('../resources/file.xml#entry');
    expect(() => normalizeCrossReferenceTarget('internal-url', 'https://example.test')).toThrow();
    expect(() => normalizeCrossReferenceTarget('internal-url', '//example.test/file')).toThrow();
  });

  it('inserts an empty register link at an exact caret', () => {
    const xmlDoc = parse('Alpha Beta');
    const link = insertCrossReference(xmlDoc, '0.0.0.0', 'caret:0:5', {
      kind: 'register',
      target: 'one #two',
    });

    expect(xmlDoc.querySelector('p')?.childNodes[0].nodeValue).toBe('Alpha');
    expect(link.localName).toBe('link');
    expect(link.getAttribute('target')).toBe('#one #two');
    expect(link.getAttribute('xml:id')).toMatch(/^link_/);
    expect(xmlDoc.querySelector('p')?.textContent).toBe('Alpha Beta');
  });

  it('wraps marked text in an external ref and preserves its content', () => {
    const xmlDoc = parse('Before <span class="marked">selected</span> after');
    const ref = insertCrossReference(xmlDoc, '', 'selection', {
      kind: 'external-url',
      target: 'https://example.test',
    });

    expect(ref.localName).toBe('ref');
    expect(ref.textContent).toBe('selected');
    expect(ref.getAttribute('target')).toBe('https://example.test');
    expect(xmlDoc.querySelector('span.marked')).toBeNull();
  });

  it('inserts a generated target anchor after a marked selection', () => {
    const xmlDoc = parse('Before <span class="marked">selected</span> after');
    const anchor = insertCrossReference(xmlDoc, '', 'selection', {
      kind: 'generic-target',
      target: '',
    });

    expect(anchor.localName).toBe('anchor');
    expect(anchor.getAttribute('type')).toBe('cross-reference');
    expect(anchor.getAttribute('xml:id')).toMatch(/^anchor_/);
    expect(xmlDoc.querySelector('span.marked')).toBeNull();
  });

  it('resolves, updates and deletes references while preserving wrapped text', () => {
    const xmlDoc = parse('<ref xml:id="ref_1" target="https://old.test">selected</ref>');
    const ref = resolveCrossReference(xmlDoc, 'ref_1');
    updateCrossReference(ref, 'https://new.test/path');
    expect(ref.getAttribute('target')).toBe('https://new.test/path');

    deleteCrossReference(ref);
    expect(xmlDoc.querySelector('ref')).toBeNull();
    expect(xmlDoc.querySelector('p')?.textContent).toBe('selected');
  });
});
