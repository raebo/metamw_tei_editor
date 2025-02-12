import { EditorUtils } from "../../../src/utils/editor"; // Adjust the path based on your project structure

describe("XML.checkSelectionRestrictedTags", () => {
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
    xmlDoc = parser.parseFromString(xmlString, "application/xml");
  });

  test("should return true for selection outside restricted tags", () => {
    const selectionStart = 10; // "Normal text" part
    const selectionEnd = 22;
    const restrictedTags = ["teiHeader", "persName", "hi"];

    expect(EditorUtils.xmlCheck.checkSelectionRestrictedTags(xmlDoc, selectionStart, selectionEnd, restrictedTags)).toBe(true);
  });

  test("should return false for selection overlapping <hi>", () => {
    const selectionStart = 15; // Overlapping "Highlighted"
    const selectionEnd = 35;
    const restrictedTags = ["teiHeader", "persName", "hi"];

    expect(EditorUtils.xmlCheck.checkSelectionRestrictedTags(xmlDoc, selectionStart, selectionEnd, restrictedTags)).toBe(false);
  });

  test("should return false for selection inside <persName>", () => {
    const selectionStart = 50; // Inside <persName>John Doe</persName>
    const selectionEnd = 60;
    const restrictedTags = ["teiHeader", "persName", "hi"];

    expect(EditorUtils.xmlCheck.checkSelectionRestrictedTags(xmlDoc, selectionStart, selectionEnd, restrictedTags)).toBe(false);
  });

  test("should return true for selection within safe areas", () => {
    const selectionStart = 30; // "inside." (not in any restricted tag)
    const selectionEnd = 37;
    const restrictedTags = ["teiHeader", "persName", "hi"];

    expect(EditorUtils.xmlCheck.checkSelectionRestrictedTags(xmlDoc, selectionStart, selectionEnd, restrictedTags)).toBe(true);
  });
});
