import { EntityType } from '@src/constants/editor';
import { searchEditortEntities } from '@src/services/editor/apiLetterRequest.service';

const postMock = jest.fn();

jest.mock('@src/services/apiRequest.service', () => ({
  __esModule: true,
  default: {
    initApi: () => ({ post: postMock }),
  },
}));

describe('apiLetterRequest.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [EntityType.PERSON, 'person'],
    [EntityType.SETTLEMENT, 'settlement'],
    [EntityType.SIGHT, 'sight'],
    [EntityType.INSTITUTION, 'institution'],
    [EntityType.CREATION, 'creation'],
    [EntityType.PROTAG_CREATION, 'protag_creation'],
  ])('reads %s results from the category-specific entries collection', async (entityType, responseKey) => {
    const entry = {
      id: 18613,
      entityKey: 'PSN0000001',
      entityName: 'Mendelssohn Bartholdy, Jacob Ludwig Felix',
      entityLastName: 'Mendelssohn Bartholdy',
      entityFirstName: 'Jacob Ludwig Felix',
    };
    postMock.mockResolvedValue({
      data: {
        id: null,
        first_tab: responseKey,
        [responseKey]: { entries: [entry] },
      },
    });

    await expect(searchEditortEntities('bartholdy felix', entityType)).resolves.toEqual([
      {
        entityId: 18613,
        entityType,
        entityKey: 'PSN0000001',
        entityName: 'Mendelssohn Bartholdy, Jacob Ludwig Felix',
        entityLastName: entityType === EntityType.PERSON ? 'Mendelssohn Bartholdy' : undefined,
        entityFirstName: entityType === EntityType.PERSON ? 'Jacob Ludwig Felix' : undefined,
        entityDisplayName: 'Mendelssohn Bartholdy, Jacob Ludwig Felix',
        extraData: {},
      },
    ]);
    expect(postMock).toHaveBeenCalledWith(
      '/jwt/editor/entities/search?per_page=20',
      {
        search_data: {
          entity_type: entityType,
          search_value: 'bartholdy felix',
        },
      },
      { headers: { 'Content-Type': 'application/json' } },
    );
  });

  it('returns an empty array for a documented empty category', async () => {
    postMock.mockResolvedValue({
      data: { id: null, first_tab: 'person', person: { entries: [] } },
    });

    await expect(searchEditortEntities(null, EntityType.PERSON)).resolves.toEqual([]);
  });

  it('rejects a response that omits the requested category', async () => {
    postMock.mockResolvedValue({
      data: { id: null, first_tab: 'person', person: { entries: [] } },
    });

    await expect(searchEditortEntities('Leipzig', EntityType.SETTLEMENT)).rejects.toThrow(
      'Entity search response is missing category: settlement',
    );
  });
});
