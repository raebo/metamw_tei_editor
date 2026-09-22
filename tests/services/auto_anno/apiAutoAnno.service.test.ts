import {
  fetchAutoAnnoJobs,
  fetchAutoAnnoLetter,
  searchAutoAnnoSnippetEntities,
  fetchAutoAnnoSnippetEntityData,
  updateAnnoLetterContent,
} from '@src/services/auto_anno/apiAutoAnno.service';

const mockGet = jest.fn();
const mockPatch = jest.fn();

jest.mock('@src/services/apiRequest.service', () => ({
  __esModule: true,
  default: {
    initApi: () => ({ get: mockGet, patch: mockPatch }),
  },
}));

describe('apiAutoAnno.service', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPatch.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const validJob = {
    id: 1,
    name: 'Job 1',
    status: 'open',
    search_string: 'Goethe',
    updated_at: '2026-01-01T12:00:00+01:00',
    letters_count: 3,
    snippets_count: 5,
    letters_open: 1,
    letters_closed: 2,
    snippets_open: 2,
    snippets_closed: 3,
  };

  it('gibt Jobs zurueck, wenn die API-Antwort dem erwarteten Schema entspricht', async () => {
    mockGet.mockResolvedValue({ data: [validJob] });

    const result = await fetchAutoAnnoJobs();

    expect(result).toEqual([validJob]);
  });

  it('behaelt search_string und updated_at, die AutoAnnoList.tsx rendert (Zod entfernt sonst unbekannte Felder)', async () => {
    mockGet.mockResolvedValue({ data: [validJob] });

    const result = await fetchAutoAnnoJobs();

    expect(result?.[0]?.search_string).toBe('Goethe');
    expect(result?.[0]?.updated_at).toBe('2026-01-01T12:00:00+01:00');
  });

  it('gibt undefined zurueck (statt ungueltiger Daten), wenn die API-Antwort vom Schema abweicht', async () => {
    mockGet.mockResolvedValue({ data: [{ ...validJob, letters_count: 'drei' }] });

    const result = await fetchAutoAnnoJobs();

    expect(result).toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it('akzeptiert null als xml_content_updated fuer einen Brief', async () => {
    mockGet.mockResolvedValue({
      data: {
        id: 1,
        letter_name: 'Brief 1',
        status: 'open',
        xml_content: '<div/>',
        xml_content_updated: null,
        content_changed: false,
        snippets_count: 0,
        snippets_open: 0,
        snippets_closed: 0,
        locking_user: null,
        updated_at: '2026-01-01T00:00:00Z',
      },
    });

    const result = await fetchAutoAnnoLetter(1);

    expect(result?.xml_content_updated).toBeNull();
  });

  it('kodiert den Suchtext bei der Entitaetssuche und liefert validierte Treffer', async () => {
    mockGet.mockResolvedValue({
      data: {
        person: {
          entries: [
            {
              entityId: 1,
              entityType: 'Person',
              entityKey: 'p1',
              entityName: 'Max Mustermann',
              entityDisplayName: 'Max Mustermann',
              extraData: {},
            },
          ],
        },
      },
    });

    const result = await searchAutoAnnoSnippetEntities(7, 'a/b#c', 'Person');

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('/search_entity/a%2Fb%23c/person'),
    );
    expect(result).toHaveLength(1);
  });

  it('wirft einen Fehler, wenn Suchtreffer nicht dem erwarteten Schema entsprechen', async () => {
    mockGet.mockResolvedValue({
      data: { person: { entries: [{ entityId: 'not-a-number' }] } },
    });

    await expect(searchAutoAnnoSnippetEntities(7, 'test', 'Person')).rejects.toThrow(
      'Error fetching data for search entity',
    );
  });

  it('kodiert den entityKey und mappt snake_case auf camelCase', async () => {
    mockGet.mockResolvedValue({
      data: {
        entity_id: 1,
        entity_key: 'k/1',
        entity_type: 'Person',
        entity_name: 'Max Mustermann',
        entity_display_name: 'Max Mustermann',
        extra_data: {},
      },
    });

    const result = await fetchAutoAnnoSnippetEntityData(7, 3, 'k/1', 'Person');

    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/entity_data/person/k%2F1'));
    expect(result).toEqual(
      expect.objectContaining({ entityId: 1, entityKey: 'k/1', entityType: 'Person' }),
    );
  });

  it('sendet nur wohlgeformtes XML und veraendert keine Auto-Anno-Attribute', async () => {
    mockPatch.mockResolvedValue({});
    const xmlContent = '<TEI><text tmp_id="backend-value">Brief</text></TEI>';

    await expect(updateAnnoLetterContent(7, xmlContent)).resolves.toBe(true);
    expect(mockPatch).toHaveBeenCalledWith('/jwt/automatic_annotation_letters/7/set_xml_content', {
      xmlContent,
    });
  });

  it('sendet ungueltiges XML nicht an das Auto-Anno-Backend', async () => {
    await expect(updateAnnoLetterContent(7, '<TEI><text></TEI>')).rejects.toThrow(
      'XML content is not well-formed.',
    );
    expect(mockPatch).not.toHaveBeenCalled();
  });
});
