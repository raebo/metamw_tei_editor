import { EditorConstants } from '@src/constants/editor';
import {
  captureHorizontalFractionCaret,
  deleteFraction,
  deleteHorizontalFraction,
  FRACTION_STRUCTURES,
  insertFraction,
  insertHorizontalFraction,
  readFraction,
  readHorizontalFraction,
  resolveFraction,
  resolveHorizontalFraction,
  updateFraction,
  updateHorizontalFraction,
} from '@src/utils/editor/horizontalFraction';

const parseXml = (content: string): XMLDocument => new DOMParser().parseFromString(content, 'application/xml');
const tei = (content: string): XMLDocument => parseXml(`<TEI xmlns="${EditorConstants.TEI_NS}"><text><body>${content}</body></text></TEI>`);

describe('horizontal fractions', () => {
  afterEach(() => window.getSelection()?.removeAllRanges());

  it('captures a collapsed caret inside a body paragraph', () => {
    const renderedParagraph = document.createElement('p');
    renderedParagraph.dataset.editorXmlPath = '0.0.0';
    renderedParagraph.textContent = 'Amount due';
    document.body.appendChild(renderedParagraph);
    const range = document.createRange();
    range.setStart(renderedParagraph.firstChild!, 6);
    range.collapse(true);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    expect(captureHorizontalFractionCaret(new XMLSerializer().serializeToString(tei('<p>Amount due</p>')))).toEqual({
      elementType: 'p',
      sourcePath: '0.0.0',
      reference: 'caret:0:6',
    });

    renderedParagraph.remove();
  });

  it('rejects a text selection instead of replacing it', () => {
    const renderedParagraph = document.createElement('p');
    renderedParagraph.dataset.editorXmlPath = '0.0.0';
    renderedParagraph.textContent = 'Amount due';
    document.body.appendChild(renderedParagraph);
    const range = document.createRange();
    range.setStart(renderedParagraph.firstChild!, 0);
    range.setEnd(renderedParagraph.firstChild!, 6);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    expect(() => captureHorizontalFractionCaret(new XMLSerializer().serializeToString(tei('<p>Amount due</p>')))).toThrow(
      'Please place the cursor at one position in the letter text.',
    );

    renderedParagraph.remove();
  });

  it('inserts the FMB-C fraction structure and adds missing surrounding spaces', () => {
    const xmlDoc = tei('<p>Amountdue</p>');
    const formula = insertHorizontalFraction(xmlDoc, '0.0.0', 'caret:0:6', {
      numerator: '12',
      denominator: '35',
    });
    const paragraph = xmlDoc.getElementsByTagNameNS('*', 'p')[0];

    expect(formula.getAttribute('rend')).toBe('fraction_bar');
    expect(formula.getAttribute('xml:id')).toMatch(/^formula_/);
    expect(Array.from(formula.children).map((child) => [child.getAttribute('rend'), child.textContent])).toEqual([
      ['supbar', '12'],
      ['barbar', '/'],
      ['subbar', '35'],
    ]);
    expect(paragraph.childNodes[0].nodeValue).toBe('Amount ');
    expect(paragraph.childNodes[1]).toBe(formula);
    expect(paragraph.childNodes[2].nodeValue).toBe(' due');
  });

  it('preserves existing spaces and supports insertion at the text boundary', () => {
    const spacedDocument = tei('<p>Amount due</p>');
    insertHorizontalFraction(spacedDocument, '0.0.0', 'caret:0:7', {
      numerator: '1',
      denominator: '2',
    });
    const spacedParagraph = spacedDocument.getElementsByTagNameNS('*', 'p')[0];
    expect(spacedParagraph.childNodes[0].nodeValue).toBe('Amount ');
    expect(spacedParagraph.childNodes[2].nodeValue).toBe(' due');

    const boundaryDocument = tei('<p>Text</p>');
    insertHorizontalFraction(boundaryDocument, '0.0.0', 'caret:0:0', {
      numerator: '3',
      denominator: '4',
    });
    const boundaryParagraph = boundaryDocument.getElementsByTagNameNS('*', 'p')[0];
    expect(boundaryParagraph.childNodes[0].nodeValue).toBe(' ');
    expect(boundaryParagraph.childNodes[2].nodeValue).toBe(' Text');
  });

  it('requires both values and stores input as text', () => {
    const missingValueDocument = tei('<p>Text</p>');
    expect(() =>
      insertHorizontalFraction(missingValueDocument, '0.0.0', 'caret:0:2', {
        numerator: '',
        denominator: '2',
      }),
    ).toThrow('Numerator and denominator are required.');

    const xmlDoc = tei('<p>Text</p>');
    const formula = insertHorizontalFraction(xmlDoc, '0.0.0', 'caret:0:2', {
      numerator: '<script>',
      denominator: 'A & B',
    });
    expect(formula.children[0].textContent).toBe('<script>');
    expect(formula.children[0].children).toHaveLength(0);
    expect(formula.children[2].textContent).toBe('A & B');
  });

  it('resolves legacy fractions by path and updates their values while adding a stable ID', () => {
    const xmlDoc = tei(
      '<p>Amount <formula rend="fraction_bar"><hi rend="supbar">1</hi><hi rend="barbar">/</hi><hi rend="subbar">2</hi></formula> due</p>',
    );
    const formula = resolveHorizontalFraction(xmlDoc, 'path:0.0.0.1');

    expect(readHorizontalFraction(formula)).toEqual({ numerator: '1', denominator: '2' });
    updateHorizontalFraction(formula, { numerator: '12', denominator: '25' });

    expect(readHorizontalFraction(formula)).toEqual({ numerator: '12', denominator: '25' });
    expect(formula.getAttribute('xml:id')).toMatch(/^formula_/);
  });

  it('deletes a fraction and normalizes only its adjacent spaces', () => {
    const xmlDoc = tei(
      '<p>Amount  <formula rend="fraction_bar" xml:id="formula_1"><hi rend="supbar">1</hi><hi rend="barbar">/</hi><hi rend="subbar">2</hi></formula>   due</p>',
    );
    const formula = resolveHorizontalFraction(xmlDoc, 'formula_1');

    deleteHorizontalFraction(formula);

    const paragraph = xmlDoc.getElementsByTagNameNS('*', 'p')[0];
    expect(paragraph.childNodes).toHaveLength(1);
    expect(paragraph.textContent).toBe('Amount due');
  });

  it('removes automatically added boundary spaces when deleting a fraction', () => {
    const xmlDoc = tei(
      '<p> <formula rend="fraction_bar" xml:id="formula_1"><hi rend="supbar">1</hi><hi rend="barbar">/</hi><hi rend="subbar">2</hi></formula> Text</p>',
    );

    deleteHorizontalFraction(resolveHorizontalFraction(xmlDoc, 'formula_1'));

    expect(xmlDoc.getElementsByTagNameNS('*', 'p')[0].textContent).toBe('Text');
  });

  it('preserves spacing next to neighboring inline elements', () => {
    const xmlDoc = tei(
      '<p><hi rend="italic">Amount</hi><formula rend="fraction_bar" xml:id="formula_1"><hi rend="supbar">1</hi><hi rend="barbar">/</hi><hi rend="subbar">2</hi></formula> due</p>',
    );

    deleteHorizontalFraction(resolveHorizontalFraction(xmlDoc, 'formula_1'));

    const paragraph = xmlDoc.getElementsByTagNameNS('*', 'p')[0];
    expect(paragraph.childNodes).toHaveLength(2);
    expect(paragraph.childNodes[1].nodeValue).toBe(' due');
    expect(paragraph.textContent).toBe('Amount due');
  });
});

