import { EntityType } from '@src/constants/editor';
import { extractLetterPersonSuggestions } from '@src/utils/editor/letterEntitySuggestions';

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
