import { EntityType } from '@src/constants/editor';
import {
  extractLetterCreationSuggestions,
  extractLetterPersonSuggestions,
  extractLetterPlaceSuggestions,
  extractLetterProtagCreationSuggestions,
  LetterPlaceEntityType,
} from '@src/utils/editor/letterEntitySuggestions';

describe('extractLetterPersonSuggestions', () => {
  const xml = `
    <TEI xmlns="http://www.tei-c.org/ns/1.0">
      <teiHeader>
        <fileDesc>
          <titleStmt>
            <name data-key="PSN9999999">Projektname</name>
          </titleStmt>
        </fileDesc>
        <profileDesc>
          <correspDesc>
            <correspAction type="sent">
              <persName data-key="PSN0000002" resp="author">Clara Beispiel</persName>
            </correspAction>
            <correspAction type="received">
              <persName data-key="PSN0000001" resp="receiver">Felix Mendelssohn Bartholdy</persName>
            </correspAction>
          </correspDesc>
        </profileDesc>
      </teiHeader>
      <text>
        <body>
          <div type="act_of_writing">
            <docAuthor data-key="PSN0000002" resp="writer">Clara Beispiel</docAuthor>
            <p>
              Lieber
              <persName><name data-key="PSN0000001">Felix Mendelssohn Bartholdy</name></persName>
              und <persName data-key="PSN0000003">Anna Beispiel</persName>.
              <persName data-key="not_yet_determined">Unbekannt</persName>
              <persName>Ohne Schlüssel</persName>
            </p>
          </div>
        </body>
      </text>
    </TEI>
  `;

  it('returns keyed people once and merges their contexts', () => {
    expect(extractLetterPersonSuggestions(xml)).toEqual([
      {
        entityKey: 'PSN0000003',
        entityName: 'Anna Beispiel',
        entityType: EntityType.PERSON,
        contexts: ['mentioned'],
      },
      {
        entityKey: 'PSN0000002',
        entityName: 'Clara Beispiel',
        entityType: EntityType.PERSON,
        contexts: ['author', 'writer'],
      },
      {
        entityKey: 'PSN0000001',
        entityName: 'Felix Mendelssohn Bartholdy',
        entityType: EntityType.PERSON,
        contexts: ['receiver', 'mentioned'],
      },
    ]);
  });

  it('ignores keyed names outside relevant person and correspondence structures', () => {
    const suggestions = extractLetterPersonSuggestions(xml);

    expect(suggestions).not.toEqual(expect.arrayContaining([expect.objectContaining({ entityKey: 'PSN9999999' })]));
  });

  it('rejects malformed XML', () => {
    expect(() => extractLetterPersonSuggestions('<TEI><text></TEI>')).toThrow('Error parsing XML');
  });
});

describe('extractLetterCreationSuggestions', () => {
  const xml = `
    <TEI xmlns="http://www.tei-c.org/ns/1.0">
      <teiHeader>
        <fileDesc>
          <titleStmt>
            <title data-key="fmb-1821-01-01-01" type="precursor">Briefreferenz</title>
          </titleStmt>
        </fileDesc>
      </teiHeader>
      <text>
        <body>
          <p>
            <title>
              Der Freischütz
              <name data-key="PSN0000001" type="author">Carl Maria von Weber</name>
              <name data-key="CRT0000001" type="music">Der Freischütz op. 77</name>
            </title>
            <title>
              Freischütz
              <name data-key="CRT0000001" type="music">Der Freischütz op. 77</name>
            </title>
            <title>
              Protagonistenwerk
              <name data-key="PRC0000001" type="music">Protagonistenwerk</name>
            </title>
            <name data-key="CRT0000002" type="literature">Kein title-Elternknoten</name>
            <title><name type="art">Werk ohne Schlüssel</name></title>
          </p>
        </body>
      </text>
    </TEI>
  `;

  it('returns keyed general works from body titles once', () => {
    expect(extractLetterCreationSuggestions(xml)).toEqual([
      {
        entityKey: 'CRT0000001',
        entityName: 'Der Freischütz op. 77',
        entityType: EntityType.CREATION,
        entityKind: 'music',
        contexts: ['mentioned'],
      },
    ]);
  });

  it('keeps letter metadata and protagonist creations out of general works', () => {
    const suggestions = extractLetterCreationSuggestions(xml);

    expect(suggestions).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ entityKey: 'fmb-1821-01-01-01' }),
        expect.objectContaining({ entityKey: 'PRC0000001' }),
      ]),
    );
  });
});

