import {
  deleteAbbreviation,
  insertAbbreviation,
  readAbbreviationExpansion,
  resolveAbbreviation,
  updateAbbreviation,
} from '@src/utils/editor/abbreviation';

const parse = (body: string): XMLDocument =>
  new DOMParser().parseFromString(`<TEI><text><body><div><p>${body}</p></div></body></text></TEI>`, 'application/xml');

describe('abbreviations', () => {
  it('stores the marked abbreviation and escaped expansion in the Oxygen structure', () => {
    const xmlDoc = parse('Before <span class="marked">S<hi rend="superscript">t</hi></span> after');
    const choice = insertAbbreviation(xmlDoc, 'Saint & Straße');

    expect(choice.getAttribute('xml:id')).toMatch(/^choice_/);
    expect(choice.querySelector('abbr')?.textContent).toBe('St');
    expect(choice.querySelector('abbr hi')?.getAttribute('rend')).toBe('superscript');
    expect(choice.querySelector('expan')?.getAttribute('style')).toBe('hidden');
    expect(choice.querySelector('expan')?.textContent).toBe('"Saint & Straße"');
    expect(xmlDoc.querySelector('span.marked')).toBeNull();
  });

  it('rejects empty expansions and nested abbreviation selections', () => {
    expect(() => insertAbbreviation(parse('<span class="marked">St</span>'), '  ')).toThrow();
    expect(() =>
      insertAbbreviation(
        parse('<choice><abbr><span class="marked">St</span></abbr><expan style="hidden">"Saint"</expan></choice>'),
        'Street',
      ),
    ).toThrow();
    expect(() =>
      insertAbbreviation(
        parse('<span class="marked"><choice><abbr>St</abbr><expan style="hidden">"Saint"</expan></choice></span>'),
        'Street',
      ),
    ).toThrow();
  });

  it('resolves legacy markup by path, reads and updates its expansion and adds a stable ID', () => {
    const xmlDoc = parse('<choice><abbr>Ch</abbr><expan style="hidden">"Church"</expan></choice>');
    const choice = resolveAbbreviation(xmlDoc, 'path:0.0.0.0.0');

    expect(readAbbreviationExpansion(choice)).toBe('Church');
    updateAbbreviation(choice, 'Chapel');

    expect(choice.getAttribute('xml:id')).toMatch(/^choice_/);
    expect(choice.querySelector('expan')?.textContent).toBe('"Chapel"');
  });

  it('removes choice, abbr and the hidden expansion while preserving inline abbreviation content', () => {
    const xmlDoc = parse(
      '<choice xml:id="choice_1"><abbr>S<hi rend="superscript">t</hi></abbr><expan style="hidden">"Saint"</expan></choice>',
    );
    deleteAbbreviation(resolveAbbreviation(xmlDoc, 'choice_1'));

    expect(xmlDoc.querySelector('choice')).toBeNull();
    expect(xmlDoc.querySelector('p')?.textContent).toBe('St');
    expect(xmlDoc.querySelector('p > hi')?.getAttribute('rend')).toBe('superscript');
  });
});
