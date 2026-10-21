import { EditorConstants } from '@src/constants/editor';

export type InlineFormat = 'superscript' | 'subscript' | 'groundline' | 'latintype';

export type InlineFormattingErrorCode = 'selectionMissing' | 'selectionInvalid' | 'selectionNested' | 'elementMissing';

export class InlineFormattingError extends Error {
  constructor(readonly code: InlineFormattingErrorCode) {
    super(code);
    this.name = 'InlineFormattingError';
  }
}

const FORMAT_REND: Record<InlineFormat, string> = {
  superscript: 'superscript',
  subscript: 'subscript',
  groundline: 'groundline',
  latintype: 'latintype',
};

const elementByXmlId = (xmlDoc: Document, xmlId: string): Element | null =>
  Array.from(xmlDoc.getElementsByTagNameNS('*', '*')).find((element) => element.getAttribute('xml:id') === xmlId) ?? null;

const elementByPath = (xmlDoc: Document, reference: string): Element | null => {
  if (!reference.startsWith('path:')) return null;
  const encodedPath = reference.slice(5);
  const indexes = encodedPath === '' ? [] : encodedPath.split('.').map(Number);
  if (indexes.some((index) => !Number.isInteger(index) || index < 0)) return null;

  let current: Node | null = xmlDoc.documentElement;
  for (const index of indexes) current = current?.childNodes[index] ?? null;
  return current?.nodeType === Node.ELEMENT_NODE ? (current as Element) : null;
};

const markedSelection = (xmlDoc: Document): Element | null =>
  Array.from(xmlDoc.getElementsByTagNameNS('*', 'span')).find((element) =>
    (element.getAttribute('class') ?? '').split(/\s+/).includes('marked'),
  ) ?? null;

const unwrap = (element: Element): void => {
  const parent = element.parentNode;
  if (!parent) return;
  while (element.firstChild) parent.insertBefore(element.firstChild, element);
  element.remove();
};

const isInlineFormatElement = (element: Element, format: InlineFormat): boolean =>
  element.localName.toLowerCase() === 'hi' && element.getAttribute('rend') === FORMAT_REND[format];

export const applyInlineFormatting = (xmlDoc: Document, format: InlineFormat): Element => {
  const marker = markedSelection(xmlDoc);
  if (!marker?.parentNode) throw new InlineFormattingError('selectionMissing');
  if (!marker.closest('body') || !(marker.textContent ?? '').length) throw new InlineFormattingError('selectionInvalid');

  const rend = FORMAT_REND[format];
  if (marker.closest(`hi[rend="${rend}"]`) || marker.querySelector(`hi[rend="${rend}"]`)) {
    throw new InlineFormattingError('selectionNested');
  }

  const formatted = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'hi');
  formatted.setAttribute('rend', rend);
  while (marker.firstChild) formatted.appendChild(marker.firstChild);
  marker.replaceWith(formatted);
  return formatted;
};

export const resolveInlineFormatting = (xmlDoc: Document, reference: string, format: InlineFormat): Element => {
  const element = elementByPath(xmlDoc, reference) ?? elementByXmlId(xmlDoc, reference.replace(/^#/, ''));
  if (!element || !isInlineFormatElement(element, format)) throw new InlineFormattingError('elementMissing');
  return element;
};

export const removeInlineFormatting = (element: Element, format: InlineFormat): void => {
  if (!isInlineFormatElement(element, format)) throw new InlineFormattingError('elementMissing');
  unwrap(element);
};
