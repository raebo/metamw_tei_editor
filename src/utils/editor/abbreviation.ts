import { v4 as uuidv4 } from 'uuid';
import { EditorConstants } from '@src/constants/editor';

export type AbbreviationErrorCode = 'expansionRequired' | 'selectionMissing' | 'selectionNested' | 'elementMissing' | 'structureInvalid';

export class AbbreviationError extends Error {
  constructor(readonly code: AbbreviationErrorCode) {
    super(code);
    this.name = 'AbbreviationError';
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

const directChild = (element: Element, localName: string): Element | null =>
  Array.from(element.children).find((child) => child.localName.toLowerCase() === localName) ?? null;

const normalizedExpansion = (rawExpansion: string): string => {
  const expansion = rawExpansion.trim();
  if (!expansion) throw new AbbreviationError('expansionRequired');
  return expansion;
};

const validateChoice = (choice: Element): { abbreviation: Element; expansion: Element } => {
  const abbreviation = directChild(choice, 'abbr');
  const expansion = directChild(choice, 'expan');
  if (!abbreviation || !expansion) throw new AbbreviationError('structureInvalid');
  return { abbreviation, expansion };
};

export const readAbbreviationExpansion = (choice: Element): string => {
  const { expansion } = validateChoice(choice);
  const value = expansion.textContent ?? '';
  return value.startsWith('"') && value.endsWith('"') && value.length >= 2 ? value.slice(1, -1) : value;
};

export const insertAbbreviation = (xmlDoc: Document, rawExpansion: string): Element => {
  const marker = markedSelection(xmlDoc);
  if (!marker?.parentNode) throw new AbbreviationError('selectionMissing');
  const containsAbbreviation = Array.from(marker.getElementsByTagNameNS('*', 'choice')).some(
    (choice) => directChild(choice, 'abbr') && directChild(choice, 'expan'),
  );
  const enclosingChoice = marker.parentElement?.closest('choice');
  if (containsAbbreviation || (enclosingChoice && directChild(enclosingChoice, 'abbr') && directChild(enclosingChoice, 'expan'))) {
    throw new AbbreviationError('selectionNested');
  }

  const choice = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'choice');
  choice.setAttribute('xml:id', `choice_${uuidv4()}`);
  const abbreviation = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'abbr');
  const expansion = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'expan');
  expansion.setAttribute('style', 'hidden');
  expansion.textContent = `"${normalizedExpansion(rawExpansion)}"`;
  while (marker.firstChild) abbreviation.appendChild(marker.firstChild);
  choice.append(abbreviation, expansion);
  marker.replaceWith(choice);
  return choice;
};

export const resolveAbbreviation = (xmlDoc: Document, reference: string): Element => {
  const element = elementByPath(xmlDoc, reference) ?? elementByXmlId(xmlDoc, reference.replace(/^#/, ''));
  if (!element || element.localName.toLowerCase() !== 'choice') throw new AbbreviationError('elementMissing');
  validateChoice(element);
  return element;
};

export const updateAbbreviation = (choice: Element, rawExpansion: string): Element => {
  const { expansion } = validateChoice(choice);
  expansion.setAttribute('style', 'hidden');
  expansion.textContent = `"${normalizedExpansion(rawExpansion)}"`;
  if (!choice.getAttribute('xml:id')) choice.setAttribute('xml:id', `choice_${uuidv4()}`);
  return choice;
};

export const deleteAbbreviation = (choice: Element): void => {
  const { abbreviation } = validateChoice(choice);
  const parent = choice.parentNode;
  if (!parent) throw new AbbreviationError('elementMissing');
  while (abbreviation.firstChild) parent.insertBefore(abbreviation.firstChild, choice);
  choice.remove();
};
