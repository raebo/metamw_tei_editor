import { EntityType } from '@src/constants/editor';

export type LetterEntityContext =
  | 'mentioned'
  | 'author'
  | 'writer'
  | 'receiver'
  | 'addressee'
  | 'writingPlace'
  | 'sendingPlace'
  | 'receivingPlace';

export type LetterPlaceEntityType = EntityType.SETTLEMENT | EntityType.SIGHT | EntityType.INSTITUTION;

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

const parseLetterXml = (xmlContent: string): XMLDocument => {
  const xmlDocument = new DOMParser().parseFromString(xmlContent, 'application/xml');
  const parserError = xmlDocument.getElementsByTagName('parsererror')[0];

  if (parserError) {
    throw new Error(`Error parsing XML: ${normalizeText(parserError.textContent)}`);
  }

  return xmlDocument;
};

const placeEntityType = (element: Element): LetterPlaceEntityType | null => {
  const name = localName(element);
  const type = normalizeText(element.getAttribute('type')).toLowerCase();

  if (name === 'settlement') return EntityType.SETTLEMENT;
  if (name === 'name' && type === 'sight') return EntityType.SIGHT;
  if (name === 'name' && type === 'institution') return EntityType.INSTITUTION;

  if (name !== 'placename') return null;
  if (type === 'settlement' || type === 'locality') return EntityType.SETTLEMENT;
  if (type === 'sight') return EntityType.SIGHT;
  if (type === 'institution') return EntityType.INSTITUTION;

  if (element.querySelector(':scope > settlement')) return EntityType.SETTLEMENT;
  if (element.querySelector(':scope > name[type="sight"]')) return EntityType.SIGHT;
  if (element.querySelector(':scope > name[type="institution"]')) return EntityType.INSTITUTION;

  return null;
};

const placeContext = (element: Element): LetterEntityContext => {
  if (hasAncestor(element, 'body')) return 'mentioned';

  const placeName = closestAncestor(element, 'placeName');
  const placeRole = normalizeText(placeName?.getAttribute('type') ?? null).toLowerCase();
  if (placeRole === 'writing_place') return 'writingPlace';
  if (placeRole === 'receiving_place' || placeRole === 'received_place') return 'receivingPlace';
  if (placeRole === 'sending_place' || placeRole === 'sent_place') return 'sendingPlace';

  const action = closestAncestor(element, 'correspAction');
  const actionType = normalizeText(action?.getAttribute('type') ?? null).toLowerCase();
  if (actionType === 'received') return 'receivingPlace';
  if (actionType === 'sent') return 'sendingPlace';

  return 'mentioned';
};

const placeDisplayName = (element: Element, type: LetterPlaceEntityType): string => {
  if (localName(element) !== 'placename') return normalizeText(element.textContent);

  const childSelectorByType: Record<LetterPlaceEntityType, string> = {
    [EntityType.SETTLEMENT]: ':scope > settlement',
    [EntityType.SIGHT]: ':scope > name[type="sight"]',
    [EntityType.INSTITUTION]: ':scope > name[type="institution"]',
  };
  const typedChild = element.querySelector(childSelectorByType[type]);

  return normalizeText(typedChild?.textContent ?? element.textContent);
};

export const extractLetterPersonSuggestions = (xmlContent: string): LetterEntitySuggestion[] => {
  const xmlDocument = parseLetterXml(xmlContent);

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

export const extractLetterPlaceSuggestions = (xmlContent: string, selectedType: LetterPlaceEntityType): LetterEntitySuggestion[] => {
  const xmlDocument = parseLetterXml(xmlContent);
  const suggestions = new Map<string, LetterEntitySuggestion>();

  xmlDocument.querySelectorAll('[data-key]').forEach((element) => {
    if (!hasAncestor(element, 'body') && !hasAncestor(element, 'correspDesc')) return;

    const resolvedType = placeEntityType(element);
    if (resolvedType !== selectedType) return;

    const entityKey = normalizeText(element.getAttribute('data-key'));
    const entityName = placeDisplayName(element, resolvedType);
    if (!entityKey || invalidEntityKeys.has(entityKey.toLowerCase()) || !entityName) return;

    const normalizedKey = entityKey.toUpperCase();
    const context = placeContext(element);
    const existingSuggestion = suggestions.get(normalizedKey);

    if (existingSuggestion) {
      if (!existingSuggestion.contexts.includes(context)) {
        existingSuggestion.contexts.push(context);
      }
      return;
    }

    suggestions.set(normalizedKey, {
      entityKey,
      entityName,
      entityType: resolvedType,
      contexts: [context],
    });
  });

  return Array.from(suggestions.values()).sort((left, right) =>
    left.entityName.localeCompare(right.entityName, undefined, { sensitivity: 'base' }),
  );
};
