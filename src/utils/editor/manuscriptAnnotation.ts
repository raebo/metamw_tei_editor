import { v4 as uuidv4 } from 'uuid';
import { EditorConstants } from '@src/constants/editor';

const PATH_REFERENCE_PATTERN = /^path:(\d+(?:\.\d+)*)$/;
const hasControlCharacters = (value: string): boolean =>
  Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127;
  });

const directChild = (parent: Element, localName: string): Element | null =>
  Array.from(parent.children).find((child) => child.localName.toLowerCase() === localName.toLowerCase()) ?? null;

const createTeiElement = (xmlDoc: XMLDocument, localName: string): Element => xmlDoc.createElementNS(EditorConstants.TEI_NS, localName);

const insertBeforeFirst = (parent: Element, element: Element, followingNames: string[]): Element => {
  const following = Array.from(parent.children).find((child) => followingNames.includes(child.localName.toLowerCase()));
  parent.insertBefore(element, following ?? null);
  return element;
};

const ensureDirectChild = (xmlDoc: XMLDocument, parent: Element, localName: string, followingNames: string[] = []): Element =>
  directChild(parent, localName) ?? insertBeforeFirst(parent, createTeiElement(xmlDoc, localName), followingNames);

const ensureScriptDesc = (xmlDoc: XMLDocument): Element => {
  const root = xmlDoc.documentElement;
  if (!root || root.localName.toLowerCase() !== 'tei') {
    throw new Error('The XML document has no TEI root element.');
  }

  const teiHeader = ensureDirectChild(xmlDoc, root, 'teiHeader', ['text']);
  const fileDesc = ensureDirectChild(xmlDoc, teiHeader, 'fileDesc', ['encodingdesc', 'profiledesc', 'xenodata', 'revisiondesc']);
  const sourceDesc = ensureDirectChild(xmlDoc, fileDesc, 'sourceDesc');
  const msDesc = ensureDirectChild(xmlDoc, sourceDesc, 'msDesc');
  const physDesc = ensureDirectChild(xmlDoc, msDesc, 'physDesc', ['history', 'additional']);
  return ensureDirectChild(xmlDoc, physDesc, 'scriptDesc');
};

const validateContent = (content: string): string => {
  const normalized = content.trim();
  if (!normalized) throw new Error('Manuscript annotation content is required.');
  if (hasControlCharacters(normalized)) {
    throw new Error('The manuscript annotation contains invalid control characters.');
  }
  return normalized;
};

const assertManuscriptAnnotation = (element: Element): void => {
  if (element.localName.toLowerCase() !== 'p' || element.parentElement?.localName.toLowerCase() !== 'scriptdesc') {
    throw new Error('The selected element is not a manuscript annotation.');
  }
};

const resolvePathReference = (xmlDoc: XMLDocument, reference: string): Element | null => {
  const match = PATH_REFERENCE_PATTERN.exec(reference);
  if (!match) return null;
  let current: Node | null = xmlDoc.documentElement;
  for (const index of match[1].split('.').map(Number)) {
    current = current?.childNodes[index] ?? null;
  }
  return current?.nodeType === Node.ELEMENT_NODE ? (current as Element) : null;
};

export const manuscriptAnnotationReference = (element: Element, sourcePath: string): string =>
  element.getAttribute('xml:id') ?? `path:${sourcePath}`;

export const resolveManuscriptAnnotation = (xmlDoc: XMLDocument, reference: string): Element => {
  const byPath = resolvePathReference(xmlDoc, reference);
  const candidate =
    byPath ?? Array.from(xmlDoc.getElementsByTagNameNS('*', 'p')).find((element) => element.getAttribute('xml:id') === reference) ?? null;
  if (!candidate) throw new Error('The manuscript annotation could not be found.');
  assertManuscriptAnnotation(candidate);
  return candidate;
};

export const readManuscriptAnnotation = (annotation: Element): string => {
  assertManuscriptAnnotation(annotation);
  return annotation.textContent ?? '';
};

export const insertManuscriptAnnotation = (xmlDoc: XMLDocument, content: string): Element => {
  const annotation = createTeiElement(xmlDoc, 'p');
  annotation.setAttribute('xml:id', `script_annotation_${uuidv4()}`);
  annotation.textContent = validateContent(content);
  ensureScriptDesc(xmlDoc).appendChild(annotation);
  return annotation;
};

export const updateManuscriptAnnotation = (annotation: Element, content: string): Element => {
  assertManuscriptAnnotation(annotation);
  annotation.textContent = validateContent(content);
  if (!annotation.getAttribute('xml:id')) {
    annotation.setAttribute('xml:id', `script_annotation_${uuidv4()}`);
  }
  return annotation;
};

export const deleteManuscriptAnnotation = (annotation: Element): void => {
  assertManuscriptAnnotation(annotation);
  const scriptDesc = annotation.parentElement;
  annotation.remove();
  if (scriptDesc && scriptDesc.children.length === 0 && !scriptDesc.textContent?.trim()) {
    scriptDesc.remove();
  }
};
