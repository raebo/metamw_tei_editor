import { findFigureAnchor } from '@src/utils/editor/figureAnchor';

const parseXml = (xml: string): XMLDocument => new DOMParser().parseFromString(xml, 'application/xml');

describe('findFigureAnchor', () => {
  it('returns the nearest uniquely identified element inside TEI/text/body', () => {
    const renderedRoot = document.createElement('div');
    renderedRoot.innerHTML = '<body><div xml:id="outer"><p xml:id="paragraph_1"><span>Text</span></p></div></body>';
    const target = renderedRoot.querySelector('span')!;
    const xmlDocument = parseXml('<TEI><text><body><div xml:id="outer"><p xml:id="paragraph_1">Text</p></div></body></text></TEI>');

    expect(findFigureAnchor(target, renderedRoot, xmlDocument)?.xmlId).toBe('paragraph_1');
  });

  it('rejects duplicate ids and elements outside TEI/text/body', () => {
    const renderedRoot = document.createElement('div');
    renderedRoot.innerHTML = '<div xml:id="header_1">Header</div><p xml:id="duplicate"><span>Text</span></p>';
    const duplicateTarget = renderedRoot.querySelector('span')!;
    const headerTarget = renderedRoot.firstElementChild!;
    const xmlDocument = parseXml(
      '<TEI><teiHeader><p xml:id="header_1">Header</p></teiHeader><text><body><p xml:id="duplicate">One</p><p xml:id="duplicate">Two</p></body></text></TEI>',
    );

    expect(findFigureAnchor(duplicateTarget, renderedRoot, xmlDocument)).toBeNull();
    expect(findFigureAnchor(headerTarget, renderedRoot, xmlDocument)).toBeNull();
  });
});
