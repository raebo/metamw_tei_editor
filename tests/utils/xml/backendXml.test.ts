import {
  assertWellFormedXml,
  ensureXmlDeclaration,
  prepareEditorXmlForBackend,
} from '@src/utils/xml/backendXml';

describe('backend XML preparation', () => {
  it('rejects malformed and empty XML', () => {
    expect(() => assertWellFormedXml('')).toThrow('XML content is empty.');
    expect(() => assertWellFormedXml('<TEI><text></TEI>')).toThrow(
      'XML content is not well-formed.',
    );
  });

  it('normalizes editor DOM artifacts and returns well-formed XML', () => {
    const preparedXml = prepareEditorXmlForBackend(
      '<TEI xmlns:tmp="urn:tmp"><text><persname data-key="p1" tmp:id="temporary">Anna</persname><placename tmp_id="temporary">Berlin</placename></text></TEI>',
    );

    expect(preparedXml).toContain('<persName key="p1">Anna</persName>');
    expect(preparedXml).toContain('<placeName>Berlin</placeName>');
    expect(preparedXml).not.toContain('tmp:id');
    expect(preparedXml).not.toContain('tmp_id');
    expect(preparedXml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(() => assertWellFormedXml(preparedXml)).not.toThrow();
  });

  it('keeps an existing declaration and adds one when it is missing', () => {
    const declared = '<?xml version="1.0" encoding="UTF-8"?><TEI />';

    expect(ensureXmlDeclaration(declared)).toBe(declared);
    expect(ensureXmlDeclaration('<TEI />')).toBe('<?xml version="1.0" encoding="UTF-8"?> <TEI />');
  });
});
