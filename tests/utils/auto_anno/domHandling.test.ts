import {
  autoAnnoReplaceDomNodeContent,
  initializeLetterXmlExportSource,
  markSpanAndScrollToId,
  referenceTypeForXmlId,
  removeSnippetEntityFromDom,
  serializeLetterXmlForExport,
} from '@src/utils/auto_anno/domHandling';

describe('domHandling xml:id lookups', () => {
  beforeAll(() => {
    // jsdom does not implement scrollIntoView.
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('findet ein Element, dessen xml:id ein Anfuehrungszeichen enthaelt, ohne zu werfen', () => {
    document.body.innerHTML = "<persname xml:id='foo\"bar'>Max</persname>";

    // Previously this built the selector via raw string concatenation, so a `"` in the id broke
    // the attribute selector and made querySelector throw a DOMException instead of matching.
    expect(() => markSpanAndScrollToId('foo"bar')).not.toThrow();
    expect(document.querySelector('span.marked')).not.toBeNull();
  });

  it('referenceTypeForXmlId findet das Element trotz Sonderzeichen in der xml:id', () => {
    document.body.innerHTML = "<persname xml:id='a\"b'>Max</persname>";

    expect(referenceTypeForXmlId('a"b')).toBe('Person');
  });

  it('removeSnippetEntityFromDom findet das Element trotz Sonderzeichen in der xml:id', () => {
    document.body.innerHTML = "<persname xml:id='a\"b'>Max Mustermann</persname>";

    expect(() => removeSnippetEntityFromDom('a"b')).not.toThrow();
    expect(document.body.textContent).toBe('Max Mustermann');
  });

  it('wirft weiterhin einen klaren Fehler, wenn kein Element mit dieser xml:id existiert', () => {
    expect(() => referenceTypeForXmlId('does-not-exist')).toThrow(
      'No DOM element found with xml:id="does-not-exist".',
    );
  });

  it('serialisiert die XML-Arbeitskopie ohne die Schreibweise unbekannter TEI-Namen zu verlieren', () => {
    const sourceXml =
      '<TEI xmlns="http://www.tei-c.org/ns/1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:test schema.xsd"><text><body><customElement customAttribute="kept"><persName xml:id="person-1">Anna</persName></customElement></body></text></TEI>';
    document.body.innerHTML =
      '<div id="letterXml"><div><tei><text><body><customelement customattribute="kept"><persname xml:id="person-1">Anna</persname></customelement></body></text></tei></div></div>';
    const letterRoot = document.getElementById('letterXml')!;

    initializeLetterXmlExportSource(letterRoot, sourceXml);
    autoAnnoReplaceDomNodeContent('person-1', 'Person', {
      entityId: 1,
      entityType: 'Person',
      entityKey: 'person-key',
      entityName: 'Anna Example',
      entityDisplayName: 'Anna Example',
      extraData: {},
    });

    const exportedXml = serializeLetterXmlForExport(letterRoot);
    const exportedDocument = new DOMParser().parseFromString(exportedXml, 'application/xml');

    expect(exportedDocument.querySelector('parsererror')).toBeNull();
    expect(exportedXml).toContain('<customElement customAttribute="kept">');
    expect(exportedXml).toContain('<persName xml:id="person-1">');
    expect(exportedXml).toContain('xsi:schemaLocation="urn:test schema.xsd"');
    expect(exportedXml).toContain('<name key="person-key">Anna Example</name>');
    expect(exportedXml).not.toContain('<div>');
  });

  it('weist ungueltiges XML beim Initialisieren der Exportquelle zurueck', () => {
    document.body.innerHTML = '<div id="letterXml"></div>';
    const letterRoot = document.getElementById('letterXml')!;

    expect(() => initializeLetterXmlExportSource(letterRoot, '<TEI><text></TEI>')).toThrow(
      'Cannot initialize letter export from invalid XML.',
    );
  });
});
