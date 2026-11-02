import {
  mapApiToEditorLetter,
  mapApiToEditorLetterData,
  mapApiToExactEditorLetter,
  mapApiToPinnedLetter,
  mapRemotePersonToEntity,
} from '@src/services/mappings/editorMappings';
import { parseRemotePersonTransport } from '@src/schemas/metaMwEntityDetails';

const lifecycle = {
  capabilities: {
    rename: { allowed: true, reason_code: null },
    discard: { allowed: true, reason_code: null },
  },
  version: 'a'.repeat(64),
};

describe('editor letter mappings', () => {
  it('accepts the canonical numeric ID from pinned index and pinned show responses', () => {
    expect(
      mapApiToPinnedLetter({
        id: 17420,
        name: 'fmb-1840-06-06-01',
        content_changed: false,
        xml_content_current: null,
        ...lifecycle,
      }),
    ).toEqual(
      expect.objectContaining({
        id: 17420,
        capabilities: {
          rename: { allowed: true, reasonCode: null },
          discard: { allowed: true, reasonCode: null },
        },
      }),
    );

    expect(
      mapApiToEditorLetterData({
        id: 17420,
        name: 'fmb-1840-06-06-01',
        title: null,
        xml_content: '<TEI/>',
        undo_available: false,
        redo_available: false,
        ...lifecycle,
      }).id,
    ).toBe(17420);
  });

  it('rejects the former string ID representation', () => {
    expect(() =>
      mapApiToPinnedLetter({
        id: '17420',
        name: 'fmb-1840-06-06-01',
        content_changed: false,
        xml_content_current: null,
        ...lifecycle,
      }),
    ).toThrow();
  });

  it('maps nullable index and exact-letter fields only after contract validation', () => {
    expect(
      mapApiToEditorLetter({
        id: 17420,
        name: 'fmb-1840-06-06-01',
        title: null,
        updated_at: null,
        ...lifecycle,
      }),
    ).toEqual(
      expect.objectContaining({
        title: '',
        updatedAt: new Date(0),
        xmlContent: undefined,
      }),
    );

    expect(
      mapApiToExactEditorLetter({
        id: 17420,
        name: 'fmb-1840-06-06-01',
        title: null,
        xml_content: null,
        ...lifecycle,
      }),
    ).toEqual(expect.objectContaining({ title: '', xmlContent: undefined }));
  });

  it('requires fields that OpenAPI marks as required even when their value is nullable', () => {
    expect(() =>
      mapApiToPinnedLetter({
        id: 17420,
        name: 'fmb-1840-06-06-01',
        content_changed: false,
        ...lifecycle,
      }),
    ).toThrow();

    expect(() =>
      mapApiToEditorLetter({
        id: 17420,
        name: 'fmb-1840-06-06-01',
        title: null,
        ...lifecycle,
      }),
    ).toThrow();
  });
});

describe('remote person mapping', () => {
  const person = {
    id: 1,
    key: 'PSN0000001',
    full_name: 'Mendelssohn Bartholdy, Felix // Mendelssohn, Felix',
    display_name: 'Felix Mendelssohn Bartholdy',
    birth_date: null,
    death_date: null,
    birth_alt: null,
    death_alt: null,
    birth: null,
    baptism: null,
    baptism_date: null,
    place_of_birth: null,
    place_of_death: null,
    background: null,
    married_to: null,
    gender: null,
    death: null,
    relation: null,
    volumes: null,
    msb_supplement: null,
  };

  it('maps a validated transport object and preserves nullable values', () => {
    expect(mapRemotePersonToEntity(parseRemotePersonTransport(person))).toEqual({
      fullName: 'Mendelssohn Bartholdy, Felix',
      birthDate: null,
      deathDate: null,
      placeOfBirth: null,
      placeOfDeath: null,
      wikiLink: undefined,
    });
  });

  it('rejects malformed person transport values before mapping', () => {
    expect(() => parseRemotePersonTransport({ ...person, birth_date: 1809 })).toThrow();
  });
});
