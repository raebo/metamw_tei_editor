import { EntityType } from '@src/constants/editor';
import { fetchEntityKey, letterContent, letterExists, searchEditortEntities } from '@src/services/editor/apiLetterRequest.service';

const postMock = jest.fn();
const getMock = jest.fn();

jest.mock('@src/services/apiRequest.service', () => ({
  __esModule: true,
  default: {
    initApi: () => ({ get: getMock, post: postMock }),
  },
}));

describe('apiLetterRequest.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates the documented letter-exists boolean response', async () => {
    getMock.mockResolvedValue({ data: false });

    await expect(letterExists('fmb/1840')).resolves.toBe(false);
    expect(getMock).toHaveBeenCalledWith('/jwt/editor/letters/fmb%2F1840/exists');
  });

  it('rejects an invalid letter-exists response instead of treating it as a boolean', async () => {
    getMock.mockResolvedValue({ data: 'false' });

    await expect(letterExists('17420')).rejects.toThrow();
  });

  it('propagates letter-exists transport failures instead of reporting a missing letter', async () => {
    getMock.mockRejectedValue(new Error('Network error'));

    await expect(letterExists('17420')).rejects.toThrow('Network error');
  });

  it.each([
    ['<TEI/>', '<TEI/>'],
    [null, null],
  ])('accepts the documented XML content response %p', async (responseData, expected) => {
    getMock.mockResolvedValue({ data: responseData });

    await expect(letterContent(17420)).resolves.toBe(expected);
    expect(getMock).toHaveBeenCalledWith('/jwt/editor/letters/17420/xml_content');
  });

  it('rejects an invalid XML content response', async () => {
    getMock.mockResolvedValue({ data: { xml_content: '<TEI/>' } });

    await expect(letterContent(17420)).rejects.toThrow();
  });

  it('validates the documented entity-key response', async () => {
    getMock.mockResolvedValue({ data: { entity_key: 'PSN0000001' } });

    await expect(fetchEntityKey(EntityType.PERSON)).resolves.toBe('PSN0000001');
    expect(getMock).toHaveBeenCalledWith('/jwt/editor/entities/fetch_entity_key', {
      params: { entity_type: 'person' },
    });
  });

  it('rejects an entity-key response without entity_key', async () => {
    getMock.mockResolvedValue({ data: {} });

    await expect(fetchEntityKey(EntityType.PERSON)).rejects.toThrow();
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
