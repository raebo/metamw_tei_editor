import { initApi } from '@src/services/apiRequest.service';
import { fetchFigureImage, uploadFigure } from '@src/services/editor/apiFigureRequest.service';

const getMock = jest.fn();
const postMock = jest.fn();

jest.mock('@src/services/apiRequest.service', () => ({
  initApi: jest.fn(() => ({ get: getMock, post: postMock })),
}));

describe('apiFigureRequest.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the image as a blob from the encoded JWT figure URL', async () => {
    const blob = new Blob(['image'], { type: 'image/png' });
    getMock.mockResolvedValue({
      data: blob,
      headers: { 'content-type': 'image/png' },
    });
    const abortController = new AbortController();

    await expect(fetchFigureImage(123, 'figure_ä:1', abortController.signal)).resolves.toBe(blob);

    expect(initApi).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith('/jwt/editor/pinned_letters/123/figures/figure_%C3%A4%3A1/image', {
      responseType: 'blob',
      signal: abortController.signal,
    });
  });

  it.each(['image/jpeg', 'image/svg+xml; charset=utf-8'])('accepts the supported response content type %s', async (contentType) => {
    const blob = new Blob(['image'], { type: contentType.split(';')[0] });
    getMock.mockResolvedValue({ data: blob, headers: { 'content-type': contentType } });

    await expect(fetchFigureImage(123, 'figure_1')).resolves.toBe(blob);
  });

  it('rejects a response whose content type is not an allowed image type', async () => {
    getMock.mockResolvedValue({
      data: new Blob(['<html/>'], { type: 'text/html' }),
      headers: { 'content-type': 'text/html' },
    });

    await expect(fetchFigureImage(123, 'figure_1')).rejects.toThrow('Unsupported figure image content type');
  });

  it('uploads the browser-generated multipart form without manually setting headers', async () => {
    postMock.mockResolvedValue({
      data: {
        letter_id: '123',
        figure_xml_id: 'figure_1',
        filename: 'letter-Z-001.png',
        content_type: 'image/png',
        graphic_url: 'file:/images/letter-Z-001.png',
        preview_url: '/jwt/editor/pinned_letters/123/figures/figure_1/image',
        xml_content: '<TEI><text><body/></text></TEI>',
        undo_available: true,
        redo_available: false,
      },
    });
    const image = new File(['image'], 'drawing.png', { type: 'image/png' });

    await uploadFigure(123, {
      image,
      category: 'drawing',
      anchorXmlId: 'paragraph_1',
      position: 'after',
      head: '  A <heading> & more  ',
      figDesc: '  Description "quoted"  ',
    });

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith('/jwt/editor/pinned_letters/123/figures', expect.any(FormData));
    const body = postMock.mock.calls[0][1] as FormData;
    expect(body.get('image')).toBe(image);
    expect(body.get('category')).toBe('drawing');
    expect(body.get('anchor_xml_id')).toBe('paragraph_1');
    expect(body.get('position')).toBe('after');
    expect(body.get('head')).toBe('A <heading> & more');
    expect(body.get('fig_desc')).toBe('Description "quoted"');
  });
});
