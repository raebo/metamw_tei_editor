import { v4 as uuidv4 } from 'uuid';
import { EditorConstants } from '@src/constants/editor';

export const CROSS_REFERENCE_KINDS = [
  'register',
  'letter-annotation',
  'external-url',
  'internal-url',
  'generic-target',
  'generic-start',
] as const;

export type CrossReferenceKind = (typeof CROSS_REFERENCE_KINDS)[number];

export type CrossReferenceCaret = {
  elementType: string;
  sourcePath: string;
  reference: string;
};

export type CrossReferenceData = {
  kind: CrossReferenceKind;
  target: string;
};

const CARET_REFERENCE_PATTERN = /^caret:(\d+):(\d+)$/;
const INTERNAL_TARGET_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9_.:-]*$/;

const isElement = (node: Node | null): node is Element => node?.nodeType === Node.ELEMENT_NODE;
const hasControlCharacters = (value: string): boolean =>
  Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });

const elementByXmlId = (xmlDoc: Document, xmlId: string): Element | null =>
  Array.from(xmlDoc.getElementsByTagNameNS('*', '*')).find((element) => element.getAttribute('xml:id') === xmlId) ?? null;

const resolveSourceElement = (xmlDoc: Document, encodedPath: string): Element => {
  const indexes = encodedPath === '' ? [] : encodedPath.split('.').map(Number);
  if (indexes.some((index) => !Number.isInteger(index) || index < 0)) {
    throw new Error('The cross-reference source path is invalid.');
  }
  let current: Node | null = xmlDoc.documentElement;
  for (const index of indexes) current = current?.childNodes[index] ?? null;
  if (!isElement(current)) throw new Error('The cross-reference source element could not be resolved.');

  let body: Element | null = current;
  while (body && body.localName.toLowerCase() !== 'body') body = body.parentElement;
  if (!body) throw new Error('Cross-references can only be inserted in the letter body.');
  return current;
};

