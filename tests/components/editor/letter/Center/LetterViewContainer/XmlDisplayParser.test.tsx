import React from 'react';
import { render } from '@testing-library/react';
import XMLDisplayParser from '@src/components/editor/letter/Center/LetterViewContainer/XmlDisplayParser';
import { textMarking } from '@src/utils/editor/textMarking';

const renderXml = (xmlString: string) =>
  render(<XMLDisplayParser xmlContentRef={null} xmlString={xmlString} />);

describe('XMLDisplayParser', () => {
  it('renders nested TEI elements and their text content', () => {
    const { container } = render(
      <XMLDisplayParser
        xmlContentRef={null}
        xmlString='<div>Hello <hi rend="italic">world</hi></div>'
      />,
    );

    const hi = container.querySelector('hi');
    expect(hi).toHaveTextContent('world');
    expect(hi).toHaveAttribute('rend', 'italic');
    expect(container).toHaveTextContent('Hello world');
  });

  it('preserves the "marked" class needed for the right-click annotation handler', () => {
    const { container } = renderXml('<div><span class="marked">selected text</span></div>');

    const marked = container.querySelector('span.marked');
    expect(marked).toHaveTextContent('selected text');
  });

  it('preserves known TEI attributes (type, xml:id, xml:lang, data-key, n, subtype, resp)', () => {
    const { container } = renderXml(
      '<div type="act_of_writing" n="1" xml:id="d1"><persName data-key="p1" xml:lang="de">Anna</persName></div>',
    );

    const div = container.querySelector('div[type="act_of_writing"]');
    expect(div).toHaveAttribute('n', '1');
    expect(div).toHaveAttribute('xml:id', 'd1');

    const persName = container.querySelector('persname');
    expect(persName).toHaveAttribute('data-key', 'p1');
    expect(persName).toHaveAttribute('xml:lang', 'de');
  });

  it('maps a selection back to the complete source XML without serializing the filtered preview', () => {
    const sourceXml = `<?xml version="1.0" encoding="UTF-8"?>
      <TEI xmlns="http://www.tei-c.org/ns/1.0"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:schemaLocation="http://www.tei-c.org/ns/1.0 schema.xsd"
           xml:id="letter-1" xml:space="default">
        <teiHeader><fileDesc><publicationStmt><licence target="https://example.test/licence">CC</licence></publicationStmt></fileDesc></teiHeader>
        <text><body><div type="act_of_writing"><docAuthor style="hidden">Editor metadata</docAuthor><p><date cert="medium" notAfter="1821-01-31" notBefore="1821-01-25">Ende Januar</date> Domino anbieten.</p></div></body></text>
      </TEI>`;
    const { container } = renderXml(sourceXml);
    const paragraph = container.querySelector('p');
    const textNode = Array.from(paragraph?.childNodes ?? []).find(
      (node) => node.nodeType === Node.TEXT_NODE && node.nodeValue?.includes('Domino'),
    );
    expect(textNode).toBeDefined();

    const range = document.createRange();
    const start = textNode?.nodeValue?.indexOf('Domino') ?? -1;
    range.setStart(textNode!, start);
    range.setEnd(textNode!, start + 'Domino'.length);

    const markedDocument = textMarking.createMarkedXmlDocument(
      sourceXml,
      container as HTMLElement,
      range,
    );
    const serialized = new XMLSerializer().serializeToString(markedDocument);

    expect(markedDocument.documentElement.tagName).toBe('TEI');
    expect(markedDocument.documentElement.namespaceURI).toBe('http://www.tei-c.org/ns/1.0');
    expect(markedDocument.documentElement.getAttribute('xmlns:xsi')).toBe(
      'http://www.w3.org/2001/XMLSchema-instance',
    );
    expect(markedDocument.documentElement.getAttribute('xsi:schemaLocation')).toBe(
      'http://www.tei-c.org/ns/1.0 schema.xsd',
    );
    expect(markedDocument.documentElement.getAttribute('xml:space')).toBe('default');
    expect(markedDocument.querySelector('licence')?.getAttribute('target')).toBe(
      'https://example.test/licence',
    );
    expect(markedDocument.querySelector('date')?.getAttribute('cert')).toBe('medium');
    expect(markedDocument.querySelector('date')?.getAttribute('notAfter')).toBe('1821-01-31');
    expect(markedDocument.querySelector('docAuthor')?.getAttribute('style')).toBe('hidden');
    expect(serialized).toContain('<span class="marked">Domino</span>');
  });

  // A literal object property named "key" is always intercepted by React as the reconciliation
  // key (regardless of merge order), so the XML "key" attribute can never be rendered as a real
  // DOM attribute through this JSX-based renderer - this is a pre-existing limitation, not a
  // regression from the XSS fix. `data-key` (also used by markupGeneration.ts) is unaffected
  // and covered above.
  it('does not (and structurally cannot) render the XML "key" attribute as a DOM attribute', () => {
    const { container } = renderXml('<div><persName key="p1">Anna</persName></div>');

    const persName = container.querySelector('persname');
    expect(persName?.getAttribute('key')).toBeNull();
    expect(persName).toHaveTextContent('Anna');
  });

  it('applies safe inline style declarations', () => {
    const { container } = renderXml('<div><hi style="color: red;">note</hi></div>');

    const hi = container.querySelector('hi');
    expect(hi).toHaveStyle({ color: 'red' });
  });

  // Regression: the previous implementation spread *every* XML attribute onto the resulting
  // host element (`<TagName {...attributes}>`). Since document.createElement lowercases tag
  // names and React passes unrecognised lowercase attribute names straight through via
  // setAttribute, an attribute literally named "onerror"/"onload" on any element was enough to
  // get the browser to execute it - no dangerouslySetInnerHTML required.
  it('drops an <img onerror=...> element entirely instead of rendering it', () => {
    const { container } = renderXml(
      '<div><img src="x" onerror="window.__pwned = true" />Anna</div>',
    );

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('Anna');
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
  });

  it('drops an <svg onload=...> element entirely instead of rendering it', () => {
    const { container } = renderXml(
      '<div><svg onload="window.__pwned = true"><circle/></svg>Anna</div>',
    );

    expect(container.querySelector('svg')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('Anna');
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
  });

  it('drops <script> tags including their content entirely', () => {
    const { container } = renderXml(
      '<div>before<script>window.__pwned = true;</script>after</div>',
    );

    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('beforeafter');
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
  });

  it('strips an on* attribute even on an otherwise legitimate, allowed tag', () => {
    const { container } = renderXml(
      '<div><hi rend="bold" onclick="window.__pwned = true">click</hi></div>',
    );

    const hi = container.querySelector('hi');
    expect(hi).toHaveTextContent('click');
    expect(hi?.getAttribute('onclick')).toBeNull();
    expect(hi).toHaveAttribute('rend', 'bold');
  });

  it('drops a javascript: href by never rendering the <a> tag at all', () => {
    const { container } = renderXml(
      '<div><a href="javascript:window.__pwned = true">click</a></div>',
    );

    expect(container.querySelector('a')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('click');
  });

  it('rejects unsafe style values (url(), expression(), javascript:) while keeping safe ones', () => {
    const { container } = renderXml(
      '<div><hi style="color: red; background: url(https://evil.example/track.gif); width: expression(alert(1))">x</hi></div>',
    );

    const hi = container.querySelector('hi') as HTMLElement;
    expect(hi.style.color).toBe('red');
    expect(hi.style.background).toBe('');
    expect(hi.style.width).toBe('');
  });

  it('is case-insensitive against dangerous tags (XML case-sensitivity does not help an attacker)', () => {
    const { container } = renderXml(
      '<div><IMG src="x" onerror="window.__pwned = true"/>Anna</div>',
    );

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('Anna');
  });
});