describe('extractLetterProtagCreationSuggestions', () => {
  const xml = `
    <TEI xmlns="http://www.tei-c.org/ns/1.0">
      <text>
        <body>
          <p>
            <title>
              Sommernachtstraum
              <name data-key="PSN0000001" type="author">Felix Mendelssohn Bartholdy</name>
              <name data-key="PRC0000001">Ein Sommernachtstraum<idno type="MWV">P 3</idno><idno type="op">61</idno></name>
            </title>
            <title><name data-key="PRC0000001">Ein Sommernachtstraum</name></title>
            <title><name data-key="CRT0000001" type="music">Allgemeines Werk</name></title>
          </p>
        </body>
      </text>
    </TEI>
  `;

  it('returns keyed protagonist works once without appending identifier text', () => {
    expect(extractLetterProtagCreationSuggestions(xml)).toEqual([
      {
        entityKey: 'PRC0000001',
        entityName: 'Ein Sommernachtstraum',
        entityType: EntityType.PROTAG_CREATION,
        contexts: ['mentioned'],
      },
    ]);
  });

  it('keeps general works out of protagonist works', () => {
    expect(extractLetterProtagCreationSuggestions(xml)).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ entityKey: 'CRT0000001' })]),
    );
  });
});

describe('extractLetterPlaceSuggestions', () => {
  const xml = `
    <TEI xmlns="http://www.tei-c.org/ns/1.0">
      <teiHeader>
        <fileDesc>
          <publicationStmt>
            <address><placeName><settlement data-key="STM9999999">Verlagsort</settlement></placeName></address>
          </publicationStmt>
        </fileDesc>
        <profileDesc>
          <correspDesc>
            <correspAction type="sent">
              <placeName type="writing_place">
                <settlement data-key="STM0000001">Leipzig</settlement>
                <country>Deutschland</country>
              </placeName>
            </correspAction>
            <correspAction type="received">
              <placeName type="receiving_place">
                <settlement data-key="STM0000002">Berlin</settlement>
              </placeName>
            </correspAction>
          </correspDesc>
        </profileDesc>
      </teiHeader>
      <text>
        <body>
          <p>
            <placeName>
              <settlement data-key="STM0000001">Leipzig</settlement>
            </placeName>
            <placeName data-key="STM0000003" type="settlement">Dresden</placeName>
            <placeName>
              <name data-key="SGH0000001" type="sight">Thomaskirche</name>
              <settlement>Leipzig</settlement>
            </placeName>
            <placeName>
              <name data-key="NST0000001" type="institution">Gewandhaus</name>
              <settlement>Leipzig</settlement>
            </placeName>
          </p>
        </body>
      </text>
    </TEI>
  `;

  it('returns only settlements for the settlement type and merges contexts', () => {
    expect(extractLetterPlaceSuggestions(xml, EntityType.SETTLEMENT)).toEqual([
      {
        entityKey: 'STM0000002',
        entityName: 'Berlin',
        entityType: EntityType.SETTLEMENT,
        contexts: ['receivingPlace'],
      },
      {
        entityKey: 'STM0000003',
        entityName: 'Dresden',
        entityType: EntityType.SETTLEMENT,
        contexts: ['mentioned'],
      },
      {
        entityKey: 'STM0000001',
        entityName: 'Leipzig',
        entityType: EntityType.SETTLEMENT,
        contexts: ['writingPlace', 'mentioned'],
      },
    ]);
  });

  it.each<[LetterPlaceEntityType, string, string]>([
    [EntityType.SIGHT, 'SGH0000001', 'Thomaskirche'],
    [EntityType.INSTITUTION, 'NST0000001', 'Gewandhaus'],
  ])('filters the letter list for %s', (entityType, entityKey, entityName) => {
    expect(extractLetterPlaceSuggestions(xml, entityType)).toEqual([
      {
        entityKey,
        entityName,
        entityType,
        contexts: ['mentioned'],
      },
    ]);
  });

  it('excludes settlements outside body and correspondence metadata', () => {
    const suggestions = extractLetterPlaceSuggestions(xml, EntityType.SETTLEMENT);

    expect(suggestions).not.toEqual(expect.arrayContaining([expect.objectContaining({ entityKey: 'STM9999999' })]));
  });
});
