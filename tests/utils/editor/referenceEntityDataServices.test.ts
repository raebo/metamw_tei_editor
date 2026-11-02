import { EntityType } from '@src/constants/editor';
import { creationDataService } from '@src/utils/editor/creationDataService';
import { JwtMiscRequestError } from '@src/utils/editor/jwtMiscRequestError';
import { protagCreationDataService } from '@src/utils/editor/protagCreationDataService';

const mockGet = jest.fn();

jest.mock('@src/services/apiRequest.service', () => ({
  initApi: () => ({ get: mockGet }),
}));

describe('reference entity data services', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('validates and maps the documented protagonist person response', async () => {
    mockGet.mockResolvedValue({
      data: {
        id: 1,
        key: 'PSN0000001',
        display_name: 'Felix Mendelssohn Bartholdy',
      },
    });

    await expect(protagCreationDataService.fetchProtagPersonData()).resolves.toEqual({
      entityId: 1,
      entityKey: 'PSN0000001',
      entityName: 'Felix Mendelssohn Bartholdy',
      entityDisplayName: 'Felix Mendelssohn Bartholdy',
      entityType: EntityType.PERSON,
      extraData: {},
    });
    expect(mockGet).toHaveBeenCalledWith('/jwt/misc/person/protagonist_data');
  });

  it('rejects a malformed protagonist person success response', async () => {
    mockGet.mockResolvedValue({ data: { id: 1, display_name: 'Missing key' } });

    await expect(protagCreationDataService.fetchProtagPersonData()).rejects.toMatchObject({
      name: 'ZodError',
    });
  });

  it.each([
    [401, { message: 'Unauthorized' }, 'Unauthorized'],
    [404, { error: 'protagonist_not_found' }, 'protagonist_not_found'],
  ] as const)('maps protagonist HTTP %s responses to typed errors', async (status, data, backendMessage) => {
    mockGet.mockRejectedValue({ response: { status, data } });

    await expect(protagCreationDataService.fetchProtagPersonData()).rejects.toMatchObject({
      operation: 'protagCreationDataService.fetchProtagPersonData',
      status,
      backendMessage,
    });
  });

  it('validates and maps documented creation authors including nullable names', async () => {
    mockGet.mockResolvedValue({
      data: [
        {
          id: 2,
          key: 'PSN0000002',
          first_name: null,
          last_name: 'Bach',
          display_name: 'Bach',
        },
      ],
    });

    await expect(creationDataService.fetchCreationAuthors('CRT/1')).resolves.toEqual([
      {
        entityId: 2,
        entityKey: 'PSN0000002',
        entityName: 'Bach',
        entityFirstName: undefined,
        entityLastName: 'Bach',
        entityDisplayName: 'Bach',
        entityType: EntityType.PERSON,
        extraData: {},
      },
    ]);
    expect(mockGet).toHaveBeenCalledWith('/jwt/misc/creation/CRT%2F1/authors');
  });

  it('maps documented creation-author errors without assuming a stable server-error body', async () => {
    mockGet.mockRejectedValue({
      response: { status: 422, data: { error: 'invalid_creation_key' } },
    });

    const request = creationDataService.fetchCreationAuthors('invalid');
    await expect(request).rejects.toBeInstanceOf(JwtMiscRequestError);
    await expect(request).rejects.toMatchObject({
      operation: 'creationDataService.fetchCreationAuthors',
      status: 422,
      backendMessage: 'invalid_creation_key',
    });
  });

  it('keeps a creation-author network failure distinct from HTTP responses', async () => {
    mockGet.mockRejectedValue(Object.assign(new Error('Network Error'), { isAxiosError: true }));

    await expect(creationDataService.fetchCreationAuthors('CRT0000001')).rejects.toMatchObject({
      operation: 'creationDataService.fetchCreationAuthors',
      status: undefined,
      backendMessage: 'Network Error',
    });
  });
});
