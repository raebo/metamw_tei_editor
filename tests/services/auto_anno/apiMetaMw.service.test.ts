import { fetchMetamwLetterData } from '@src/services/auto_anno/apiMetaMw.service';

const getMock = jest.fn();

jest.mock('@src/services/apiRequest.service', () => ({
  __esModule: true,
  default: {
    initApi: () => ({ get: getMock }),
  },
}));

describe('apiMetaMw.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the serialized letter for a successful exact-name lookup', async () => {
    const letter = {
      id: 123,
      name: 'fmb-1801-06-06-01',
      title: 'Beispieltitel',
      xml_content: '<TEI>...</TEI>',
    };
    getMock.mockResolvedValue({ data: letter, status: 200 });

    await expect(fetchMetamwLetterData(letter.name)).resolves.toEqual(letter);
    expect(getMock).toHaveBeenCalledWith('/jwt/editor/letters/by_name/fmb-1801-06-06-01');
  });

  it('treats a 404 response as an available letter name', async () => {
    getMock.mockRejectedValue({
      response: {
        status: 404,
        data: { error: 'letter_not_found' },
      },
    });

    await expect(fetchMetamwLetterData('fmb-1801-06-06-01')).resolves.toBeNull();
  });

  it.each([401, 500])('does not treat an HTTP %s response as an available name', async (status) => {
    const error = { response: { status, data: { error: 'request_failed' } } };
    getMock.mockRejectedValue(error);

    await expect(fetchMetamwLetterData('fmb-1801-06-06-01')).rejects.toBe(error);
  });

  it('does not treat a network error as an available name', async () => {
    const error = new Error('network down');
    getMock.mockRejectedValue(error);

    await expect(fetchMetamwLetterData('fmb-1801-06-06-01')).rejects.toBe(error);
  });
});
