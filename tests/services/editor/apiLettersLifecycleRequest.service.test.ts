import { discardLetter, LetterLifecycleRequestError, renameLetter } from '@src/services/editor/apiLettersRequest.service';

const patchMock = jest.fn();
const deleteMock = jest.fn();

jest.mock('@src/services/apiRequest.service', () => ({
  __esModule: true,
  default: {
    initApi: () => ({ patch: patchMock, delete: deleteMock }),
  },
}));

const version = 'a'.repeat(64);
const capabilities = {
  rename: { allowed: true, reason_code: null },
  discard: { allowed: true, reason_code: null },
};

describe('letter lifecycle requests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renames by canonical numeric ID with the exact version header and validates the response', async () => {
    patchMock.mockResolvedValue({
      status: 200,
      data: {
        id: 17420,
        name: 'fmb-1840-06-06-02',
        title: null,
        xml_content: '<TEI/>',
        capabilities,
        version,
      },
    });

    await expect(renameLetter(17420, 'fmb-1840-06-06-02', version)).resolves.toEqual({
      id: 17420,
      name: 'fmb-1840-06-06-02',
      capabilities: {
        rename: { allowed: true, reasonCode: null },
        discard: { allowed: true, reasonCode: null },
      },
      version,
    });
    expect(patchMock).toHaveBeenCalledWith(
      '/jwt/editor/letters/17420',
      { letter: { name: 'fmb-1840-06-06-02' } },
      { headers: { 'X-Letter-Version': version } },
    );
  });

  it('discards with the exact version header and does not parse a 204 response body', async () => {
    deleteMock.mockResolvedValue({ status: 204, data: '' });

    await expect(discardLetter(17420, version)).resolves.toBeUndefined();
    expect(deleteMock).toHaveBeenCalledWith('/jwt/editor/letters/17420', {
      headers: { 'X-Letter-Version': version },
    });
  });

  it('preserves documented status and reason codes for UI handling', async () => {
    patchMock.mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { error: 'letter_version_conflict' } },
    });

    await expect(renameLetter(17420, 'fmb-1840-06-06-02', version)).rejects.toEqual(
      expect.objectContaining<Partial<LetterLifecycleRequestError>>({
        status: 409,
        reasonCode: 'letter_version_conflict',
      }),
    );
  });

  it('rejects a rename response whose version does not match the OpenAPI contract', async () => {
    patchMock.mockResolvedValue({
      status: 200,
      data: {
        id: 17420,
        name: 'fmb-1840-06-06-02',
        title: null,
        xml_content: '<TEI/>',
        capabilities,
        version: 'stale',
      },
    });

    await expect(renameLetter(17420, 'fmb-1840-06-06-02', version)).rejects.toBeInstanceOf(LetterLifecycleRequestError);
  });
});
