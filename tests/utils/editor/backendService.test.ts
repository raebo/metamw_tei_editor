import { backendService, LetterChangedSincePinnedError, PinnedLetterNotFoundError } from '@src/utils/editor/backendService';

const mockPatch = jest.fn();
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();

jest.mock('@src/services/apiRequest.service', () => ({
  initApi: () => ({
    get: mockGet,
    patch: mockPatch,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  }),
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

    expect(mockPatch).toHaveBeenCalledWith('/jwt/editor/pinned_letters/7/set_content', {
      changes: {
        new_content: '<?xml version="1.0" encoding="UTF-8"?> <TEI xmlns:tmp="urn:tmp"><persName key="p1">Anna</persName></TEI>',
        xml_id: null,
        change_type: 'manual_change',
      },
    });
  });

  it('does not send malformed editor XML', async () => {
    await expect(backendService.patchContent('<TEI><text></TEI>', 7, 'manual_change', null)).rejects.toThrow(
      'XML content is not well-formed.',
    );
    expect(mockPatch).not.toHaveBeenCalled();
  });
});

describe('backendService canonical JWT paths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the category path parameter instead of an undocumented query parameter', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await backendService.fetchProtagCreationCategories(12);

    expect(mockGet).toHaveBeenCalledWith('/jwt/misc/protag_creation_categories/12');
  });

  it('uses the collection path when no category is selected', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await backendService.fetchProtagCreationCategories(null);

    expect(mockGet).toHaveBeenCalledWith('/jwt/misc/protag_creation_categories');
  });

  it.each([404, 422])('propagates category lookup HTTP %s as an error', async (status) => {
    mockGet.mockRejectedValue({ response: { status, data: { error: 'category_error' } } });

    await expect(backendService.fetchProtagCreationCategories(12)).rejects.toThrow('category_error');
  });

  it('uses the canonical user-language path with a leading slash', async () => {
    mockPut.mockResolvedValue({ data: { message: 'ok' } });

    await backendService.updateUserLanguage('de');

    expect(mockPut).toHaveBeenCalledWith('/jwt/misc/user/language/de');
  });

  it('removes noncanonical trailing slashes from lifecycle requests', async () => {
    mockDelete.mockResolvedValue({});
    mockPost.mockResolvedValue({ data: { success: true, message: 'ok', xml_content: '<TEI />' } });

    await backendService.resetLetter(7);
    await backendService.rebaseLetter(7);
    await backendService.undoLetterChange(7);
    await backendService.redoLetterChange(7);

    expect(mockDelete).toHaveBeenCalledWith('/jwt/editor/pinned_letters/7/reset_letter');
    expect(mockPost).toHaveBeenCalledWith('/jwt/editor/pinned_letters/7/rebase');
    expect(mockPost).toHaveBeenCalledWith('/jwt/editor/letters/7/letter_changes/undo');
    expect(mockPost).toHaveBeenCalledWith('/jwt/editor/letters/7/letter_changes/redo');
  });

  it('encodes dynamic path segments', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await backendService.fetchLetterAuthors('fmb/ä 1');
    await backendService.fetchAuthorCategories('PSN/ä 1');

    expect(mockGet).toHaveBeenCalledWith('/jwt/misc/letters/fmb%2F%C3%A4%201/authors');
    expect(mockGet).toHaveBeenCalledWith('/jwt/misc/author/PSN%2F%C3%A4%201/categories');
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

    await expect(backendService.fetchLetterStaleness(7)).rejects.toBeInstanceOf(PinnedLetterNotFoundError);
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

    await expect(backendService.publishLetter(7)).rejects.toBeInstanceOf(LetterChangedSincePinnedError);
  });

  it.each([
    { status: 409, data: { error: 'another_conflict', message: 'No match.' } },
    { status: 409, data: { error: 'letter_changed_since_pinned' } },
    { status: 422, data: { error: 'Could not publish.' } },
  ])('keeps an invalid or generic response on the generic error path', async (response) => {
    mockPost.mockRejectedValue({ response });

    await expect(backendService.publishLetter(7)).rejects.not.toBeInstanceOf(LetterChangedSincePinnedError);
  });
});
