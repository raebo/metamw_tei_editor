import { v4 as uuidv4 } from 'uuid';
import { EditorConstants } from '@src/constants/editor';
import { xmlCheck } from './xmlCheck';

export const FOREIGN_HAND_ANNOTATION_SUBTYPES = ['name', 'anonymus', 'library', 'receiver', 'editor'] as const;
export const FOREIGN_HAND_ANNOTATION_PLACES = ['bottom', 'below', 'above', 'top', 'margin', 'overleaf', 'inspace', 'opposite'] as const;

export type ForeignHandAnnotationSubtype = (typeof FOREIGN_HAND_ANNOTATION_SUBTYPES)[number];
export type ForeignHandAnnotationPlace = (typeof FOREIGN_HAND_ANNOTATION_PLACES)[number];

export type ForeignHandAnnotationData = {
  content: string;
  subtype: string;
  place: string;
  responsibility: string;
  number: string;
};

export type ForeignHandAnnotationCaret = {
  elementType: string;
  sourcePath: string;
  reference: string;
};

const CARET_REFERENCE_PATTERN = /^caret:(\d+):(\d+)$/;
const PERSON_REFERENCE_PATTERN = /^#?PSN\d{7}$/;
const hasControlCharacters = (value: string): boolean =>
  Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127;
  });

const isElement = (node: Node | null): node is Element => node?.nodeType === Node.ELEMENT_NODE;
const isAllowedSubtype = (value: string): value is ForeignHandAnnotationSubtype =>
  FOREIGN_HAND_ANNOTATION_SUBTYPES.includes(value as ForeignHandAnnotationSubtype);
const isAllowedPlace = (value: string): value is ForeignHandAnnotationPlace =>
  FOREIGN_HAND_ANNOTATION_PLACES.includes(value as ForeignHandAnnotationPlace);

const assertInLetterBody = (element: Element): void => {
  let current: Element | null = element;
  while (current && current.localName.toLowerCase() !== 'body') current = current.parentElement;
  if (!current?.parentElement || current.parentElement.localName.toLowerCase() !== 'text') {
    throw new Error('The annotation position is not inside TEI/text/body.');
  }
};

const foreignHandAnnotationsInLetterBody = (xmlDoc: Document): Element[] =>
  Array.from(xmlDoc.getElementsByTagNameNS('*', 'note')).filter((note) => {
    if (note.getAttribute('type') !== 'note') return false;
    let parent = note.parentElement;
    while (parent && parent.localName.toLowerCase() !== 'body') parent = parent.parentElement;
    return parent?.parentElement?.localName.toLowerCase() === 'text';
  });

export const renumberForeignHandAnnotations = (xmlDoc: Document): void => {
  foreignHandAnnotationsInLetterBody(xmlDoc).forEach((note, index) => {
    note.setAttribute('n', String(index + 1));
  });
};

export const resolveAnnotationSourceElement = (xmlDoc: Document, encodedPath: string): Element => {
  const indexes = encodedPath === '' ? [] : encodedPath.split('.').map(Number);
  if (indexes.some((index) => !Number.isInteger(index) || index < 0)) {
    throw new Error('The annotation source path is invalid.');
  }

  let current: Node | null = xmlDoc.documentElement;
  for (const index of indexes) current = current?.childNodes[index] ?? null;
  if (!isElement(current)) throw new Error('The annotation source element could not be resolved.');
  assertInLetterBody(current);
  if (current.closest('note')) throw new Error('Annotations cannot be nested inside another note.');
  return current;
};

