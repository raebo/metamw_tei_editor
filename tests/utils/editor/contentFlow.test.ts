import { EditorConstants } from '@src/constants/editor';
import { contentFlow } from '@src/utils/editor/contentFlow';

describe('contentFlow.insertPageBreak', () => {
  it('should insert a new pagebreak when no pagebreaks exist', () => {
    const xmlString = `
      <TEI xmlns="${EditorConstants.TEI_NS}">
        <text>
          <body>
            <p><span class="marked">Here comes a new page break</span></p>
            <p>further content without page breaks</p>
          </body>
        </text>
      </TEI>
    `;

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

    // run the function under test
    contentFlow.insertPageBreak(xmlDoc);

    const serializer = new XMLSerializer();
    const result = serializer.serializeToString(xmlDoc);

    // Expect a new seg + pb inserted before "Here comes..."
    expect(result).toContain('<seg type="pagebreak">|1| <pb n="1" type="pagebreak"/></seg>Here comes a new page break');

    // Expect the old <pb n="3"> got updated to 4
    expect(result).not.toContain('<pb n="2" type="pagebreak"/>');

    // Ensure no <span class="marked"> remains
    expect(result).not.toContain('<span class="marked">');
  });

  it('should insert a new pagebreak at the first position for text marked', () => {
    const xmlString = `
      <TEI xmlns="${EditorConstants.TEI_NS}">
        <text>
          <body>
            <p><span class="marked">Here comes a new page break</span></p>
            <p>First page <pb n="1" type="pagebreak"/> content</p>
          </body>
        </text>
      </TEI>
    `;

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

    // run the function under test
    contentFlow.insertPageBreak(xmlDoc);

    const serializer = new XMLSerializer();
    const result = serializer.serializeToString(xmlDoc);

    // Expect a new seg + pb inserted before "Here comes..."
    expect(result).toContain('<seg type="pagebreak">|1| <pb n="1" type="pagebreak"/></seg>Here comes a new page break');

    // Expect the old <pb n="3"> got updated to 4
    expect(result).toContain('<pb n="2" type="pagebreak"/>');

    // Ensure no <span class="marked"> remains
    expect(result).not.toContain('<span class="marked">');
  });

  it('inserts a new pagebreak seg before the marked span and updates numbering', () => {
    const xmlString = `
      <TEI xmlns="${EditorConstants.TEI_NS}">
        <text>
          <body>
            <p>First page <pb n="1" type="pagebreak"/> content</p>
            <p>Second page <pb n="2" type="pagebreak"/> content</p>
            <p><span class="marked">Here comes a new page break</span></p>
            <p>Third page <pb n="3" type="pagebreak"/> content</p>
          </body>
        </text>
      </TEI>
    `;

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

    // run the function under test
    contentFlow.insertPageBreak(xmlDoc);

    const serializer = new XMLSerializer();
    const result = serializer.serializeToString(xmlDoc);

    // Expect a new seg + pb inserted before "Here comes..."
    expect(result).toContain('<seg type="pagebreak">|3| <pb n="3" type="pagebreak"/></seg>Here comes a new page break');

    // Expect the old <pb n="3"> got updated to 4
    expect(result).toContain('<pb n="4" type="pagebreak"/>');

    // Ensure no <span class="marked"> remains
    expect(result).not.toContain('<span class="marked">');
  });
});

describe('reorderExistingPageBreaks', () => {
  it('should reorder seg nodes with type=pagebreak', () => {
    const xmlString = `
      <root xmlns="${EditorConstants.TEI_NS}">
        <seg type="pagebreak">
          |old|
          <pb n="99" type="pagebreak"/>
        </seg>
        <seg type="pagebreak">
          <pb n="100" type="pagebreak"/>
        </seg>
        <seg type="pagebreak"></seg>
      </root>
    `;

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

    contentFlow.reorderExistingPageBreaks(xmlDoc);

    const segNodes = xmlDoc.querySelectorAll('seg[type="pagebreak"]');

    expect(segNodes.length).toBe(3);

    // 1st seg
    expect(segNodes[0].textContent?.includes('|1|')).toBe(true);
    expect(segNodes[0].querySelector('pb')?.getAttribute('n')).toBe('1');

    // 2nd seg
    expect(segNodes[1].textContent?.includes('|2|')).toBe(true);
    expect(segNodes[1].querySelector('pb')?.getAttribute('n')).toBe('2');

    // 3rd seg (initially empty, should get both text and pb)
    expect(segNodes[2].textContent?.includes('|3|')).toBe(true);
    const pb3 = segNodes[2].querySelector('pb');
    expect(pb3).not.toBeNull();
    expect(pb3?.getAttribute('n')).toBe('3');
    expect(pb3?.getAttribute('type')).toBe('pagebreak');
  });
});
