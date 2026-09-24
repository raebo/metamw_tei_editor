import {
  deleteFigureImageMap,
  insertGraphicFigure,
  readFigureImageMap,
  updateFigureImageMap,
  validateGraphicUrl,
  type GraphicFigureInput,
} from '@src/utils/editor/graphicStructure';
import { EditorConstants } from '@src/constants/editor';

const parseXml = (body: string) =>
  new DOMParser().parseFromString(
    `<TEI xmlns="${EditorConstants.TEI_NS}"><teiHeader/><text><body><div><p xml:id="p_1">Text</p>${body}</div></body></text></TEI>`,
    'application/xml',
  );

const graphicInput: GraphicFigureInput = {
  layout: 'block',
  type: 'drawing',
  url: 'file:/images/drawing.svg',
  mimeType: 'image/svg+xml',
  rend: 'below',
  subtype: 'half_page',
  alignment: 'center',
  head: 'Title <not markup>',
  headVisible: true,
  description: 'Description & text',
  descriptionVisible: false,
};

describe('graphicStructure', () => {
  it('inserts explicit block and inline-copy figure variants with text-only metadata', () => {
    const xmlDoc = parseXml('');
    const paragraph = xmlDoc.getElementsByTagNameNS(EditorConstants.TEI_NS, 'p')[0];

    const block = insertGraphicFigure(paragraph, graphicInput);
    const inline = insertGraphicFigure(paragraph, {
      ...graphicInput,
      layout: 'inline-graphic',
      url: '/images/inline.png',
      mimeType: 'image/png',
    });

    expect(block.parentElement?.localName).toBe('div');
    expect(block.getAttribute('rend')).toBe('below');
    expect(block.getAttribute('subtype')).toBe('half_page');
    expect(block.getAttribute('style')).toBe('center');
    expect(block.querySelector('graphic')?.getAttribute('mimeType')).toBe('image/svg+xml');
    expect(block.querySelector('head')?.textContent).toBe('Title <not markup>');
    expect(block.querySelector('head svg')).toBeNull();
    expect(inline.parentElement).toBe(paragraph);
    expect(inline.getAttribute('subtype')).toBe('inline_graphic');
    expect(inline.hasAttribute('rend')).toBe(false);
    expect(block.getAttribute('xml:id')).not.toBe(inline.getAttribute('xml:id'));
  });

  it.each([
    'javascript:alert(1)',
    'data:image/svg+xml,<svg/>',
    'http://example.test/image.png',
    '//example.test/image.png',
    '../image.png',
    '/images/%2e%2e/secret.png',
    'images\\..\\secret.png',
    'file://evil.example/image.png',
  ])('rejects unsafe graphic URL %s', (url) => expect(() => validateGraphicUrl(url)).toThrow());

  it.each(['https://example.test/image.svg', 'file:/images/image.svg', '/images/image.png', 'images/image.png'])(
    'accepts safe graphic URL %s',
    (url) => expect(validateGraphicUrl(url)).toBe(url),
  );

  it('creates, reads, updates and deletes a TEI facsimile image map', () => {
    const xmlDoc = parseXml('');
    const paragraph = xmlDoc.getElementsByTagNameNS(EditorConstants.TEI_NS, 'p')[0];
    const figure = insertGraphicFigure(paragraph, graphicInput);

    updateFigureImageMap(figure, {
      width: 1000,
      height: 500,
      zones: [
        {
          id: 'zone_1',
          shape: 'rectangle',
          label: 'Signature',
          target: '#p_1',
          ulx: 10,
          uly: 20,
          lrx: 200,
          lry: 120,
        },
        {
          id: 'zone_2',
          shape: 'polygon',
          label: 'Seal',
          target: '',
          points: '300,20 400,20 350,100',
        },
      ],
    });

    const facsimile = xmlDoc.getElementsByTagNameNS(EditorConstants.TEI_NS, 'facsimile')[0];
    const surface = xmlDoc.getElementsByTagNameNS(EditorConstants.TEI_NS, 'surface')[0];
    expect(facsimile.nextElementSibling?.localName).toBe('text');
    expect(figure.getAttribute('facs')).toBe(`#${surface.getAttribute('xml:id')}`);
    expect(surface.querySelector('graphic')?.getAttribute('url')).toBe('file:/images/drawing.svg');
    expect(readFigureImageMap(figure)).toEqual({
      width: 1000,
      height: 500,
      zones: [
        {
          id: 'zone_1',
          shape: 'rectangle',
          label: 'Signature',
          target: '#p_1',
          ulx: 10,
          uly: 20,
          lrx: 200,
          lry: 120,
        },
        {
          id: 'zone_2',
          shape: 'polygon',
          label: 'Seal',
          target: '',
          points: '300,20 400,20 350,100',
        },
      ],
    });

    updateFigureImageMap(figure, {
      width: 1000,
      height: 500,
      zones: [
        {
          id: 'zone_1',
          shape: 'rectangle',
          label: 'Changed',
          target: '',
          ulx: 0,
          uly: 0,
          lrx: 50,
          lry: 50,
        },
      ],
    });
    expect(surface.querySelectorAll('zone')).toHaveLength(1);
    expect(surface.querySelector('zone')?.getAttribute('n')).toBe('Changed');

    deleteFigureImageMap(figure);
    expect(figure.hasAttribute('facs')).toBe(false);
    expect(xmlDoc.getElementsByTagNameNS(EditorConstants.TEI_NS, 'facsimile')).toHaveLength(0);
  });

  it('rejects duplicate IDs, external targets and out-of-bounds areas', () => {
    const xmlDoc = parseXml('');
    const paragraph = xmlDoc.getElementsByTagNameNS(EditorConstants.TEI_NS, 'p')[0];
    const figure = insertGraphicFigure(paragraph, graphicInput);

    expect(() =>
      updateFigureImageMap(figure, {
        width: 100,
        height: 100,
        zones: [
          {
            id: 'p_1',
            shape: 'rectangle',
            label: '',
            target: '',
            ulx: 0,
            uly: 0,
            lrx: 20,
            lry: 20,
          },
        ],
      }),
    ).toThrow(/bereits/);

    expect(() =>
      updateFigureImageMap(figure, {
        width: 100,
        height: 100,
        zones: [
          {
            id: 'zone_1',
            shape: 'rectangle',
            label: '',
            target: 'https://evil.test',
            ulx: 0,
            uly: 0,
            lrx: 120,
            lry: 20,
          },
        ],
      }),
    ).toThrow();
    expect(xmlDoc.getElementsByTagNameNS(EditorConstants.TEI_NS, 'facsimile')).toHaveLength(0);
  });
});