const resolvePathReference = (xmlDoc: Document, reference: string): Element | null => {
  if (!reference.startsWith('path:')) return null;
  try {
    return resolveSourceElement(xmlDoc, reference.slice(5));
  } catch {
    return null;
  }
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

const normalizeInternalTargets = (rawTarget: string): string => {
  const values = rawTarget
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((value) => value.replace(/^#/, ''));
  if (values.length === 0) throw new Error('At least one target ID is required.');
  if (values.some((value) => !INTERNAL_TARGET_PATTERN.test(value))) {
    throw new Error('Target IDs may only contain letters, digits, dots, colons, underscores and hyphens.');
  }
  return values.map((value) => `#${value}`).join(' ');
};

const normalizeExternalUrl = (rawTarget: string): string => {
  const target = rawTarget.trim();
  if (!target || hasControlCharacters(target)) throw new Error('A valid external URL is required.');
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    throw new Error('A valid external URL is required.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Only secure HTTP(S) URLs without embedded credentials are supported.');
  }
  return target;
};

const normalizeInternalUrl = (rawTarget: string): string => {
  const target = rawTarget.trim();
  if (!target || hasControlCharacters(target) || /\s/.test(target)) {
    throw new Error('A valid internal URL is required.');
  }
  if (target.startsWith('//') || target.includes('\\') || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(target)) {
    throw new Error('Internal URLs must be relative and must not contain a URL scheme.');
  }
  return target;
};

export const normalizeCrossReferenceTarget = (kind: CrossReferenceKind, target: string): string => {
  if (kind === 'generic-target') return '';
  if (kind === 'external-url') return normalizeExternalUrl(target);
  if (kind === 'internal-url') return normalizeInternalUrl(target);
  return normalizeInternalTargets(target);
};

const createReferenceElement = (xmlDoc: Document, data: CrossReferenceData): Element => {
  const tagName = data.kind === 'generic-target' ? 'anchor' : ['external-url', 'internal-url'].includes(data.kind) ? 'ref' : 'link';
  const element = xmlDoc.createElementNS(EditorConstants.TEI_NS, tagName);
  element.setAttribute('xml:id', `${tagName}_${uuidv4()}`);
  if (data.kind === 'generic-target') {
    element.setAttribute('type', 'cross-reference');
  } else {
    element.setAttribute('target', normalizeCrossReferenceTarget(data.kind, data.target));
  }
  return element;
};

const insertAtCaret = (xmlDoc: Document, sourcePath: string, caretReference: string, element: Element): void => {
  const caretMatch = CARET_REFERENCE_PATTERN.exec(caretReference);
  if (!caretMatch) throw new Error('The cross-reference caret is invalid.');
  const parent = resolveSourceElement(xmlDoc, sourcePath);
  const sourceTextNode = parent.childNodes[Number(caretMatch[1])] ?? null;
  const offset = Number(caretMatch[2]);
  if (sourceTextNode?.nodeType !== Node.TEXT_NODE || offset > (sourceTextNode.nodeValue?.length ?? 0)) {
    throw new Error('The cross-reference caret could not be resolved.');
  }
  const sourceText = sourceTextNode.nodeValue ?? '';
  const suffix = sourceText.slice(offset);
  sourceTextNode.nodeValue = sourceText.slice(0, offset);
  parent.insertBefore(element, sourceTextNode.nextSibling);
  if (suffix) parent.insertBefore(xmlDoc.createTextNode(suffix), element.nextSibling);
  if (!sourceTextNode.nodeValue) sourceTextNode.remove();
};

const insertAtSelection = (xmlDoc: Document, kind: CrossReferenceKind, element: Element): void => {
  const marker = markedSelection(xmlDoc);
  if (!marker?.parentNode) throw new Error('The selected text could not be resolved.');
  if (['letter-annotation', 'external-url', 'internal-url'].includes(kind)) {
    while (marker.firstChild) element.appendChild(marker.firstChild);
    marker.replaceWith(element);
    return;
  }
  marker.parentNode.insertBefore(element, marker.nextSibling);
  unwrap(marker);
};

export const captureCrossReferenceCaret = (xmlString: string, selection: Selection | null = window.getSelection()): CrossReferenceCaret => {
  if (!selection || selection.rangeCount !== 1 || !selection.isCollapsed) {
    throw new Error('Please place the cursor at one position in the letter text.');
  }
  const range = selection.getRangeAt(0);
  if (range.startContainer.nodeType !== Node.TEXT_NODE) {
    throw new Error('Please place the cursor inside a text passage.');
  }
  const renderedTextNode = range.startContainer;
  const renderedParent = renderedTextNode.parentElement?.closest<HTMLElement>('[data-editor-xml-path]');
  const sourcePath = renderedParent?.dataset.editorXmlPath;
  if (!renderedParent || sourcePath === undefined) {
    throw new Error('The cursor position could not be mapped to the source XML.');
  }
  const xmlDoc = new DOMParser().parseFromString(xmlString, 'application/xml');
  if (xmlDoc.querySelector('parsererror')) throw new Error('The source XML is not well-formed.');
  const sourceParent = resolveSourceElement(xmlDoc, sourcePath);
  const renderedOccurrence = Array.from(renderedParent.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue === renderedTextNode.nodeValue)
    .indexOf(renderedTextNode as ChildNode);
  const matchingSourceNodes = Array.from(sourceParent.childNodes).filter(
    (node) => node.nodeType === Node.TEXT_NODE && node.nodeValue === renderedTextNode.nodeValue,
  );
  const sourceTextNode = matchingSourceNodes[renderedOccurrence];
  const childIndex = sourceTextNode ? Array.from(sourceParent.childNodes).indexOf(sourceTextNode) : -1;
  if (childIndex < 0 || range.startOffset > (sourceTextNode?.nodeValue?.length ?? 0)) {
    throw new Error('The cursor position could not be mapped to the source XML.');
  }
  return {
    elementType: renderedParent.localName,
    sourcePath,
    reference: `caret:${childIndex}:${range.startOffset}`,
  };
};

export const resolveCrossReference = (xmlDoc: Document, reference: string): Element => {
  const element = resolvePathReference(xmlDoc, reference) ?? elementByXmlId(xmlDoc, reference.replace(/^#/, ''));
  const name = element?.localName.toLowerCase();
  if (!element || !['anchor', 'link', 'ref'].includes(name ?? '')) {
    throw new Error('The cross-reference could not be found.');
  }
  if (name === 'anchor' && element.getAttribute('type') !== 'cross-reference') {
    throw new Error('The selected anchor is not a cross-reference target.');
  }
  return element;
};

export const crossReferenceKind = (element: Element): CrossReferenceKind => {
  const name = element.localName.toLowerCase();
  if (name === 'anchor') return 'generic-target';
  if (name === 'ref') {
    return /^https?:\/\//i.test(element.getAttribute('target') ?? '') ? 'external-url' : 'internal-url';
  }
  return 'generic-start';
};

export const readCrossReference = (element: Element): CrossReferenceData => ({
  kind: crossReferenceKind(element),
  target: element.getAttribute('target') ?? element.getAttribute('xml:id') ?? '',
});

export const insertCrossReference = (xmlDoc: Document, sourcePath: string, caretReference: string, data: CrossReferenceData): Element => {
  const element = createReferenceElement(xmlDoc, data);
  if (caretReference === 'selection') insertAtSelection(xmlDoc, data.kind, element);
  else insertAtCaret(xmlDoc, sourcePath, caretReference, element);
  return element;
};

export const updateCrossReference = (element: Element, target: string): Element => {
  const kind = crossReferenceKind(element);
  if (kind === 'generic-target') return element;
  element.setAttribute('target', normalizeCrossReferenceTarget(kind, target));
  return element;
};

export const deleteCrossReference = (element: Element): void => {
  if (element.childNodes.length > 0) unwrap(element);
  else element.remove();
};
