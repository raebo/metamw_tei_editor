import { EditorConstants } from '@src/constants/editor';

export type TeiListType = 'ordered' | 'unordered';
export type ListSortDirection = 'ascending' | 'descending';
export type ListStructureOperation =
  | 'list-empty-ordered'
  | 'list-empty-unordered'
  | 'list-selection-ordered'
  | 'list-selection-unordered'
  | 'list-add-item'
  | 'list-edit-item'
  | 'list-delete-item'
  | 'list-delete'
  | 'list-sort-ascending'
  | 'list-sort-descending';

const isElement = (node: Node | null): node is Element => node?.nodeType === Node.ELEMENT_NODE;

const localName = (element: Element): string => element.localName.toLowerCase();

const assertInLetterBody = (element: Element): void => {
  let current: Element | null = element;
  while (current && localName(current) !== 'body') current = current.parentElement;

  if (!current?.parentElement || localName(current.parentElement) !== 'text') {
    throw new Error('The selected element is not inside TEI/text/body.');
  }
};

const assertParagraph = (element: Element): void => {
  if (localName(element) !== 'p') throw new Error('The selected element is not a paragraph.');
  assertInLetterBody(element);
};

const copyAttributes = (source: Element, target: Element, includeXmlId: boolean): void => {
  Array.from(source.attributes).forEach((attribute) => {
    if (!includeXmlId && attribute.name === 'xml:id') return;
    if (attribute.namespaceURI) {
      target.setAttributeNS(attribute.namespaceURI, attribute.name, attribute.value);
    } else {
      target.setAttribute(attribute.name, attribute.value);
    }
  });
};

const createList = (xmlDoc: Document, type: TeiListType): Element => {
  const list = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'list');
  list.setAttribute('type', type);
  return list;
};

const createParagraphCopy = (paragraph: Element): Element => {
  const copy = paragraph.ownerDocument.createElementNS(EditorConstants.TEI_NS, 'p');
  copyAttributes(paragraph, copy, false);
  return copy;
};

const fragmentHasContent = (fragment: DocumentFragment): boolean =>
  Array.from(fragment.childNodes).some(
    (node) => node.nodeType === Node.ELEMENT_NODE || (node.nodeType === Node.TEXT_NODE && Boolean(node.nodeValue?.trim())),
  );

const cloneMarkedContent = (marker: Element, paragraph: Element): DocumentFragment => {
  let content = marker.ownerDocument.createDocumentFragment();
  Array.from(marker.childNodes).forEach((child) => content.appendChild(child.cloneNode(true)));

  let ancestor = marker.parentElement;
  while (ancestor && ancestor !== paragraph) {
    const wrapper = ancestor.cloneNode(false) as Element;
    wrapper.appendChild(content);
    content = marker.ownerDocument.createDocumentFragment();
    content.appendChild(wrapper);
    ancestor = ancestor.parentElement;
  }

  return content;
};

const containingList = (source: Element): Element => {
  let current: Element | null = source;
  while (current && localName(current) !== 'list') current = current.parentElement;
  if (!current) throw new Error('The selected element is not inside a list.');
  assertInLetterBody(current);
  return current;
};

const selectedItem = (source: Element): Element => {
  if (localName(source) !== 'item') throw new Error('The selected element is not a list item.');
  containingList(source);
  return source;
};

export const insertEmptyListAfter = (anchor: Element, type: TeiListType): Element => {
  assertInLetterBody(anchor);
  if (!anchor.parentNode || localName(anchor) === 'body') {
    throw new Error('A list cannot be inserted after the selected element.');
  }

  const list = createList(anchor.ownerDocument, type);
  anchor.parentNode.insertBefore(list, anchor.nextSibling);
  return list;
};

export const convertMarkedSelectionToList = (xmlDoc: Document, type: TeiListType): Element => {
  const markers = Array.from(xmlDoc.getElementsByTagNameNS('*', 'span')).filter((element) => element.classList.contains('marked'));
  if (markers.length !== 1) throw new Error('Exactly one marked text selection is required.');

  const marker = markers[0];
  let paragraph = marker.parentElement;
  while (paragraph && localName(paragraph) !== 'p') paragraph = paragraph.parentElement;
  if (!paragraph) throw new Error('The marked text is not inside a paragraph.');
  assertParagraph(paragraph);
  if (!paragraph.parentNode) throw new Error('The paragraph has no parent element.');

  const beforeRange = xmlDoc.createRange();
  beforeRange.setStart(paragraph, 0);
  beforeRange.setEndBefore(marker);
  const beforeContent = beforeRange.cloneContents();

  const afterRange = xmlDoc.createRange();
  afterRange.setStartAfter(marker);
  afterRange.setEnd(paragraph, paragraph.childNodes.length);
  const afterContent = afterRange.cloneContents();

  const replacements: Element[] = [];
  if (fragmentHasContent(beforeContent)) {
    const beforeParagraph = createParagraphCopy(paragraph);
    beforeParagraph.appendChild(beforeContent);
    replacements.push(beforeParagraph);
  }

  const list = createList(xmlDoc, type);
  const item = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'item');
  item.appendChild(cloneMarkedContent(marker, paragraph));
  list.appendChild(item);
  replacements.push(list);

  if (fragmentHasContent(afterContent)) {
    const afterParagraph = createParagraphCopy(paragraph);
    afterParagraph.appendChild(afterContent);
    replacements.push(afterParagraph);
  }

  const originalXmlId = paragraph.getAttribute('xml:id');
  if (originalXmlId) replacements[0].setAttribute('xml:id', originalXmlId);

  const replacement = xmlDoc.createDocumentFragment();
  replacements.forEach((element) => replacement.appendChild(element));
  paragraph.parentNode.replaceChild(replacement, paragraph);
  return list;
};

export const appendListItem = (source: Element, text: string): Element => {
  if (!text.trim()) throw new Error('List item text must not be empty.');
  const list = containingList(source);
  const item = source.ownerDocument.createElementNS(EditorConstants.TEI_NS, 'item');
  item.textContent = text.trim();
  list.appendChild(item);
  return item;
};

export const updateListItem = (source: Element, text: string): Element => {
  if (!text.trim()) throw new Error('List item text must not be empty.');
  const item = selectedItem(source);
  item.textContent = text.trim();
  return item;
};

export const removeListItem = (source: Element): Element => {
  const item = selectedItem(source);
  const list = containingList(item);
  item.remove();
  return list;
};

export const removeList = (source: Element): void => {
  containingList(source).remove();
};

export const sortListItems = (source: Element, direction: ListSortDirection): Element => {
  const list = containingList(source);
  const items = Array.from(list.children).filter((child) => localName(child) === 'item');
  const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
  const sorted = items
    .map((item, index) => ({
      item,
      index,
      text: item.textContent?.trim().replace(/\s+/g, ' ') ?? '',
    }))
    .sort((left, right) => {
      const comparison = collator.compare(left.text, right.text);
      const directedComparison = direction === 'ascending' ? comparison : -comparison;
      return directedComparison || left.index - right.index;
    });

  items.forEach((item) => item.remove());
  sorted.forEach(({ item }) => list.appendChild(item));
  return list;
};

export const isListElement = (node: Node | null): node is Element => isElement(node) && localName(node) === 'list';
