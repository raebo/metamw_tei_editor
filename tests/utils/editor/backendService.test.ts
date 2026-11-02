import axios from 'axios';
import {
  backendService,
  EntityCreateRequestError,
  JwtMiscRequestError,
  LetterChangedSincePinnedError,
  PinnedLetterNotFoundError,
  RebaseLetterRequestError,
} from '@src/utils/editor/backendService';
import { EntityType } from '@src/constants/editor';

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
    mockPatch.mockResolvedValue({ data: { success: true, message: 'Content updated' } });

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

  it('rejects an invalid set-content response', async () => {
    mockPatch.mockResolvedValue({ data: { success: 'true', message: 'Content updated' } });

    await expect(backendService.patchContent('<TEI/>', 7, 'manual_change', null)).rejects.toThrow();
  });

  it('rejects a documented unsuccessful set-content response', async () => {
    mockPatch.mockResolvedValue({ data: { success: false, message: 'Content was not updated' } });

    await expect(backendService.patchContent('<TEI/>', 7, 'manual_change', null)).rejects.toThrow('Content was not updated');
  });
});

describe('backendService.createEntity', () => {
  const personRequest = {
    entity_type: EntityType.PERSON,
    entityData: {
      key: 'PSN1234567',
      first_name: 'Ada',
      last_name: 'Example',
    },
  } as const;

  beforeEach(() => {
    mockPost.mockReset();
  });

  it('sends entity_type and entityData in the JSON body and returns the canonical key', async () => {
    mockPost.mockResolvedValue({ data: { entity_key: 'PSN1234567' }, status: 201 });

    await expect(backendService.createEntity(personRequest)).resolves.toBe('PSN1234567');
    expect(mockPost).toHaveBeenCalledWith('/jwt/editor/entities', personRequest);
  });

  it('rejects legacy or otherwise invalid success responses', async () => {
    mockPost.mockResolvedValue({
      data: { entity_key: 'PSN1234567', newId: 123 },
      status: 201,
    });

    await expect(backendService.createEntity(personRequest)).rejects.toThrow();
  });

  it.each([
    [422, 'invalid_entity_data'],
    [500, 'entity_creation_failed'],
  ] as const)('maps HTTP %s with %s to a typed request error', async (status, code) => {
    mockPost.mockRejectedValue({ response: { status, data: { error: code } } });

    const request = backendService.createEntity(personRequest);
    await expect(request).rejects.toMatchObject({ code, status });
    await expect(request).rejects.toBeInstanceOf(EntityCreateRequestError);
  });

  it('rejects invalid client data before sending a request', async () => {
    const invalidRequest = {
      ...personRequest,
      entityData: { ...personRequest.entityData, key: '' },
    };

    await expect(backendService.createEntity(invalidRequest)).rejects.toThrow();
    expect(mockPost).not.toHaveBeenCalled();
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

  it('rejects an invalid user-language response', async () => {
    mockPut.mockResolvedValue({ data: { status: 'ok' } });

    await expect(backendService.updateUserLanguage('de')).rejects.toThrow();
  });

  it('removes noncanonical trailing slashes from lifecycle requests', async () => {
    mockDelete.mockResolvedValue({ data: { success: true, message: 'reset' } });
    mockPost
      .mockResolvedValueOnce({
        data: { success: true, message: 'rebased', xml_content: '<TEI />' },
      })
      .mockResolvedValueOnce({
        data: { content: '<TEI>Ä</TEI>', undo_available: false, redo_available: true },
      })
      .mockResolvedValueOnce({
        data: { content: '<TEI>Ä</TEI>', undo_available: true, redo_available: false },
      });

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

describe('backendService reference-data contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates RISM entries and normalizes documented nullable text fields', async () => {
    mockPost.mockResolvedValue({
      data: [
        {
          id: 1,
          title: null,
          city: null,
          country: null,
          code: null,
          name: null,
        },
      ],
    });

    await expect(backendService.searchRismEntries('Bach')).resolves.toEqual([
      {
        id: 1,
        title: '',
        city: '',
        country: '',
        code: '',
        name: '',
        idNo: '',
      },
    ]);
  });

  it('maps nullable protag category fields after validation', async () => {
    mockGet.mockResolvedValue({
      data: [
        {
          id: 2,
          name: 'Werkgruppe',
          name_en: null,
          protag_creation_category_id: null,
        },
      ],
    });

    await expect(backendService.fetchProtagCreationCategories(null)).resolves.toEqual([
      {
        id: 2,
        name: 'Werkgruppe',
        name_en: '',
        protagCreationCategoryId: null,
      },
    ]);
  });

  it('rejects a protag creation entry with a null name', async () => {
    mockGet.mockResolvedValue({
      data: [
        {
          id: 707,
          name: null,
          protag_creation_category_id: 42,
          key: 'PRC0000707',
          mwv: null,
          op: null,
        },
      ],
    });

    await expect(
      backendService.fetchProtagCreationEntries({
        id: 42,
        name: 'Werkgruppe',
        name_en: '',
        protagCreationCategoryId: null,
      }),
    ).rejects.toMatchObject({ name: 'ZodError' });
    expect(mockGet).toHaveBeenCalledWith('/jwt/misc/protag_creations_for_category/42', {});
  });

  it('validates simple country and kind lists', async () => {
    mockGet
      .mockResolvedValueOnce({ data: [{ id: 1, name: 'Deutschland' }] })
      .mockResolvedValueOnce({ data: ['Stadt'] })
      .mockResolvedValueOnce({ data: ['Sinfonie'] });

    await expect(backendService.fetchCountryEntries()).resolves.toEqual([{ id: 1, name: 'Deutschland' }]);
    await expect(backendService.fetchKindEntries()).resolves.toEqual(['Stadt']);
    await expect(backendService.fetchCreationKinds()).resolves.toEqual(['Sinfonie']);
  });

  it('rejects malformed successful reference-data responses', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 'not-a-number', name: 'Deutschland' }] });

    await expect(backendService.fetchCountryEntries()).rejects.toThrow();
  });

  it.each([
    [401, { message: 'Unauthorized' }, 'Unauthorized'],
    [422, { error: 'invalid_reference_query' }, 'invalid_reference_query'],
  ] as const)('maps a documented HTTP %s response to a typed misc request error', async (status, data, backendMessage) => {
    mockGet.mockRejectedValue({ response: { status, data } });

    const request = backendService.fetchCreationKinds();
    await expect(request).rejects.toBeInstanceOf(JwtMiscRequestError);
    await expect(request).rejects.toMatchObject({
      operation: 'backendService.fetchCreationKinds',
      status,
      backendMessage,
    });
  });

  it('does not assume a stable body for an unexpected server error', async () => {
    mockGet.mockRejectedValue({ response: { status: 500, data: { unexpected: true } } });

    const request = backendService.fetchCreationKinds();
    await expect(request).rejects.toMatchObject({
      operation: 'backendService.fetchCreationKinds',
      status: 500,
      backendMessage: undefined,
      message: 'backendService.fetchCreationKinds: HTTP 500',
    });
  });

  it('keeps network failures distinct from HTTP responses', async () => {
    mockGet.mockRejectedValue(Object.assign(new Error('Network Error'), { isAxiosError: true }));

    const request = backendService.fetchCreationKinds();
    await expect(request).rejects.toMatchObject({
      operation: 'backendService.fetchCreationKinds',
      status: undefined,
      backendMessage: 'Network Error',
    });
  });

  it('uses the same typed error handling for RISM searches', async () => {
    mockPost.mockRejectedValue({ response: { status: 401, data: { message: 'Unauthorized' } } });

    await expect(backendService.searchRismEntries('Bach')).rejects.toMatchObject({
      operation: 'backendService.searchRismEntries',
      status: 401,
      backendMessage: 'Unauthorized',
    });
  });

  it('validates and maps nullable misc-letter fields', async () => {
    mockPost.mockResolvedValue({
      data: [
        {
          id: 3,
          name: 'fmb-1801-01-01-01',
          title: null,
          display_name: 'Brief 1',
        },
      ],
    });

    await expect(backendService.searchSenderReceiverLetters(null, 'WRITER')).resolves.toEqual([
      {
        entityId: 3,
        entityKey: 'fmb-1801-01-01-01',
        entityName: '',
        entityDisplayName: 'Brief 1',
        entityType: 'LETTER',
        extraData: {},
      },
    ]);
  });

  it('validates and maps nullable author names', async () => {
    mockGet.mockResolvedValue({
      data: [
        {
          id: 4,
          key: 'PSN0000001',
          first_name: null,
          last_name: null,
          display_name: 'Unbekannte Person',
        },
      ],
    });

    await expect(backendService.fetchLetterAuthors('fmb-1801-01-01-01')).resolves.toEqual([
      {
        entityId: 4,
        entityKey: 'PSN0000001',
        entityName: 'Unbekannte Person',
        entityFirstName: undefined,
        entityLastName: undefined,
        entityDisplayName: 'Unbekannte Person',
        entityType: 'PERSON',
        extraData: {},
      },
    ]);
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

  it('rejects an invalid successful rebase response', async () => {
    mockPost.mockResolvedValue({
      data: { success: false, message: 'not rebased', xml_content: '<TEI />' },
    });

    await expect(backendService.rebaseLetter(7)).rejects.toMatchObject({ name: 'ZodError' });
  });

  it.each([
    [401, { message: 'Unauthorized' }, 'Unauthorized'],
    [409, { error: 'letter_version_conflict' }, 'letter_version_conflict'],
    [422, { error: 'cannot_rebase' }, 'cannot_rebase'],
  ] as const)('maps a documented rebase HTTP %s response to a typed error', async (status, data, backendMessage) => {
    mockPost.mockRejectedValue(
      new axios.AxiosError('Request failed', undefined, undefined, undefined, {
        status,
        statusText: 'Request failed',
        headers: {},
        config: { headers: {} } as never,
        data,
      }),
    );

    const request = backendService.rebaseLetter(7);
    await expect(request).rejects.toBeInstanceOf(RebaseLetterRequestError);
    await expect(request).rejects.toMatchObject({ status, backendMessage });
  });

  it('does not assume a stable rebase body for an unexpected server error', async () => {
    mockPost.mockRejectedValue(
      new axios.AxiosError('Server Error', undefined, undefined, undefined, {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: { headers: {} } as never,
        data: { unexpected: true },
      }),
    );

    await expect(backendService.rebaseLetter(7)).rejects.toMatchObject({
      status: 500,
      backendMessage: undefined,
      message: 'backendService.rebaseLetter: HTTP 500',
    });
  });

  it('keeps rebase network failures distinct from HTTP responses', async () => {
    mockPost.mockRejectedValue(new axios.AxiosError('Network Error'));

    await expect(backendService.rebaseLetter(7)).rejects.toMatchObject({
      status: undefined,
      backendMessage: 'Network Error',
    });
  });
});

describe('backendService.publishLetter', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('validates the documented publish response', async () => {
    mockPost.mockResolvedValue({ data: { message: 'published', letter_id: 7 } });

    await expect(backendService.publishLetter(7)).resolves.toBe(true);
  });

  it('rejects an invalid publish response', async () => {
    mockPost.mockResolvedValue({ data: { message: 'published', letter_id: '7' } });

    await expect(backendService.publishLetter(7)).rejects.toThrow();
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

describe('backendService mutation response contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates reset responses', async () => {
    mockDelete.mockResolvedValue({ data: { success: true, message: 'reset' } });

    await expect(backendService.resetLetter(7)).resolves.toBe(true);
  });

  it('rejects unsuccessful reset responses', async () => {
    mockDelete.mockResolvedValue({ data: { success: false, message: 'reset failed' } });

    await expect(backendService.resetLetter(7)).rejects.toThrow('reset failed');
  });

  it.each(['undoLetterChange', 'redoLetterChange'] as const)('validates %s responses while preserving UTF-8 content', async (operation) => {
    mockPost.mockResolvedValue({
      data: {
        content: '<TEI>ÄÖÜ äöü ß – Ελληνικά 中文 🙂</TEI>',
        undo_available: true,
        redo_available: false,
      },
    });

    await expect(backendService[operation](7)).resolves.toBe(true);
  });

  it.each(['undoLetterChange', 'redoLetterChange'] as const)('rejects invalid %s responses', async (operation) => {
    mockPost.mockResolvedValue({
      data: { content: '<TEI/>', undo_available: 'true', redo_available: false },
    });

    await expect(backendService[operation](7)).rejects.toThrow();
  });
});
