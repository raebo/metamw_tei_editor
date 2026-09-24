import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import XMLDisplayParser from '@src/components/editor/letter/Center/LetterViewContainer/XmlDisplayParser';
import { textMarking } from '@src/utils/editor/textMarking';
import { fetchFigureImage } from '@src/services/editor/apiFigureRequest.service';

jest.mock('@src/services/editor/apiFigureRequest.service', () => ({
  fetchFigureImage: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockFetchFigureImage = fetchFigureImage as jest.MockedFunction<typeof fetchFigureImage>;
const createObjectUrlMock = jest.fn(() => 'blob:figure-image');
const revokeObjectUrlMock = jest.fn();

const renderXml = (xmlString: string) => render(<XMLDisplayParser xmlContentRef={null} xmlString={xmlString} />);

describe('XMLDisplayParser', () => {
  beforeAll(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrlMock,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchFigureImage.mockResolvedValue(new Blob(['image'], { type: 'image/png' }));
  });

  it('renders nested TEI elements and their text content', () => {
    const { container } = render(<XMLDisplayParser xmlContentRef={null} xmlString='<div>Hello <hi rend="italic">world</hi></div>' />);

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

  it('renders an empty list as a focusable editor target', () => {
    const { container } = renderXml('<TEI><text><body><div><list type="ordered"/></div></body></text></TEI>');

    const list = container.querySelector('list');
    expect(list).toHaveClass('tei-list');
    expect(list).toHaveAttribute('tabindex', '0');
    expect(list).toHaveAttribute('data-editor-xml-path', '0.0.0.0');
  });

  it('renders a focusable caret and selectable HTML cells for every TEI table', () => {
    const { container } = renderXml(
      '<TEI><text><body><div><table rows="1" cols="1"><row><cell>A</cell></row></table></div></body></text></TEI>',
    );

    const caret = container.querySelector('[data-editor-table-caret]');
    const table = container.querySelector('table');
    const row = container.querySelector('tr[data-editor-tei-element="row"]');
    const cell = container.querySelector('td[data-editor-tei-element="cell"]');
    expect(caret).toHaveTextContent('▶');
    expect(caret).toHaveAttribute('tabindex', '0');
    expect(caret).toHaveAttribute('data-editor-xml-path', '0.0.0.0');
    expect(table).toHaveClass('tei-table');
    expect(table).toHaveAttribute('data-editor-xml-path', '0.0.0.0');
    expect(table).toHaveAttribute('rows', '1');
    expect(table).toHaveAttribute('cols', '1');
    expect(row).toHaveAttribute('data-editor-xml-path', '0.0.0.0.0');
    expect(cell).toHaveTextContent('A');
    expect(cell).toHaveAttribute('tabindex', '0');
    expect(cell).toHaveAttribute('data-editor-xml-path', '0.0.0.0.0.0');
  });

  it('maps TEI cell spans to their HTML table equivalents', () => {
    const { container } = renderXml('<table rows="2" cols="2"><row><cell rows="2" cols="2" role="label">Heading</cell></row></table>');

    const cell = container.querySelector('td');
    expect(cell).toHaveAttribute('rowspan', '2');
    expect(cell).toHaveAttribute('colspan', '2');
    expect(cell).toHaveAttribute('data-tei-role', 'label');
    expect(cell).not.toHaveAttribute('role');
  });

  it('renders a TEI table head as an HTML caption outside the table body', () => {
    const { container } = renderXml('<table><head>Overview</head><row role="label"><cell>Heading</cell></row></table>');

    const table = container.querySelector('table')!;
    expect(table.querySelector(':scope > caption')).toHaveTextContent('Overview');
    expect(table.querySelector(':scope > tbody > tr')).toHaveAttribute('data-tei-role', 'label');
    expect(table.querySelector('tr')).not.toHaveAttribute('role');
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

  it('loads a figure through the JWT route inputs and uses figDesc as alternative text', async () => {
    const { unmount } = render(
      <XMLDisplayParser
        xmlContentRef={null}
        letterId={123}
        xmlString={`<TEI><text><body><p>
          <figure xml:id="figure_ä:1" rend="inline">
            <graphic url="file:/P:/XML/Bilder/Zeichnungen/ignored.png" />
            <figDesc>Zeichnung &amp; Skizze</figDesc>
          </figure>
        </p></body></text></TEI>`}
      />,
    );

    const image = await screen.findByRole('img', { name: 'Zeichnung & Skizze' });
    expect(image).toHaveAttribute('src', 'blob:figure-image');
    expect(mockFetchFigureImage).toHaveBeenCalledWith(123, 'figure_ä:1', expect.any(AbortSignal));
    expect(createObjectUrlMock).toHaveBeenCalledWith(expect.any(Blob));

    unmount();
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:figure-image');
  });

  it('renders facsimile zones as toggleable safe overlays without exposing facsimile or SVG markup', async () => {
    const { container } = render(
      <XMLDisplayParser
        xmlContentRef={null}
        letterId={123}
        xmlString={`<TEI>
          <facsimile><surface xml:id="surface_1" ulx="0" uly="0" lrx="1000" lry="500">
            <graphic url="file:/images/map.svg" mimeType="image/svg+xml"/>
            <zone xml:id="zone_1" n="Signature" ulx="100" uly="50" lrx="300" lry="150"/>
            <zone xml:id="zone_2" n="Seal" points="500,100 700,100 600,300"/>
          </surface></facsimile>
          <text><body><figure xml:id="figure_map" facs="#surface_1"><graphic url="file:/images/map.svg" mimeType="image/svg+xml"/><figDesc>Map</figDesc><svg><script>alert(1)</script></svg></figure></body></text>
        </TEI>`}
      />,
    );

    await screen.findByRole('img', { name: 'Map' });
    expect(mockFetchFigureImage).toHaveBeenCalledWith(123, 'figure_map', expect.any(AbortSignal));
    expect(container.querySelector('facsimile')).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('.tei-image-map-area')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'editor:dialog.graphicStructure.toggleAreas' }));
    expect(container.querySelectorAll('.tei-image-map-area')).toHaveLength(2);
    expect(screen.getByText('Signature')).toBeInTheDocument();
    expect(screen.getByText('Seal')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'editor:dialog.graphicStructure.hideAreas' }));
    expect(container.querySelector('.tei-image-map-area')).toBeNull();
  });

  it('opens and closes an enlarged preview without loading the image again', async () => {
    render(
      <XMLDisplayParser
        xmlContentRef={null}
        letterId={123}
        xmlString='<figure xml:id="figure_preview"><graphic/><figDesc>Preview image</figDesc></figure>'
      />,
    );

    const trigger = await screen.findByRole('button', {
      name: 'editor:common.figure.openPreview',
    });
    fireEvent.click(trigger);

    expect(await screen.findByRole('dialog', { name: 'Preview image' })).toBeInTheDocument();
    const images = Array.from(document.querySelectorAll('img[alt="Preview image"]'));
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'blob:figure-image');
    expect(images[1]).toHaveAttribute('src', 'blob:figure-image');
    expect(mockFetchFigureImage).toHaveBeenCalledTimes(1);

    const canvas = screen.getByTestId('figure-preview-canvas');
    const zoomOut = screen.getByRole('button', {
      name: 'editor:common.figure.zoomOut',
    });
    const zoomIn = screen.getByRole('button', {
      name: 'editor:common.figure.zoomIn',
    });
    const resetZoom = screen.getByRole('button', {
      name: 'editor:common.figure.resetZoom',
    });
    expect(canvas).toHaveStyle({ width: '100%' });
    expect(resetZoom).toBeDisabled();

    fireEvent.click(zoomOut);
    fireEvent.click(zoomOut);
    expect(canvas).toHaveStyle({ width: '50%' });
    expect(zoomOut).toBeDisabled();

    fireEvent.click(zoomIn);
    expect(canvas).toHaveStyle({ width: '75%' });
    fireEvent.click(resetZoom);
    expect(canvas).toHaveStyle({ width: '100%' });

    for (let step = 0; step < 8; step += 1) fireEvent.click(zoomIn);
    expect(canvas).toHaveStyle({ width: '300%' });
    expect(zoomIn).toBeDisabled();
    expect(mockFetchFigureImage).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'editor:common.figure.closePreview' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('img', { name: 'Preview image' })).toBeInTheDocument();
    expect(mockFetchFigureImage).toHaveBeenCalledTimes(1);
  });

  it('maps trusted figure layout tokens without exposing them as inline CSS', async () => {
    const { container } = render(
      <XMLDisplayParser
        xmlContentRef={null}
        letterId={123}
        xmlString={`<figure xml:id="figure_layout" style="center" rend="inline" subtype="half_page">
          <graphic/>
          <head style="display_none">Hidden heading</head>
          <figDesc style="display_none">Hidden description</figDesc>
        </figure>`}
      />,
    );

    await screen.findByRole('img', { name: 'Hidden description' });
    const figure = container.querySelector('figure');
    expect(figure).toHaveClass('tei-figure-align-center');
    expect(figure).toHaveClass('tei-figure-rend-inline');
    expect(figure).toHaveClass('tei-figure-subtype-half-page');
    expect(figure).not.toHaveAttribute('style');
    expect(figure).not.toHaveAttribute('rend');
    expect(figure).not.toHaveAttribute('subtype');
    expect(container.querySelector('head')).toHaveStyle({ display: 'none' });
    expect(container.querySelector('figdesc')).toHaveStyle({ display: 'none' });
  });

  it('uses neutral layout for unknown figure layout tokens', async () => {
    const { container } = render(
      <XMLDisplayParser
        xmlContentRef={null}
        letterId={123}
        xmlString='<figure xml:id="figure_layout" style="position:fixed" rend="evil" subtype="unknown"><graphic/></figure>'
      />,
    );

    await screen.findByRole('img');
    const figure = container.querySelector('figure');
    expect(figure).not.toHaveAttribute('style');
    expect(figure).not.toHaveAttribute('rend');
    expect(figure).not.toHaveAttribute('subtype');
    expect(figure?.className).toBe('');
  });

  it('maps supported paragraph styles to classes and ignores unknown style values', () => {
    const { container } = renderXml(`<div>
      <p style="paragraph_without_indent">one</p>
      <p style="paragraph_without_indent_indented">two</p>
      <p style="paragraph_hanging">three</p>
      <p style="paragraph centered">four</p>
      <p style="paragraph_right">five</p>
      <p style="position: fixed; color: red">unsafe</p>
    </div>`);

    const paragraphs = Array.from(container.querySelectorAll('p'));
    expect(paragraphs[0]).toHaveClass('tei-paragraph-without-indent');
    expect(paragraphs[1]).toHaveClass('tei-paragraph-without-indent-indented');
    expect(paragraphs[2]).toHaveClass('tei-paragraph-hanging');
    expect(paragraphs[3]).toHaveClass('tei-paragraph-centered');
    expect(paragraphs[4]).toHaveClass('tei-paragraph-right');
    expect(paragraphs[5]).not.toHaveAttribute('style');
    expect(paragraphs[5]?.className).toBe('');
  });

  it('shows a local placeholder and makes no request for a figure without xml:id', () => {
    render(
      <XMLDisplayParser
        xmlContentRef={null}
        letterId={123}
        xmlString='<TEI><text><body><figure><graphic url="https://evil.example/image.png"/><figDesc>Missing image</figDesc></figure></body></text></TEI>'
      />,
    );

    expect(screen.getByRole('img', { name: 'Missing image' })).toBeInTheDocument();
    expect(mockFetchFigureImage).not.toHaveBeenCalled();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows a local placeholder and makes no request for a figure without graphic', () => {
    render(
      <XMLDisplayParser
        xmlContentRef={null}
        letterId={123}
        xmlString='<TEI><text><body><figure xml:id="figure_missing"><figDesc>Missing graphic</figDesc></figure></body></text></TEI>'
      />,
    );

    expect(screen.getByRole('img', { name: 'Missing graphic' })).toBeInTheDocument();
    expect(mockFetchFigureImage).not.toHaveBeenCalled();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not offer retry for a figure image that returns 404', async () => {
    mockFetchFigureImage.mockRejectedValue({ response: { status: 404 } });

    render(
      <XMLDisplayParser
        xmlContentRef={null}
        letterId={123}
        xmlString='<figure xml:id="figure_missing"><graphic/><figDesc>Missing file</figDesc></figure>'
      />,
    );

    expect(await screen.findByRole('img', { name: 'Missing file' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('offers a retry after a figure request fails', async () => {
    mockFetchFigureImage.mockRejectedValueOnce(new Error('not found')).mockResolvedValueOnce(new Blob(['image'], { type: 'image/jpeg' }));

    render(
      <XMLDisplayParser
        xmlContentRef={null}
        letterId={123}
        xmlString='<TEI><text><body><figure xml:id="figure_retry"><graphic/><figDesc>Retry image</figDesc></figure></body></text></TEI>'
      />,
    );

    const retryButton = await screen.findByRole('button');
    fireEvent.click(retryButton);

    expect(await screen.findByRole('img', { name: 'Retry image' })).toHaveAttribute('src', 'blob:figure-image');
    await waitFor(() => expect(mockFetchFigureImage).toHaveBeenCalledTimes(2));
  });

  it('updates figure display when the XML working copy changes through undo and redo', async () => {
    const figureXml =
      '<TEI><text><body><figure xml:id="figure_history"><graphic/><figDesc>History image</figDesc></figure></body></text></TEI>';
    const withoutFigureXml = '<TEI><text><body><p>Text</p></body></text></TEI>';
    const { rerender } = render(<XMLDisplayParser xmlContentRef={null} letterId={123} xmlString={figureXml} />);

    expect(await screen.findByRole('img', { name: 'History image' })).toBeInTheDocument();
    rerender(<XMLDisplayParser xmlContentRef={null} letterId={123} xmlString={withoutFigureXml} />);
    expect(screen.queryByRole('img', { name: 'History image' })).not.toBeInTheDocument();

    rerender(<XMLDisplayParser xmlContentRef={null} letterId={123} xmlString={figureXml} />);
    expect(await screen.findByRole('img', { name: 'History image' })).toBeInTheDocument();
    expect(mockFetchFigureImage).toHaveBeenCalledTimes(2);
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

    const markedDocument = textMarking.createMarkedXmlDocument(sourceXml, container as HTMLElement, range);
    const serialized = new XMLSerializer().serializeToString(markedDocument);

    expect(markedDocument.documentElement.tagName).toBe('TEI');
    expect(markedDocument.documentElement.namespaceURI).toBe('http://www.tei-c.org/ns/1.0');
    expect(markedDocument.documentElement.getAttribute('xmlns:xsi')).toBe('http://www.w3.org/2001/XMLSchema-instance');
    expect(markedDocument.documentElement.getAttribute('xsi:schemaLocation')).toBe('http://www.tei-c.org/ns/1.0 schema.xsd');
    expect(markedDocument.documentElement.getAttribute('xml:space')).toBe('default');
    expect(markedDocument.querySelector('licence')?.getAttribute('target')).toBe('https://example.test/licence');
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
    const { container } = renderXml('<div><img src="x" onerror="window.__pwned = true" />Anna</div>');

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('Anna');
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
  });

  it('drops an <svg onload=...> element entirely instead of rendering it', () => {
    const { container } = renderXml('<div><svg onload="window.__pwned = true"><circle/></svg>Anna</div>');

    expect(container.querySelector('svg')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('Anna');
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
  });

  it('drops <script> tags including their content entirely', () => {
    const { container } = renderXml('<div>before<script>window.__pwned = true;</script>after</div>');

    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('beforeafter');
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
  });

  it('strips an on* attribute even on an otherwise legitimate, allowed tag', () => {
    const { container } = renderXml('<div><hi rend="bold" onclick="window.__pwned = true">click</hi></div>');

    const hi = container.querySelector('hi');
    expect(hi).toHaveTextContent('click');
    expect(hi?.getAttribute('onclick')).toBeNull();
    expect(hi).toHaveAttribute('rend', 'bold');
  });

  it('drops a javascript: href by never rendering the <a> tag at all', () => {
    const { container } = renderXml('<div><a href="javascript:window.__pwned = true">click</a></div>');

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
    const { container } = renderXml('<div><IMG src="x" onerror="window.__pwned = true"/>Anna</div>');

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('Anna');
  });
});