describe('vertical fractions', () => {
  it.each([
    ['vertical-slash', 'fraction_slash', 'supslash', 'barslash', '', 'subslash'],
    ['vertical-noslash', 'fraction_noslash', 'supnoslash', 'barnoslash', '/', 'subnoslash'],
  ] as const)(
    'inserts, reads and updates the %s FMB-C structure',
    (variant, formulaRend, numeratorRend, separatorRend, separatorText, denominatorRend) => {
      const xmlDoc = tei('<p>Amountdue</p>');
      const formula = insertFraction(xmlDoc, '0.0.0', 'caret:0:6', { numerator: '1', denominator: '2' }, variant);

      expect(formula.getAttribute('rend')).toBe(formulaRend);
      expect(Array.from(formula.children).map((child) => [child.getAttribute('rend'), child.textContent])).toEqual([
        [numeratorRend, '1'],
        [separatorRend, separatorText],
        [denominatorRend, '2'],
      ]);
      expect(readFraction(resolveFraction(xmlDoc, formula.getAttribute('xml:id')!, variant))).toEqual({
        variant,
        numerator: '1',
        denominator: '2',
      });

      updateFraction(formula, { numerator: '12', denominator: '35' }, variant);
      expect(readFraction(formula)).toEqual({ variant, numerator: '12', denominator: '35' });
      expect(formula.querySelector(`[rend="${separatorRend}"]`)?.textContent).toBe(separatorText);
    },
  );

  it.each(['vertical-slash', 'vertical-noslash'] as const)('deletes a %s fraction and normalizes adjacent spaces', (variant) => {
    const xmlDoc = tei('<p>Amountdue</p>');
    const formula = insertFraction(xmlDoc, '0.0.0', 'caret:0:6', { numerator: '1', denominator: '2' }, variant);

    deleteFraction(formula, variant);

    expect(xmlDoc.getElementsByTagNameNS('*', 'p')[0].textContent).toBe('Amount due');
  });

  it('rejects resolving a fraction as the wrong variant', () => {
    const xmlDoc = tei('<p>Text</p>');
    const formula = insertFraction(xmlDoc, '0.0.0', 'caret:0:2', { numerator: '1', denominator: '2' }, 'vertical-slash');

    expect(() => resolveFraction(xmlDoc, formula.getAttribute('xml:id')!, 'vertical-noslash')).toThrow(
      'The selected fraction has a different display variant.',
    );
    expect(FRACTION_STRUCTURES.horizontal.formulaRend).toBe('fraction_bar');
  });
});
