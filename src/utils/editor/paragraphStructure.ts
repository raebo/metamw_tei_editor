import { EditorConstants } from '@src/constants/editor';

export type ParagraphVariant = 'indented' | 'without-indent' | 'hanging' | 'centered' | 'right' | 'without-indent-indented';

export type SectionPosition = 'child' | 'sibling';

export type ParagraphStructureOperation =
  | 'paragraph-insert'
  | 'paragraph-convert'
  | 'paragraph-split'
  | 'section-child'
  | 'section-sibling'
  | 'section-edit';

export const PARAGRAPH_VARIANTS: readonly ParagraphVariant[] = [
  'indented',
  'without-indent',
  'hanging',
  'centered',
  'right',
  'without-indent-indented',
];

const PARAGRAPH_STYLES: Record<ParagraphVariant, string | null> = {
  indented: null,
  'without-indent': 'paragraph_without_indent',
  hanging: 'paragraph_hanging',
  centered: 'paragraph centered',
  right: 'paragraph_right',
  'without-indent-indented': 'paragraph_without_indent_indented',
};

const SECTION_TAG_PATTERN = /^div([1-7])?$/;

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

const applyParagraphVariant = (paragraph: Element, variant: ParagraphVariant): void => {
  const style = PARAGRAPH_STYLES[variant];
  if (style === null) paragraph.removeAttribute('style');
  else paragraph.setAttribute('style', style);
};

const createParagraph = (xmlDoc: Document, variant: ParagraphVariant, source?: Element): Element => {
  const paragraph = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'p');
  if (source) copyAttributes(source, paragraph, false);
  applyParagraphVariant(paragraph, variant);
  return paragraph;
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

export const paragraphVariantFromElement = (paragraph: Element): ParagraphVariant => {
  const style = paragraph.getAttribute('style');
  const entry = Object.entries(PARAGRAPH_STYLES).find(([, value]) => value === style);
  return (entry?.[0] as ParagraphVariant | undefined) ?? 'indented';
};

export const resolveSourceElement = (xmlDoc: Document, encodedPath: string): Element => {
  const path = encodedPath === '' ? [] : encodedPath.split('.').map(Number);
  if (path.some((index) => !Number.isInteger(index) || index < 0)) {
    throw new Error('The selected source path is invalid.');
  }

  let current: Node | null = xmlDoc.documentElement;
  for (const index of path) current = current?.childNodes[index] ?? null;

  if (!isElement(current)) throw new Error('The selected source element could not be resolved.');
  return current;
};

export const insertParagraphAfter = (paragraph: Element, variant: ParagraphVariant, text: string): Element => {
  assertParagraph(paragraph);
  if (!text.trim()) throw new Error('Paragraph text must not be empty.');
  if (!paragraph.parentNode) throw new Error('The paragraph has no parent element.');

  const newParagraph = createParagraph(paragraph.ownerDocument, variant);
  newParagraph.textContent = text.trim();
  paragraph.parentNode.insertBefore(newParagraph, paragraph.nextSibling);
  return newParagraph;
};

export const convertParagraph = (paragraph: Element, variant: ParagraphVariant): Element => {
  assertParagraph(paragraph);
  applyParagraphVariant(paragraph, variant);
  return paragraph;
};

export const splitMarkedParagraph = (xmlDoc: Document, variant: ParagraphVariant): Element => {
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

  const result: Element[] = [];
  if (fragmentHasContent(beforeContent)) {
    const beforeParagraph = createParagraph(xmlDoc, paragraphVariantFromElement(paragraph), paragraph);
    beforeParagraph.appendChild(beforeContent);
    result.push(beforeParagraph);
  }

  const selectedParagraph = createParagraph(xmlDoc, variant, paragraph);
  selectedParagraph.appendChild(cloneMarkedContent(marker, paragraph));
  result.push(selectedParagraph);

  if (fragmentHasContent(afterContent)) {
    const afterParagraph = createParagraph(xmlDoc, paragraphVariantFromElement(paragraph), paragraph);
    afterParagraph.appendChild(afterContent);
    result.push(afterParagraph);
  }

  const originalXmlId = paragraph.getAttribute('xml:id');
  if (originalXmlId) result[0].setAttribute('xml:id', originalXmlId);

  const replacement = xmlDoc.createDocumentFragment();
  result.forEach((item) => replacement.appendChild(item));
  paragraph.parentNode.replaceChild(replacement, paragraph);
  return selectedParagraph;
};

export const childSectionTag = (section: Element): string | null => {
  assertInLetterBody(section);
  const tagName = localName(section);
  if (tagName === 'body' || tagName === 'div') return 'div';

  const match = tagName.match(SECTION_TAG_PATTERN);
  if (!match) throw new Error('The selected element is not a section.');
  const level = Number(match[1]);
  return level < 7 ? `div${level + 1}` : null;
};

export const canInsertSiblingSection = (section: Element): boolean => {
  assertInLetterBody(section);
  if (!SECTION_TAG_PATTERN.test(localName(section))) return false;
  return section.getAttribute('type') !== 'act_of_writing' && Boolean(section.parentElement);
};

export const insertSection = (section: Element, position: SectionPosition, heading: string, paragraphText: string): Element => {
  assertInLetterBody(section);
  if (!heading.trim() && !paragraphText.trim()) {
    throw new Error('A section requires a heading or paragraph text.');
  }

  let tagName: string;
  let parent: Node;
  let reference: Node | null;
  if (position === 'child') {
    const childTag = childSectionTag(section);
    if (!childTag) throw new Error('No section level is available below div7.');
    tagName = childTag;
    parent = section;
    reference = null;
  } else {
    if (!canInsertSiblingSection(section) || !section.parentNode) {
      throw new Error('A sibling section is not allowed in this context.');
    }
    tagName = localName(section);
    parent = section.parentNode;
    reference = section.nextSibling;
  }

  const newSection = section.ownerDocument.createElementNS(EditorConstants.TEI_NS, tagName);
  const head = section.ownerDocument.createElementNS(EditorConstants.TEI_NS, 'head');
  const paragraph = section.ownerDocument.createElementNS(EditorConstants.TEI_NS, 'p');
  head.textContent = heading.trim();
  paragraph.textContent = paragraphText.trim();
  newSection.append(head, paragraph);
  parent.insertBefore(newSection, reference);
  return newSection;
};

export const updateSectionHeading = (section: Element, heading: string): Element => {
  assertInLetterBody(section);
  if (!SECTION_TAG_PATTERN.test(localName(section)) || section.getAttribute('type') === 'act_of_writing') {
    throw new Error('The selected element is not an editable section.');
  }
  if (!heading.trim()) throw new Error('The section heading must not be empty.');

  let head = Array.from(section.children).find((child) => localName(child) === 'head');
  if (!head) {
    head = section.ownerDocument.createElementNS(EditorConstants.TEI_NS, 'head');
    section.insertBefore(head, section.firstChild);
  }
  head.textContent = heading.trim();
  return section;
};
