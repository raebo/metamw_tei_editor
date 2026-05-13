import { EditorUtils } from '@src/utils/editor'; // Adjust the path based on your project structure
import { pathMatchesWithWildcard } from '@src/utils/editor/xmlCheck'; // Adjust the path based on your project structure

describe('pathMatchesWithWildcard', () => {
  const testCases = [
    // Exakter Match ohne Wildcard
    {
      full: 'tei text body div p persname',
      pattern: 'tei text body div p persname',
      expected: true,
    },
    {
      full: 'tei text body div p persname',
      pattern: 'tei text body div p placename',
      expected: false,
    },

    // Wildcard matcht 0 Segmente
    {
      full: 'tei text body div p persname',
      pattern: 'tei text body div p * persname',
      expected: true,
    },

    // Wildcard matcht 1 Segment
    {
      full: 'tei text body div p app persname',
      pattern: 'tei text body div p * persname',
      expected: true,
    },

    // Wildcard matcht 2 Segmente
    {
      full: 'tei text body div p app lem persname',
      pattern: 'tei text body div p * persname',
      expected: true,
    },

    // Endet auf "name", nicht auf "persname" → kein Match
    {
      full: 'tei text body div p app lem persname name',
      pattern: 'tei text body div p * persname',
      expected: false,
    },

    // Wildcard + letztes Segment "name"
    {
      full: 'tei text body div p app lem persname name',
      pattern: 'tei text body div p * persname name',
      expected: true,
    },

    // Mehrere Wildcards
    {
      full: 'tei text body div p app lem persname name',
      pattern: 'tei * div p * persname name',
      expected: true,
    },
  ];

  testCases.forEach(({ full, pattern, expected }, index) => {
    test(`Test ${index + 1}: "${pattern}" against "${full}"`, () => {
      expect(pathMatchesWithWildcard(full, pattern)).toBe(expected);
    });
  });
});

describe('EditorUtils.xmlCheck.checkSelectionRestrictedTags', () => {
  let xmlDoc: Document;
  const xmlString = `
        <TEI xmlns="http://www.tei-c.org/ns/1.0">
            <teiHeader>
                <title>Test Title</title>
            </teiHeader>
            <teiBody>
                <text type="letter">
                    <body>
                        <div type="act_of_writing">
                            <p>Normal text <hi rend="latintype">Highlighted</hi> inside.</p>
                            <p>Another line with <persName>John Doe</persName>.</p>
                        </div>
                    </body>
                </text>
            </teiBody>
        </TEI>
    `;

  beforeEach(() => {
    const parser = new DOMParser();
    xmlDoc = parser.parseFromString(xmlString, 'application/xml');
  });

  test('should return true for selection outside restricted tags', () => {
    const selectionStart = 10; // "Normal text" part
    const selectionEnd = 22;
    const restrictedTags = ['teiHeader'];

    expect(
      EditorUtils.xmlCheck.checkSelectionRestrictedTags(
        xmlDoc,
        selectionStart,
        selectionEnd,
        restrictedTags,
      ),
    ).toBe(false);
  });

  test('should return false for selection overlapping <hi>', () => {
    const selectionStart = 15; // Overlapping "Highlighted"
    const selectionEnd = 35;
    const restrictedTags = ['teiHeader', 'persName', 'hi'];

    expect(
      EditorUtils.xmlCheck.checkSelectionRestrictedTags(
        xmlDoc,
        selectionStart,
        selectionEnd,
        restrictedTags,
      ),
    ).toBe(false);
  });

  test('should return false for selection inside <persName>', () => {
    const selectionStart = 50; // Inside <persName>John Doe</persName>
    const selectionEnd = 60;
    const restrictedTags = ['teiHeader', 'persName', 'hi'];

    expect(
      EditorUtils.xmlCheck.checkSelectionRestrictedTags(
        xmlDoc,
        selectionStart,
        selectionEnd,
        restrictedTags,
      ),
    ).toBe(false);
  });

  test('should return true for selection within safe areas', () => {
    const selectionStart = 30; // "inside." (not in any restricted tag)
    const selectionEnd = 37;
    const restrictedTags = ['teiHeader', 'persName', 'hi'];

    expect(
      EditorUtils.xmlCheck.checkSelectionRestrictedTags(
        xmlDoc,
        selectionStart,
        selectionEnd,
        restrictedTags,
      ),
    ).toBe(true);
  });
});
