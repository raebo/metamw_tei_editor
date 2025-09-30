import { textMarking } from '@src/utils/editor/textMarking';
import { EditorUtils } from '@src/utils/editor';
import { EditorConstants } from '@src/constants/editor';

describe('textMarking.isValidSelection', () => {
  let rootElement: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="root">
       <TEI xmlns="http://www.tei-c.org/ns/1.0">
            <teiHeader>
                <title>Forbidden</title>
            </teiHeader>
            <teiBody>
                <text type="letter">
                    <body>
                        <div type="act_of_writing">
                          <p>Some <span>sample</span> text here.</p>
                        </div>
                        <div type="act_of_writing">
                            <p>Normal text <hi rend="latintype">Highlighted</hi> inside.</p>
                            <p>Another line with <persName>John Doe</persName>.</p>
                        </div>
                    </body>
                </text>
            </teiBody>
        </TEI>
       </div>
    `;

    rootElement = document.getElementById('root') as HTMLElement;

    // Mock constants
    (EditorConstants as any).ALLOWED_PARENT_TAG = '[type="act_of_writing"]';
    (EditorConstants as any).FORBIDDEN_PARENT_TAG = 'teiheader';

    // Stub selection offset util
    jest.spyOn(EditorUtils.xmlCheck, 'getSelectionOffsets').mockImplementation(() => ({
      start: 0,
      end: 5,
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createSelection(node: Node, start: number, end: number): Selection {
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, end);

    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    return selection;
  }

  test('returns false if rootElement is null', () => {
    const valid = textMarking.isValidSelection(null, null);
    expect(valid).toBe(false);
  });

  test('returns false if selection is null', () => {
    const valid = textMarking.isValidSelection(null, rootElement);
    expect(valid).toBe(false);
  });

  test('calls onValid when selection is inside allowed parent', () => {
    const textNode = rootElement.querySelector('p')!.firstChild!; // "Some "
    const selection = createSelection(textNode, 0, 2);

    const onValid = jest.fn();

    const result = textMarking.isValidSelection(selection, rootElement, onValid);

    expect(result).toBe(true);
    expect(onValid).toHaveBeenCalledWith(selection);
  });

  test('returns false if selection is inside forbidden parent', () => {
    const textNode = rootElement.querySelector('tei teiheader title')!.firstChild!;
    const selection = createSelection(textNode, 0, 5);

    const onInvalid = jest.fn();

    const result = textMarking.isValidSelection(selection, rootElement, undefined, onInvalid);

    expect(result).toBe(false);
    expect(onInvalid).toHaveBeenCalledWith('Bitte markieren Sie einen Bereich im Textkörper');
  });

  test('returns false if selection crosses multiple nodes', () => {
    const p = rootElement.querySelector('p')!;
    const firstNode = p.childNodes[0]; // "Some "
    const secondNode = p.childNodes[1].firstChild!; // "sample"

    const range = document.createRange();
    range.setStart(firstNode, 0);
    range.setEnd(secondNode, 3);

    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    const onInvalid = jest.fn();

    const result = textMarking.isValidSelection(selection, rootElement, undefined, onInvalid);

    expect(result).toBe(false);
    expect(onInvalid).toHaveBeenCalledWith('Ihre Auswahl überschneidet mehrere Abschnitte');
  });

  test('returns false if getSelectionOffsets returns null', () => {
    jest.spyOn(EditorUtils.xmlCheck, 'getSelectionOffsets').mockReturnValue(null);

    const textNode = rootElement.querySelector('p')!.firstChild!;
    const selection = createSelection(textNode, 0, 2);

    const onInvalid = jest.fn();

    const result = textMarking.isValidSelection(selection, rootElement, undefined, onInvalid);

    expect(result).toBe(false);
    expect(onInvalid).toHaveBeenCalledWith('No offsets');
  });
});

describe('unwrapNode', () => {
  beforeEach(() => {
    // Mock the recursive unwrapNode call
    // jest.spyOn(EditorUtils.textMarking, 'unwrapNode').mockImplementation((node: Element) => {
    //   // just call the original unwrapNode if needed or noop
    // });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('unwraps the node and removes hidden items correctly', () => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(
      `
  <TEI xmlns="http://www.tei-c.org/ns/1.0">
    <teiBody>
      <text>
        <div>
          <p>
            <seg type="pagebreak">|2| 
              <pb n="2" type="pagebreak"/>
            </seg> geht es weiter nach einem 
            <title>Seitenumbruch
              <list>
                <item style="hidden"/>
              </list>
              <name style="hidden">Mendelssohn</name>
            </title>
          </p>
        </div>
      </text>
    </teiBody>
  </TEI>
`,
      'application/xml',
    );

    const p = xmlDoc.querySelector('p')!;
    expect(p).not.toBeNull();

    expect(p).not.toBeNull();

    if (!p) return;
    const titleNode = p.querySelector('title');
    expect(titleNode).not.toBeNull();

    if (!titleNode) return;

    // Call unwrapNode
    textMarking.unwrapNode(titleNode);

    // Assert the title node is removed
    expect(p.querySelector('title')).toBeNull();

    // Assert that the remaining HTML matches expected
    const expectedHTML = `
      <seg type="pagebreak">|2| 
        <pb n="2" type="pagebreak"></pb>
      </seg> geht es weiter nach einem Seitenumbruch
    `
      .replace(/\s+/g, ' ')
      .trim();

    const actualHTML = normalize(p.innerHTML);

    expect(actualHTML).toBe(expectedHTML);
  });
});

function normalize(html: string): string {
  return html
    .replace(/\s+xmlns="[^"]*"/g, '') // remove xmlns
    .replace(/\/>/g, '></pb>') // normalize self-closing pb
    .replace(/\s+/g, ' ')
    .trim();
}
