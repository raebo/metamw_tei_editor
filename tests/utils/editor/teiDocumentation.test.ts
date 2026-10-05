import { openTeiP5Documentation, resolveTeiElementByPath, teiP5DocumentationUrl } from '@src/utils/editor/teiDocumentation';

const parseXml = (content: string): XMLDocument => new DOMParser().parseFromString(content, 'application/xml');

describe('TEI P5 documentation', () => {
  it('creates the official element-reference URL for a namespaced TEI element', () => {
    const xmlDoc = parseXml('<TEI xmlns="http://www.tei-c.org/ns/1.0"><text><body><p>Text</p></body></text></TEI>');

    expect(teiP5DocumentationUrl(xmlDoc.querySelector('p')!)).toBe('https://www.tei-c.org/release/doc/tei-p5-doc/en/html/ref-p.html');
  });

  it('supports legacy TEI documents without a namespace', () => {
    const xmlDoc = parseXml('<TEI><text><body><persName>Anna</persName></body></text></TEI>');

    expect(teiP5DocumentationUrl(xmlDoc.querySelector('persName')!)).toBe(
      'https://www.tei-c.org/release/doc/tei-p5-doc/en/html/ref-persName.html',
    );
  });

  it('rejects elements outside the TEI document namespace', () => {
    const xmlDoc = parseXml('<TEI xmlns="http://www.tei-c.org/ns/1.0" xmlns:custom="urn:custom"><custom:widget/></TEI>');

    const customElement = xmlDoc.getElementsByTagNameNS('urn:custom', 'widget')[0];
    expect(teiP5DocumentationUrl(customElement)).toBeNull();
  });

  it('resolves the selected source element from its rendered XML path', () => {
    const xmlDoc = parseXml('<TEI><text><body><p>Text</p></body></text></TEI>');

    expect(resolveTeiElementByPath(xmlDoc, '0.0.0')?.localName).toBe('p');
    expect(resolveTeiElementByPath(xmlDoc, '0.invalid')).toBeNull();
  });

  it('opens the validated URL in a protected browser context', () => {
    const xmlDoc = parseXml('<TEI><text><body><p>Text</p></body></text></TEI>');
    const openWindow = jest.fn<Window | null, [string | URL | undefined, string?, string?]>(() => null);

    expect(openTeiP5Documentation(xmlDoc.querySelector('p')!, openWindow)).toBe(true);
    expect(openWindow).toHaveBeenCalledWith(
      'https://www.tei-c.org/release/doc/tei-p5-doc/en/html/ref-p.html',
      '_blank',
      'noopener,noreferrer',
    );
  });
});
