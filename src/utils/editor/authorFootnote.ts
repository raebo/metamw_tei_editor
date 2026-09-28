import { v4 as uuidv4 } from 'uuid';
import { EditorConstants } from '@src/constants/editor';

export const AUTHOR_FOOTNOTE_REFERENCE_TYPES = ['Footnotes_reference', 'Fußnotenreferenz'] as const;

export type AuthorFootnoteData = {
  content: string;
  marker: string;
};

export type AuthorFootnotePair = {
  note: Element;
  reference: Element;
};

export type AuthorFootnoteCaret = {
  elementType: string;
  sourcePath: string;
  reference: string;
};

const CARET_REFERENCE_PATTERN = /^caret:(\d+):(\d+)$/;
const NUMERIC_MARKER_PATTERN = /^\d+$/;
const hasControlCharacters = (value: string): boolean =>
  Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127;
  });

const elementsByLocalName = (xmlDoc: Document, localName: string): Element[] => Array.from(xmlDoc.getElementsByTagNameNS('*', localName));

const elementByXmlId = (xmlDoc: Document, xmlId: string): Element | null =>
  Array.from(xmlDoc.getElementsByTagNameNS('*', '*')).find((element) => element.getAttribute('xml:id') === xmlId) ?? null;

const normalizedTarget = (target: string | null): string => (target ?? '').trim().replace(/^#/, '');
const isElement = (node: Node | null): node is Element => node?.nodeType === Node.ELEMENT_NODE;

const resolveSourceElement = (xmlDoc: Document, encodedPath: string): Element => {
  const indexes = encodedPath === '' ? [] : encodedPath.split('.').map(Number);
  if (indexes.some((index) => !Number.isInteger(index) || index < 0)) {
    throw new Error('The footnote source path is invalid.');
  }
  let current: Node | null = xmlDoc.documentElement;
  for (const index of indexes) current = current?.childNodes[index] ?? null;
  if (!isElement(current)) throw new Error('The footnote source element could not be resolved.');
  let body: Element | null = current;
  while (body && body.localName.toLowerCase() !== 'body') body = body.parentElement;
  if (!body?.parentElement || body.parentElement.localName.toLowerCase() !== 'text') {
    throw new Error('The footnote position is not inside TEI/text/body.');
  }
  if (current.closest('note')) throw new Error('Footnote references cannot be nested inside a note.');
  return current;
};

const isAuthorFootnote = (element: Element): boolean =>
  element.localName.toLowerCase() === 'note' && element.getAttribute('type') === 'footnote';

const isAuthorFootnoteReference = (element: Element): boolean =>
  element.localName.toLowerCase() === 'ref' &&
  AUTHOR_FOOTNOTE_REFERENCE_TYPES.includes(element.getAttribute('type') as (typeof AUTHOR_FOOTNOTE_REFERENCE_TYPES)[number]);

const validateData = (data: AuthorFootnoteData): AuthorFootnoteData => {
  const normalized = {
    content: data.content.trim(),
    marker: data.marker.trim(),
  };
  if (!normalized.content) throw new Error('Footnote content is required.');
  if (hasControlCharacters(normalized.content) || hasControlCharacters(normalized.marker)) {
    throw new Error('The footnote contains invalid control characters.');
  }
  return normalized;
};

const letterBody = (xmlDoc: Document): Element => {
  const body = elementsByLocalName(xmlDoc, 'body').find((element) => element.parentElement?.localName.toLowerCase() === 'text');
  if (!body) throw new Error('The XML document has no TEI/text/body element.');
  return body;
};

const referenceForNote = (xmlDoc: Document, note: Element): Element | null => {
  const noteId = note.getAttribute('xml:id');
  const targetedReferenceId = normalizedTarget(note.getAttribute('target'));
  const targetedReference = targetedReferenceId ? elementByXmlId(xmlDoc, targetedReferenceId) : null;
  if (targetedReference && isAuthorFootnoteReference(targetedReference)) return targetedReference;
  if (!noteId) return null;
  return (
    elementsByLocalName(xmlDoc, 'ref').find(
      (reference) => isAuthorFootnoteReference(reference) && normalizedTarget(reference.getAttribute('target')) === noteId,
    ) ?? null
  );
};

const noteForReference = (xmlDoc: Document, reference: Element): Element | null => {
  const noteId = normalizedTarget(reference.getAttribute('target'));
  const targetedNote = noteId ? elementByXmlId(xmlDoc, noteId) : null;
  if (targetedNote && isAuthorFootnote(targetedNote)) return targetedNote;
  const referenceId = reference.getAttribute('xml:id');
  if (!referenceId) return null;
  return (
    elementsByLocalName(xmlDoc, 'note').find(
      (note) => isAuthorFootnote(note) && normalizedTarget(note.getAttribute('target')) === referenceId,
    ) ?? null
  );
};

const synchronizePair = (pair: AuthorFootnotePair): void => {
  const noteId = pair.note.getAttribute('xml:id');
  const referenceId = pair.reference.getAttribute('xml:id');
  if (!noteId || !referenceId) throw new Error('The footnote and its reference require xml:id values.');
  pair.note.setAttribute('type', 'footnote');
  pair.note.setAttribute('subtype', 'author');
  pair.note.setAttribute('target', referenceId);
  if (!pair.note.getAttribute('place')) pair.note.setAttribute('place', 'in the footer of the page');
  pair.reference.setAttribute('type', 'Footnotes_reference');
  pair.reference.setAttribute('target', `#${noteId}`);
};

const renumberNumericFootnotes = (xmlDoc: Document): void => {
  const references = elementsByLocalName(xmlDoc, 'ref').filter(isAuthorFootnoteReference);
  let position = 0;
  references.forEach((reference) => {
    const note = noteForReference(xmlDoc, reference);
    if (!note) return;
    position += 1;
    const marker = note.getAttribute('n')?.trim() ?? '';
    if (!NUMERIC_MARKER_PATTERN.test(marker)) return;
    const number = String(position);
    note.setAttribute('n', number);
    reference.textContent = number;
  });
};

export const captureAuthorFootnoteCaret = (xmlString: string, selection: Selection | null = window.getSelection()): AuthorFootnoteCaret => {
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

export const resolveAuthorFootnote = (xmlDoc: Document, xmlId: string): AuthorFootnotePair => {
  const selected = elementByXmlId(xmlDoc, normalizedTarget(xmlId));
  if (!selected) throw new Error('The footnote could not be found.');
  const note = isAuthorFootnote(selected) ? selected : isAuthorFootnoteReference(selected) ? noteForReference(xmlDoc, selected) : null;
  const reference = isAuthorFootnoteReference(selected) ? selected : note ? referenceForNote(xmlDoc, note) : null;
  if (!note || !reference) throw new Error('The footnote reference is missing or defective.');
  return { note, reference };
};

export const readAuthorFootnote = (pair: AuthorFootnotePair): AuthorFootnoteData => {
  if (!isAuthorFootnote(pair.note) || !isAuthorFootnoteReference(pair.reference)) {
    throw new Error('The selected elements are not an author footnote pair.');
  }
  return {
    content: pair.note.textContent ?? '',
    marker: pair.note.getAttribute('n') ?? pair.reference.textContent ?? '',
  };
};

export const insertAuthorFootnote = (
  xmlDoc: Document,
  sourcePath: string,
  caretReference: string,
  data: AuthorFootnoteData,
): AuthorFootnotePair => {
  const caretMatch = CARET_REFERENCE_PATTERN.exec(caretReference);
  if (!caretMatch) throw new Error('The footnote caret reference is invalid.');
  const parent = resolveSourceElement(xmlDoc, sourcePath);
  const sourceTextNode = parent.childNodes[Number(caretMatch[1])] ?? null;
  const offset = Number(caretMatch[2]);
  if (sourceTextNode?.nodeType !== Node.TEXT_NODE || offset > (sourceTextNode.nodeValue?.length ?? 0)) {
    throw new Error('The footnote text position could not be resolved.');
  }

  const normalized = validateData(data);
  const id = uuidv4();
  const noteId = `fn_${id}`;
  const referenceId = `fnr_${id}`;
  const marker = normalized.marker || '0';
  const reference = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'ref');
  reference.setAttribute('type', 'Footnotes_reference');
  reference.setAttribute('xml:id', referenceId);
  reference.setAttribute('target', `#${noteId}`);
  reference.textContent = marker;

  const sourceText = sourceTextNode.nodeValue ?? '';
  const suffix = sourceText.slice(offset);
  sourceTextNode.nodeValue = sourceText.slice(0, offset);
  parent.insertBefore(reference, sourceTextNode.nextSibling);
  if (suffix) parent.insertBefore(xmlDoc.createTextNode(suffix), reference.nextSibling);
  if (!sourceTextNode.nodeValue) sourceTextNode.remove();

  const container = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'div');
  container.setAttribute('type', 'footnotes_area');
  container.setAttribute('xml:id', `div_${uuidv4()}`);
  const note = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'note');
  note.setAttribute('type', 'footnote');
  note.setAttribute('subtype', 'author');
  note.setAttribute('xml:id', noteId);
  note.setAttribute('target', referenceId);
  note.setAttribute('n', marker);
  note.setAttribute('place', 'in the footer of the page');
  note.textContent = normalized.content;
  container.appendChild(note);
  letterBody(xmlDoc).appendChild(container);
  renumberNumericFootnotes(xmlDoc);
  return { note, reference };
};

export const updateAuthorFootnote = (pair: AuthorFootnotePair, data: AuthorFootnoteData): AuthorFootnotePair => {
  const current = readAuthorFootnote(pair);
  const normalized = validateData(data);
  synchronizePair(pair);
  if (normalized.content !== current.content.trim()) pair.note.textContent = normalized.content;
  const marker = normalized.marker || pair.note.getAttribute('n') || '0';
  pair.note.setAttribute('n', marker);
  pair.reference.textContent = marker;
  renumberNumericFootnotes(pair.note.ownerDocument);
  return pair;
};

export const deleteAuthorFootnote = (pair: AuthorFootnotePair): void => {
  readAuthorFootnote(pair);
  const xmlDoc = pair.note.ownerDocument;
  const container = pair.note.parentElement;
  pair.reference.remove();
  pair.note.remove();
  if (
    container?.localName.toLowerCase() === 'div' &&
    container.getAttribute('type') === 'footnotes_area' &&
    container.children.length === 0 &&
    !container.textContent?.trim()
  ) {
    container.remove();
  }
  renumberNumericFootnotes(xmlDoc);
};
