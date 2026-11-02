import { fetchAndMapPersonEntityData, fetchMetamwEntityData, fetchMetamwLetterData } from '@src/services/auto_anno/apiMetaMw.service';

const getMock = jest.fn();

jest.mock('@src/services/apiRequest.service', () => ({
  __esModule: true,
  default: { initApi: () => ({ get: getMock }) },
}));

const lifecycle = {
  capabilities: {
    rename: { allowed: true, reason_code: null },
    discard: { allowed: true, reason_code: null },
  },
  version: 'a'.repeat(64),
};

const personDetails = {
  id: 1,
  key: 'PSN0000001',
  full_name: 'Mendelssohn Bartholdy, Felix // Mendelssohn, Felix',
  display_name: 'Felix Mendelssohn Bartholdy',
  birth_date: '1809-02-03',
  death_date: '1847-11-04',
  birth_alt: null,
  death_alt: null,
  birth: null,
  baptism: null,
  baptism_date: null,
  place_of_birth: 'Hamburg',
  place_of_death: 'Leipzig',
  background: null,
  married_to: null,
  gender: 'male',
  death: null,
  relation: 'https://example.test/person/1',
  volumes: null,
  msb_supplement: null,
};

const settlementDetails = {
  id: 2,
  key: 'STM0000001',
  name: 'Leipzig',
  info: null,
  notes: null,
  kind: 'city',
  country: { name: 'Deutschland' },
  country_name: 'Deutschland',
  gnd: null,
};

describe('apiMetaMw.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('encodes entity and letter keys as path segments', async () => {
    getMock.mockResolvedValueOnce({ data: personDetails }).mockResolvedValueOnce({
      data: {
        id: 123,
        name: 'fmb/ä 1',
        title: null,
        xml_content: null,
        ...lifecycle,
      },
    });

    await fetchMetamwEntityData('PSN/ä 1');
    await fetchMetamwLetterData('fmb/ä 1');

    expect(getMock).toHaveBeenCalledWith('/jwt/misc/entities/PSN%2F%C3%A4%201');
    expect(getMock).toHaveBeenCalledWith('/jwt/editor/letters/by_name/fmb%2F%C3%A4%201');
  });

  it('validates and returns entity details for a supported key prefix', async () => {
    getMock.mockResolvedValue({ data: settlementDetails, status: 200 });

    await expect(fetchMetamwEntityData('STM0000001')).resolves.toEqual(settlementDetails);
  });

  it('maps a validated person transport response', async () => {
    getMock.mockResolvedValue({ data: personDetails, status: 200 });

    await expect(fetchAndMapPersonEntityData('PSN0000001')).resolves.toEqual({
      fullName: 'Mendelssohn Bartholdy, Felix',
      birthDate: '1809-02-03',
      deathDate: '1847-11-04',
      placeOfBirth: 'Hamburg',
      placeOfDeath: 'Leipzig',
      wikiLink: 'https://example.test/person/1',
    });
  });

  it('rejects malformed entity detail responses', async () => {
    getMock.mockResolvedValue({ data: { id: '2', key: 'STM0000001' }, status: 200 });

    await expect(fetchMetamwEntityData('STM0000001')).rejects.toThrow();
  });

  it.each([401, 422])('propagates an HTTP %s entity detail error', async (status) => {
    const error = { response: { status, data: { error: 'request_failed' } } };
    getMock.mockRejectedValue(error);

    await expect(fetchMetamwEntityData('STM0000001')).rejects.toBe(error);
  });

  it('returns the serialized letter for a successful exact-name lookup', async () => {
    const letter = {
      id: 123,
      name: 'fmb-1801-06-06-01',
      title: 'Beispieltitel',
      xml_content: '<TEI>...</TEI>',
      ...lifecycle,
    };
    getMock.mockResolvedValue({ data: letter, status: 200 });

    await expect(fetchMetamwLetterData(letter.name)).resolves.toEqual(letter);
    expect(getMock).toHaveBeenCalledWith('/jwt/editor/letters/by_name/fmb-1801-06-06-01');
  });

  it('treats a 404 response as an available letter name', async () => {
    getMock.mockRejectedValue({
      response: {
        status: 404,
        data: { error: 'letter_not_found' },
      },
    });

    await expect(fetchMetamwLetterData('fmb-1801-06-06-01')).resolves.toBeNull();
  });

  it('does not treat an undocumented 404 response as an available name', async () => {
    const error = {
      response: {
        status: 404,
        data: { error: 'unexpected_not_found' },
      },
    };
    getMock.mockRejectedValue(error);

    await expect(fetchMetamwLetterData('fmb-1801-06-06-01')).rejects.toBe(error);
  });

  it.each([401, 422, 500])('does not treat an HTTP %s response as an available name', async (status) => {
    const error = { response: { status, data: { error: 'request_failed' } } };
    getMock.mockRejectedValue(error);

    await expect(fetchMetamwLetterData('fmb-1801-06-06-01')).rejects.toBe(error);
  });

  it('rejects a malformed successful exact-name response', async () => {
    getMock.mockResolvedValue({
      data: {
        id: '123',
        name: 'fmb-1801-06-06-01',
        title: null,
        xml_content: null,
        ...lifecycle,
      },
      status: 200,
    });

    await expect(fetchMetamwLetterData('fmb-1801-06-06-01')).rejects.toThrow();
  });

  it('does not treat a network error as an available name', async () => {
    const error = new Error('network down');
    getMock.mockRejectedValue(error);

    await expect(fetchMetamwLetterData('fmb-1801-06-06-01')).rejects.toBe(error);
  });
});
