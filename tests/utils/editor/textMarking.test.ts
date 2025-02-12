describe("XML.isValidSelection", () => {
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
})
