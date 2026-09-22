import {
  backendService,
  LetterChangedSincePinnedError,
  PinnedLetterNotFoundError,
} from '@src/utils/editor/backendService';

const mockPatch = jest.fn();
const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock('@src/services/apiRequest.service', () => ({
  initApi: () => ({ get: mockGet, patch: mockPatch, post: mockPost }),
}));

describe('backendService.patchContent', () => {
  beforeEach(() => {
    mockPatch.mockReset();
  });

  it('normalizes and validates editor XML before sending it', async () => {
    mockPatch.mockResolvedValue({});

    await expect(
      backendService.patchContent(
        '<TEI xmlns:tmp="urn:tmp"><persname data-key="p1" tmp:id="temporary">Anna</persname></TEI>',
        7,
        'manual_change',
        null,
      ),
    ).resolves.toBe(true);

    expect(mockPatch).toHaveBeenCalledWith('/jwt/editor/pinned_letters/7/set_content/', {
      changes: {
        new_content:
          '<?xml version="1.0" encoding="UTF-8"?> <TEI xmlns:tmp="urn:tmp"><persName key="p1">Anna</persName></TEI>',
        xml_id: null,
        change_type: 'manual_change',
      },
    });
  });

  it('does not send malformed editor XML', async () => {
    await expect(
      backendService.patchContent('<TEI><text></TEI>', 7, 'manual_change', null),
    ).rejects.toThrow('XML content is not well-formed.');
    expect(mockPatch).not.toHaveBeenCalled();
  });
});

describe('backendService letter staleness', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  it('maps a validated staleness response', async () => {
    mockGet.mockResolvedValue({
      data: { stale: true, letter_updated_at: '2026-09-22T10:00:00Z' },
    });

    await expect(backendService.fetchLetterStaleness(7)).resolves.toEqual({
      stale: true,
      letterUpdatedAt: '2026-09-22T10:00:00Z',
    });
  });

  it('turns a missing pinned letter into a typed error', async () => {
    mockGet.mockRejectedValue({ response: { status: 404, data: { error: 'not_found' } } });

    await expect(backendService.fetchLetterStaleness(7)).rejects.toBeInstanceOf(
      PinnedLetterNotFoundError,
    );
  });

  it('returns validated XML from a successful rebase', async () => {
    mockPost.mockResolvedValue({
      data: { success: true, message: 'letter rebased successfully', xml_content: '<TEI />' },
    });

    await expect(backendService.rebaseLetter(7)).resolves.toBe('<TEI />');
  });
});

describe('backendService.publishLetter', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('throws the typed exception only for a valid changed-since-pinned conflict', async () => {
    mockPost.mockRejectedValue({
      response: {
        status: 409,
        data: { error: 'letter_changed_since_pinned', message: 'The letter changed.' },
      },
    });

    await expect(backendService.publishLetter(7)).rejects.toBeInstanceOf(
      LetterChangedSincePinnedError,
    );
  });

  it.each([
    { status: 409, data: { error: 'another_conflict', message: 'No match.' } },
    { status: 409, data: { error: 'letter_changed_since_pinned' } },
    { status: 422, data: { error: 'Could not publish.' } },
  ])('keeps an invalid or generic response on the generic error path', async (response) => {
    mockPost.mockRejectedValue({ response });

    await expect(backendService.publishLetter(7)).rejects.not.toBeInstanceOf(
      LetterChangedSincePinnedError,
    );
  });
});
