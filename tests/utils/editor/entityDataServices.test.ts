import { creationDataService } from '@src/utils/editor/creationDataService';
import { protagCreationDataService } from '@src/utils/editor/protagCreationDataService';

const mockGet = jest.fn();

jest.mock('@src/services/apiRequest.service', () => ({
  initApi: () => ({ get: mockGet }),
}));

describe('editor entity-data service contracts', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('validates creation authors, handles nullable names and encodes the creation key', async () => {
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

    await expect(creationDataService.fetchCreationAuthors('CRT/ä 1')).resolves.toEqual([
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
    expect(mockGet).toHaveBeenCalledWith('/jwt/misc/creation/CRT%2F%C3%A4%201/authors');
  });

  it('validates protagonist person data before mapping it to a snippet entity', async () => {
    mockGet.mockResolvedValue({
      data: { id: 5, key: 'PSN0000002', display_name: 'Felix Mendelssohn' },
    });

    await expect(protagCreationDataService.fetchProtagPersonData()).resolves.toEqual({
      entityId: 5,
      entityKey: 'PSN0000002',
      entityName: 'Felix Mendelssohn',
      entityDisplayName: 'Felix Mendelssohn',
      entityType: 'PERSON',
      extraData: {},
    });
  });

  it('rejects malformed successful entity-data responses', async () => {
    mockGet.mockResolvedValue({ data: { id: 'invalid' } });

    await expect(protagCreationDataService.fetchProtagPersonData()).rejects.toThrow();
  });
});
