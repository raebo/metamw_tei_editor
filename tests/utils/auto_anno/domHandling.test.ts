import {
  markSpanAndScrollToId,
  referenceTypeForXmlId,
  removeSnippetEntityFromDom,
} from '@src/utils/auto_anno/domHandling';

describe('domHandling xml:id lookups', () => {
  beforeAll(() => {
    // jsdom does not implement scrollIntoView.
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('findet ein Element, dessen xml:id ein Anfuehrungszeichen enthaelt, ohne zu werfen', () => {
    document.body.innerHTML = "<persname xml:id='foo\"bar'>Max</persname>";

    // Previously this built the selector via raw string concatenation, so a `"` in the id broke
    // the attribute selector and made querySelector throw a DOMException instead of matching.
    expect(() => markSpanAndScrollToId('foo"bar')).not.toThrow();
    expect(document.querySelector('span.marked')).not.toBeNull();
  });

  it('referenceTypeForXmlId findet das Element trotz Sonderzeichen in der xml:id', () => {
    document.body.innerHTML = "<persname xml:id='a\"b'>Max</persname>";

    expect(referenceTypeForXmlId('a"b')).toBe('Person');
  });

  it('removeSnippetEntityFromDom findet das Element trotz Sonderzeichen in der xml:id', () => {
    document.body.innerHTML = "<persname xml:id='a\"b'>Max Mustermann</persname>";

    expect(() => removeSnippetEntityFromDom('a"b')).not.toThrow();
    expect(document.body.textContent).toBe('Max Mustermann');
  });

  it('wirft weiterhin einen klaren Fehler, wenn kein Element mit dieser xml:id existiert', () => {
    expect(() => referenceTypeForXmlId('does-not-exist')).toThrow(
      'No DOM element found with xml:id="does-not-exist".',
    );
  });
});