export const captureForeignHandAnnotationCaret = (
  xmlString: string,
  selection: Selection | null = window.getSelection(),
): ForeignHandAnnotationCaret => {
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

  const xmlDoc = xmlCheck.parseXml(xmlString);
  if (xmlDoc.querySelector('parsererror')) throw new Error('The source XML is not well-formed.');
  const sourceParent = resolveAnnotationSourceElement(xmlDoc, sourcePath);

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

const validateAnnotationData = (data: ForeignHandAnnotationData, current?: ForeignHandAnnotationData): ForeignHandAnnotationData => {
  const normalized = {
    content: data.content.trim(),
    subtype: data.subtype.trim(),
    place: data.place.trim(),
    responsibility: data.responsibility.trim(),
    number: data.number.trim(),
  };
  if (!normalized.content) throw new Error('Annotation content is required.');
  if (hasControlCharacters(normalized.content) || hasControlCharacters(normalized.responsibility)) {
    throw new Error('The annotation contains invalid control characters.');
  }
  if (!isAllowedSubtype(normalized.subtype) && normalized.subtype !== current?.subtype) {
    throw new Error('Unsupported annotation author type.');
  }
  if (!isAllowedPlace(normalized.place) && normalized.place !== current?.place) {
    throw new Error('Unsupported annotation position.');
  }
  if (normalized.subtype === 'name' && !normalized.responsibility) {
    throw new Error('A named writer requires a responsibility value.');
  }
  if (
    normalized.subtype === 'name' &&
    !PERSON_REFERENCE_PATTERN.test(normalized.responsibility) &&
    normalized.responsibility !== current?.responsibility
  ) {
    throw new Error('A named writer must be selected from the person index.');
  }
  if (isAllowedSubtype(normalized.subtype) && normalized.subtype !== 'name' && normalized.responsibility) {
    throw new Error('A responsibility value is only allowed for a named writer.');
  }
  return {
    ...normalized,
    responsibility:
      normalized.subtype === 'name' && PERSON_REFERENCE_PATTERN.test(normalized.responsibility)
        ? `#${normalized.responsibility.replace(/^#/, '')}`
        : normalized.responsibility,
  };
};

export const readForeignHandAnnotation = (note: Element): ForeignHandAnnotationData => {
  if (note.localName.toLowerCase() !== 'note' || note.getAttribute('type') !== 'note') {
    throw new Error('The selected element is not a foreign-hand annotation.');
  }
  return {
    content: note.textContent ?? '',
    subtype: note.getAttribute('subtype') ?? '',
    place: note.getAttribute('place') ?? '',
    responsibility: note.getAttribute('resp') ?? '',
    number: note.getAttribute('n') ?? '',
  };
};

export const insertForeignHandAnnotation = (
  xmlDoc: Document,
  sourcePath: string,
  caretReference: string,
  data: ForeignHandAnnotationData,
): Element => {
  const match = CARET_REFERENCE_PATTERN.exec(caretReference);
  if (!match) throw new Error('The annotation caret reference is invalid.');
  const parent = resolveAnnotationSourceElement(xmlDoc, sourcePath);
  const childIndex = Number(match[1]);
  const offset = Number(match[2]);
  const sourceTextNode = parent.childNodes[childIndex] ?? null;
  if (sourceTextNode?.nodeType !== Node.TEXT_NODE || offset > (sourceTextNode.nodeValue?.length ?? 0)) {
    throw new Error('The annotation text position could not be resolved.');
  }

  const normalized = validateAnnotationData(data);
  const note = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'note');
  note.setAttribute('xml:id', `note_${uuidv4()}`);
  note.setAttribute('type', 'note');
  note.setAttribute('subtype', normalized.subtype);
  note.setAttribute('place', normalized.place);
  note.setAttribute('style', 'hidden');
  if (normalized.responsibility) note.setAttribute('resp', normalized.responsibility);
  note.textContent = normalized.content;

  const sourceText = sourceTextNode.nodeValue ?? '';
  const suffix = sourceText.slice(offset);
  sourceTextNode.nodeValue = sourceText.slice(0, offset);
  parent.insertBefore(note, sourceTextNode.nextSibling);
  if (suffix) parent.insertBefore(xmlDoc.createTextNode(suffix), note.nextSibling);
  if (!sourceTextNode.nodeValue) sourceTextNode.remove();
  renumberForeignHandAnnotations(xmlDoc);
  return note;
};

export const updateForeignHandAnnotation = (note: Element, data: ForeignHandAnnotationData): Element => {
  const current = readForeignHandAnnotation(note);
  const normalized = validateAnnotationData(data, current);
  note.setAttribute('subtype', normalized.subtype);
  note.setAttribute('place', normalized.place);
  if (normalized.responsibility) note.setAttribute('resp', normalized.responsibility);
  else note.removeAttribute('resp');
  note.textContent = normalized.content;
  return note;
};

export const deleteForeignHandAnnotation = (note: Element): void => {
  readForeignHandAnnotation(note);
  const xmlDoc = note.ownerDocument;
  note.remove();
  renumberForeignHandAnnotations(xmlDoc);
};
