import {
  fetchLastUsedLettersByUser,
  fetchLetterDataByName,
  fetchLetterXmlContent,
  fetchSearchLetters,
  searchForLetterNameTitle,
} from '@src/services/editor/apiLettersRequest.service';

const mockGet = jest.fn();

jest.mock('@src/services/apiRequest.service', () => ({
  __esModule: true,
  default: { initApi: () => ({ get: mockGet }) },
}));

describe('apiLettersRequest.service canonical URLs', () => {
  beforeEach(() => {
    mockGet.mockReset();
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
});
