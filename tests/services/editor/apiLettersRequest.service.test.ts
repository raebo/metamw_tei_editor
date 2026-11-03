import axios from 'axios';
import {
  createNewLetter,
  fetchLastUsedLettersByUser,
  fetchLetterDataByName,
  fetchLetterXmlContent,
  fetchSearchLetters,
  LetterLifecycleRequestError,
  searchForLetterNameTitle,
} from '@src/services/editor/apiLettersRequest.service';

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock('@src/services/apiRequest.service', () => ({
  __esModule: true,
  default: { initApi: () => ({ get: mockGet, post: mockPost }) },
}));

describe('apiLettersRequest.service canonical URLs', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  it('passes letter-search input through Axios params', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await fetchSearchLetters('Bach / Leipzig ä');

    expect(mockGet).toHaveBeenCalledWith('/jwt/editor/letters/search', {
      params: { searchValue: 'Bach / Leipzig ä' },
    });
  });

  it.each([
    ['last-used letters', () => fetchLastUsedLettersByUser()],
    ['letter search', () => fetchSearchLetters('Bach')],
    ['typed letter search', () => searchForLetterNameTitle('fmb', null)],
  ])('rejects a non-array %s response', async (_operation, request) => {
    mockGet.mockResolvedValue({ data: null });

    await expect(request()).rejects.toThrow();
  });

  it('preserves an empty letter collection as an empty array', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await expect(fetchLastUsedLettersByUser()).resolves.toEqual([]);
  });

  it.each([
    ['<TEI/>', '<TEI/>'],
    [null, null],
  ])('validates the documented XML content response %p', async (responseData, expected) => {
    mockGet.mockResolvedValue({ data: responseData });

    await expect(fetchLetterXmlContent(17420)).resolves.toBe(expected);
  });

  it('rejects an invalid XML content response', async () => {
    mockGet.mockResolvedValue({ data: { xml_content: '<TEI/>' } });

    await expect(fetchLetterXmlContent(17420)).rejects.toThrow('Failed to fetch LetterXmlContent');
  });

  it('encodes all dynamic search path segments', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await searchForLetterNameTitle('fmb/gb', 'Bach / Leipzig ä');

    expect(mockGet).toHaveBeenCalledWith('/jwt/editor/letters/search_for_letters/fmb%2Fgb/Bach%20%2F%20Leipzig%20%C3%A4');
  });

  it('encodes the exact-name lookup path segment', async () => {
    mockGet.mockResolvedValue({ data: {} });

    await expect(fetchLetterDataByName('fmb/ä 1')).rejects.toThrow();

    expect(mockGet).toHaveBeenCalledWith('/jwt/editor/letters/by_name/fmb%2F%C3%A4%201');
  });

  it('accepts the documented HTTP 200 letter-creation response', async () => {
    mockPost.mockResolvedValue({
      status: 200,
      data: {
        letter_id: 17420,
        letter_name: 'fmb-1840-06-06-01',
        message: 'Letter created',
        capabilities: {
          rename: { allowed: true, reason_code: null },
          discard: { allowed: true, reason_code: null },
        },
        version: 'a'.repeat(64),
      },
    });

    await expect(createNewLetter({ letterName: 'gb-1840-06-06-01', isFmbLetter: true } as never)).resolves.toEqual(
      expect.objectContaining({
        newLetterId: 17420,
        newLetterName: 'fmb-1840-06-06-01',
        responseMessage: 'Letter created',
      }),
    );
    expect(mockPost).toHaveBeenCalledWith('/jwt/editor/letters', {
      letter: { letterName: 'gb-1840-06-06-01' },
    });
  });

  it('rejects an undocumented successful letter-creation status', async () => {
    mockPost.mockResolvedValue({ status: 201, data: {} });

    await expect(createNewLetter({} as never)).rejects.toThrow('Unexpected letter creation status: 201');
  });

  it('maps a reserved retired letter name to the documented lifecycle error', async () => {
    mockPost.mockRejectedValue(
      new axios.AxiosError('Conflict', undefined, undefined, undefined, {
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config: { headers: {} } as never,
        data: { error: 'letter_name_retired' },
      }),
    );

    const request = createNewLetter({} as never);
    await expect(request).rejects.toBeInstanceOf(LetterLifecycleRequestError);
    await expect(request).rejects.toMatchObject({
      status: 409,
      reasonCode: 'letter_name_retired',
    });
  });
});
