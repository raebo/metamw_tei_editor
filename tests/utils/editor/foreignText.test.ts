import {
  deleteForeignText,
  insertForeignText,
  normalizeForeignTextLanguage,
  resolveForeignText,
  updateForeignText,
} from '@src/utils/editor/foreignText';

const parse = (body: string): XMLDocument =>
  new DOMParser().parseFromString(`<TEI><text><body><div><p>${body}</p></div></body></text></TEI>`, 'application/xml');

describe('foreign-language text', () => {
  it('canonicalizes valid IANA language tags and rejects invalid values', () => {
    expect(normalizeForeignTextLanguage('de_ch')).toBe('de-CH');
    expect(normalizeForeignTextLanguage(' grc ')).toBe('grc');
    expect(() => normalizeForeignTextLanguage('not a language')).toThrow();
    expect(() => normalizeForeignTextLanguage('')).toThrow();
  });

  it('wraps the marked text without changing its content', () => {
    const xmlDoc = parse('Before <span class="marked">bonjour</span> after');
    const foreign = insertForeignText(xmlDoc, 'fr');

    expect(foreign.getAttribute('xml:id')).toMatch(/^foreign_/);
    expect(foreign.getAttribute('xml:lang')).toBe('fr');
    expect(foreign.textContent).toBe('bonjour');
    expect(xmlDoc.querySelector('span.marked')).toBeNull();
    expect(xmlDoc.querySelector('p')?.textContent).toBe('Before bonjour after');
  });

  it('rejects nested foreign-language markup', () => {
    const xmlDoc = parse('<foreign xml:lang="fr"><span class="marked">bonjour</span></foreign>');
    expect(() => insertForeignText(xmlDoc, 'it')).toThrow();
  });

  it('resolves legacy markup by path, updates it and adds a stable ID', () => {
    const xmlDoc = parse('<foreign xml:lang="fr">bonjour</foreign>');
    const foreign = resolveForeignText(xmlDoc, 'path:0.0.0.0.0');

    updateForeignText(foreign, 'it');

    expect(foreign.getAttribute('xml:lang')).toBe('it');
    expect(foreign.getAttribute('xml:id')).toMatch(/^foreign_/);
  });

  it('removes only the markup and preserves the text', () => {
    const xmlDoc = parse('<foreign xml:id="foreign_1" xml:lang="fr">bonjour</foreign>');
    deleteForeignText(resolveForeignText(xmlDoc, 'foreign_1'));

    expect(xmlDoc.querySelector('foreign')).toBeNull();
    expect(xmlDoc.querySelector('p')?.textContent).toBe('bonjour');
  });
});
