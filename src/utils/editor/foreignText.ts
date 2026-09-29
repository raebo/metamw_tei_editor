import { v4 as uuidv4 } from 'uuid';
import { EditorConstants } from '@src/constants/editor';

export const FOREIGN_TEXT_LANGUAGE_SUGGESTIONS = ['fr', 'en', 'it', 'es', 'grc', 'la', 'he'] as const;

export type ForeignTextErrorCode = 'languageRequired' | 'languageInvalid' | 'selectionMissing' | 'selectionNested' | 'elementMissing';

export class ForeignTextError extends Error {
  constructor(readonly code: ForeignTextErrorCode) {
    super(code);
    this.name = 'ForeignTextError';
  }
}

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

export const normalizeForeignTextLanguage = (rawLanguage: string): string => {
  const language = rawLanguage.trim().replace(/_/g, '-');
  if (!language) throw new ForeignTextError('languageRequired');

  try {
    return Intl.getCanonicalLocales(language)[0];
  } catch {
    throw new ForeignTextError('languageInvalid');
  }
};

export const insertForeignText = (xmlDoc: Document, rawLanguage: string): Element => {
  const marker = markedSelection(xmlDoc);
  if (!marker?.parentNode) throw new ForeignTextError('selectionMissing');
  if (marker.parentElement?.closest('foreign')) throw new ForeignTextError('selectionNested');

  const foreign = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'foreign');
  foreign.setAttribute('xml:id', `foreign_${uuidv4()}`);
  foreign.setAttribute('xml:lang', normalizeForeignTextLanguage(rawLanguage));
  while (marker.firstChild) foreign.appendChild(marker.firstChild);
  marker.replaceWith(foreign);
  return foreign;
};

export const resolveForeignText = (xmlDoc: Document, reference: string): Element => {
  const element = elementByPath(xmlDoc, reference) ?? elementByXmlId(xmlDoc, reference.replace(/^#/, ''));
  if (!element || element.localName.toLowerCase() !== 'foreign') {
    throw new ForeignTextError('elementMissing');
  }
  return element;
};

export const updateForeignText = (element: Element, rawLanguage: string): Element => {
  element.setAttribute('xml:lang', normalizeForeignTextLanguage(rawLanguage));
  if (!element.getAttribute('xml:id')) element.setAttribute('xml:id', `foreign_${uuidv4()}`);
  return element;
};

export const deleteForeignText = (element: Element): void => unwrap(element);
