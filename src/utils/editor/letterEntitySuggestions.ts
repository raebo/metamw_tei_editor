import { EntityType } from '@src/constants/editor';

export type LetterEntityContext = 'mentioned' | 'author' | 'writer' | 'receiver' | 'addressee';

export interface LetterEntitySuggestion {
  entityKey: string;
  entityName: string;
  entityType: EntityType;
  contexts: LetterEntityContext[];
}

const invalidEntityKeys = new Set(['not_yet_determined']);

const normalizeText = (value: string | null): string => (value ?? '').replace(/\s+/g, ' ').trim();

const localName = (element: Element): string => element.localName.toLowerCase();

const hasAncestor = (element: Element, name: string): boolean => {
  let current = element.parentElement;

  while (current) {
    if (localName(current) === name.toLowerCase()) return true;
    current = current.parentElement;
  }

  return false;
};

const closestAncestor = (element: Element, name: string): Element | null => {
  let current: Element | null = element;

  while (current) {
    if (localName(current) === name.toLowerCase()) return current;
    current = current.parentElement;
  }

  return null;
};

const personContext = (element: Element): LetterEntityContext => {
  const roleElement = closestAncestor(element, 'persName') ?? closestAncestor(element, 'docAuthor') ?? element;
  const role = normalizeText(roleElement.getAttribute('resp') ?? element.getAttribute('resp')).toLowerCase();

  switch (role) {
    case 'author':
      return 'author';
    case 'writer':
      return 'writer';
    case 'receiver':
      return 'receiver';
    case 'addressee':
      return 'addressee';
    default:
      return 'mentioned';
  }
};

const isRelevantPersonElement = (element: Element): boolean => {
  const name = localName(element);
  const isPersonNode = name === 'persname' || name === 'docauthor';
  const isPersonChild = name === 'name' && hasAncestor(element, 'persName');

  if (!isPersonNode && !isPersonChild) return false;
  if (hasAncestor(element, 'body')) return true;

  return hasAncestor(element, 'correspDesc');
};

const personDisplayName = (element: Element): string => {
  const ownText = normalizeText(element.textContent);
  if (ownText) return ownText;

  const personParent = closestAncestor(element.parentElement ?? element, 'persName');
  return normalizeText(personParent?.textContent ?? null);
};

export const extractLetterPersonSuggestions = (xmlContent: string): LetterEntitySuggestion[] => {
  const xmlDocument = new DOMParser().parseFromString(xmlContent, 'application/xml');
  const parserError = xmlDocument.getElementsByTagName('parsererror')[0];

  if (parserError) {
    throw new Error(`Error parsing XML: ${normalizeText(parserError.textContent)}`);
  }

  const suggestions = new Map<string, LetterEntitySuggestion>();

  xmlDocument.querySelectorAll('[data-key]').forEach((element) => {
    if (!isRelevantPersonElement(element)) return;

    const entityKey = normalizeText(element.getAttribute('data-key'));
    const entityName = personDisplayName(element);

    if (!entityKey || invalidEntityKeys.has(entityKey.toLowerCase()) || !entityName) return;

    const context = personContext(element);
    const existingSuggestion = suggestions.get(entityKey);

    if (existingSuggestion) {
      if (!existingSuggestion.contexts.includes(context)) {
        existingSuggestion.contexts.push(context);
      }
      return;
    }

    suggestions.set(entityKey, {
      entityKey,
      entityName,
      entityType: EntityType.PERSON,
      contexts: [context],
    });
  });

  return Array.from(suggestions.values()).sort((left, right) =>
    left.entityName.localeCompare(right.entityName, undefined, { sensitivity: 'base' }),
  );
};
