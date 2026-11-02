import {
  fetchAutoAnnoJobs,
  fetchAutoAnnoLetter,
  fetchAutoAnnoJobLetters,
  fetchAutoAnnoLetterSnippets,
  patchAutoAnnoLetterLockingUser,
  searchAutoAnnoSnippetEntities,
  fetchAutoAnnoSnippetEntityData,
  updateAnnoLetterContent,
  setAutoAnnoSnippetStatus,
  setAnnoSnippetEntity,
  writeAnnoLetter,
  resetAnnoLetter,
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
    service_identifier: 'Job 1',
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

    expect(result).toEqual([expect.objectContaining({ id: 1, name: 'Job 1', status: 'open', search_string: 'Goethe' })]);
  });

  it('behaelt search_string und updated_at, die AutoAnnoList.tsx rendert (Zod entfernt sonst unbekannte Felder)', async () => {
    mockGet.mockResolvedValue({ data: [validJob] });

    const result = await fetchAutoAnnoJobs();

    expect(result?.[0]?.search_string).toBe('Goethe');
    expect(result?.[0]?.updated_at).toBe('2026-01-01T12:00:00+01:00');
  });

  it('verwirft ungueltige Job-Antworten, statt sie als leere Daten zu behandeln', async () => {
    mockGet.mockResolvedValue({ data: [{ ...validJob, letters_count: 'drei' }] });

    await expect(fetchAutoAnnoJobs()).rejects.toThrow();
  });

  it('liest Listen- und Detailantworten mit ihren unterschiedlichen Vertragsschemas', async () => {
    const listEntry = {
      id: 1,
      letter_auto_anno_job_id: 9,
      letter_name: 'Brief 1',
      status: 2,
      snippets_count: 0,
      snippets_open: 0,
      snippets_closed: 0,
      locking_user: null,
    };
    mockGet.mockResolvedValueOnce({ data: [listEntry] }).mockResolvedValueOnce({
      data: { ...listEntry, xml_content: null, content_changed: false },
    });

    await expect(fetchAutoAnnoJobLetters(9)).resolves.toEqual([expect.objectContaining({ letter_auto_anno_job_id: 9, status: '2' })]);
    await expect(fetchAutoAnnoLetter(1)).resolves.toEqual(expect.objectContaining({ xml_content: null, content_changed: false }));
  });

  it('akzeptiert nullable Snippet-Felder und normalisiert sie fuer die bestehende UI', async () => {
    mockGet.mockResolvedValue({
      data: [
        {
          id: 3,
          xml_id: null,
          letter_auto_anno_letter_id: 1,
          status: 0,
          references: [{ id: 4, key: 'PSN1', name: null, type: 'person' }],
          reference_key_final: null,
          reference_type_final: null,
          reference_name_final: null,
        },
      ],
    });

    await expect(fetchAutoAnnoLetterSnippets(1)).resolves.toEqual([
      expect.objectContaining({
        xml_id: '',
        status: '0',
        reference_key_final: '',
        references: [expect.objectContaining({ name: '' })],
      }),
    ]);
  });

  it('sendet den Locking-Benutzer im dokumentierten Request-Wrapper', async () => {
    mockPatch.mockResolvedValue({ data: { status: 'updated' } });

    await expect(patchAutoAnnoLetterLockingUser(7, 12)).resolves.toBe(true);

    expect(mockPatch).toHaveBeenCalledWith('/jwt/automatic_annotation_letters/7/set_locking_user', {
      automatic_anno_letter: { userId: 12 },
    });
  });

  it('kodiert den Suchtext bei der Entitaetssuche und liefert validierte Treffer', async () => {
    mockGet.mockResolvedValue({
      data: {
        person: {
          entries: [
            {
              id: 1,
              entityKey: 'p1',
              entityName: 'Max Mustermann',
              entityFirstName: 'Max',
              entityLastName: 'Mustermann',
            },
          ],
        },
        id: null,
        first_tab: 'person',
      },
    });

    const result = await searchAutoAnnoSnippetEntities(7, 'a/b#c', 'Person');

    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/search_entity/a%2Fb%23c/person'));
    expect(result).toHaveLength(1);
  });

  it('wirft einen Fehler, wenn Suchtreffer nicht dem erwarteten Schema entsprechen', async () => {
    mockGet.mockResolvedValue({
      data: {
        id: null,
        first_tab: 'person',
        person: { entries: [{ id: 'not-a-number' }] },
      },
    });

    await expect(searchAutoAnnoSnippetEntities(7, 'test', 'Person')).rejects.toThrow('Error fetching data for search entity');
  });

  it('kodiert den entityKey und mappt snake_case auf camelCase', async () => {
    mockGet.mockResolvedValue({
      data: {
        entity_id: 1,
        entity_key: 'k/1',
        entity_type: 'Person',
        entity_name: 'Max Mustermann',
        entity_display_name: 'Max Mustermann',
        entity_settlement_kind: null,
        entity_place_country_name: false,
        entity_kind: null,
        extra_data: false,
      },
    });

    const result = await fetchAutoAnnoSnippetEntityData(7, 3, 'k/1', 'Person');

    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/entity_data/person/k%2F1'));
    expect(result).toEqual(expect.objectContaining({ entityId: 1, entityKey: 'k/1', entityType: 'Person' }));
  });

  it('sendet nur wohlgeformtes XML und veraendert keine Auto-Anno-Attribute', async () => {
    mockPatch.mockResolvedValue({ data: { status: 'updated' } });
    const xmlContent = '<TEI><text tmp_id="backend-value">Brief</text></TEI>';

    await expect(updateAnnoLetterContent(7, xmlContent)).resolves.toBe(true);
    expect(mockPatch).toHaveBeenCalledWith('/jwt/automatic_annotation_letters/7/set_xml_content', {
      xmlContent,
    });
  });

  it('sendet ungueltiges XML nicht an das Auto-Anno-Backend', async () => {
    await expect(updateAnnoLetterContent(7, '<TEI><text></TEI>')).rejects.toThrow('XML content is not well-formed.');
    expect(mockPatch).not.toHaveBeenCalled();
  });

  it('validiert die Statusantworten aller Auto-Anno-Mutationen', async () => {
    mockPatch.mockResolvedValue({ data: { status: 'updated' } });

    await expect(patchAutoAnnoLetterLockingUser(7, null)).resolves.toBe(true);
    await expect(setAutoAnnoSnippetStatus(7, 3, 'ACCEPTED')).resolves.toBe(true);
    await expect(updateAnnoLetterContent(7, '<TEI><text>Brief</text></TEI>')).resolves.toBe(true);
    await expect(setAnnoSnippetEntity(7, 3, 'Person', 'PSN0000001')).resolves.toBe(true);
    await expect(writeAnnoLetter(7)).resolves.toBe(true);
    await expect(resetAnnoLetter(7)).resolves.toBe(true);
  });

  it.each([
    ['locking user', () => patchAutoAnnoLetterLockingUser(7, null)],
    ['snippet status', () => setAutoAnnoSnippetStatus(7, 3, 'REJECTED')],
    ['XML content', () => updateAnnoLetterContent(7, '<TEI><text>Brief</text></TEI>')],
    ['snippet entity', () => setAnnoSnippetEntity(7, 3, 'Person', 'PSN0000001')],
    ['write letter', () => writeAnnoLetter(7)],
    ['reset letter', () => resetAnnoLetter(7)],
  ])('lehnt eine ungueltige %s-Erfolgsantwort ab', async (_operation, request) => {
    mockPatch.mockResolvedValue({ data: { success: true } });

    await expect(request()).rejects.toThrow();
  });
});
