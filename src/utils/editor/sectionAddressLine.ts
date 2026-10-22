import { v4 as uuidv4 } from 'uuid';
import { EditorConstants } from '@src/constants/editor';
import { resolveSourceElement } from './paragraphStructure';

const SECTION_NAME = /^div[1-7]?$/;
const XML_NS = 'http://www.w3.org/XML/1998/namespace';
const isTei = (element: Element): boolean =>
  !element.namespaceURI || element.namespaceURI === EditorConstants.TEI_NS;
const inBody = (element: Element): boolean => {
  let ancestor: Element | null = element;
  while (ancestor && ancestor.localName !== 'body') ancestor = ancestor.parentElement;
  return Boolean(ancestor && isTei(ancestor) && ancestor.parentElement?.localName === 'text');
};

export const isAddressLineBlock = (element: Element): boolean =>
  isTei(element) &&
  SECTION_NAME.test(element.localName) &&
  ['addrline', 'addrLine'].includes(element.getAttribute('type') ?? '');

export const canInsertSectionAddressLine = (element: Element): boolean => {
  if (!isTei(element) || !SECTION_NAME.test(element.localName) || isAddressLineBlock(element))
    return false;
  const parent = element.parentElement;
  return Boolean(
    parent &&
      isTei(parent) &&
      (parent.localName === 'body' || SECTION_NAME.test(parent.localName)) &&
      inBody(element),
  );
};

export const isSectionAddressLine = (line: Element): boolean => {
  const address = line.parentElement;
  const paragraph = address?.parentElement;
  const block = paragraph?.parentElement;
  return Boolean(
    isTei(line) &&
      line.localName === 'addrLine' &&
      address?.localName === 'address' &&
      paragraph?.localName === 'p' &&
      block &&
      isAddressLineBlock(block) &&
      inBody(block),
  );
};

export const resolveAddressSource = (doc: Document, reference: string): Element => {
  if (reference.startsWith('path:')) return resolveSourceElement(doc, reference.slice(5));
  const element = Array.from(doc.getElementsByTagName('*')).find(
    (candidate) => candidate.getAttribute('xml:id') === reference,
  );
  if (!element) throw new Error('The selected address source no longer exists.');
  return element;
};

export const insertSectionAddressLine = (section: Element): Element => {
  if (!canInsertSectionAddressLine(section))
    throw new Error('An address line requires a section in the letter body.');
  const doc = section.ownerDocument;
  const previous = section.previousElementSibling;
  let address =
    previous && previous.localName === section.localName && isAddressLineBlock(previous)
      ? Array.from(previous.children)
          .find((child) => child.localName === 'p')
          ?.children.item(0)
      : null;
  if (!address || address.localName !== 'address' || !isTei(address)) {
    const block = doc.createElementNS(EditorConstants.TEI_NS, section.localName);
    block.setAttribute('type', 'addrline');
    block.setAttributeNS(XML_NS, 'xml:id', `address_block_${uuidv4()}`);
    const paragraph = doc.createElementNS(EditorConstants.TEI_NS, 'p');
    address = doc.createElementNS(EditorConstants.TEI_NS, 'address');
    paragraph.appendChild(address);
    block.appendChild(paragraph);
    section.parentNode!.insertBefore(block, section);
  }
  const line = doc.createElementNS(EditorConstants.TEI_NS, 'addrLine');
  line.setAttributeNS(XML_NS, 'xml:id', `address_line_${uuidv4()}`);
  line.textContent = 'ADRLINE';
  address.appendChild(line);
  return line;
};

export const readSectionAddressLine = (line: Element): Element => {
  if (!isSectionAddressLine(line))
    throw new Error('The selected element is not a section address line.');
  return line;
};

export const updateSectionAddressLine = (line: Element, content: string): void => {
  if (
    /[\r\n\u2028\u2029]/.test(content) ||
    Array.from(content).some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  )
    throw new Error('The address must contain a single line without control characters.');
  readSectionAddressLine(line);
  if (Array.from(line.childNodes).some((child) => child.nodeType !== Node.TEXT_NODE)) {
    throw new Error('Structured address content must be edited in the XML view.');
  }
  line.textContent = content;
};

const hasContent = (element: Element): boolean =>
  Array.from(element.childNodes).some(
    (child) => child.nodeType !== Node.TEXT_NODE || Boolean(child.textContent?.trim()),
  );

export const deleteSectionAddressLine = (line: Element): void => {
  readSectionAddressLine(line);
  const address = line.parentElement!;
  const paragraph = address.parentElement!;
  const block = paragraph.parentElement!;
  const otherLines = Array.from(address.children).filter(
    (child) => child !== line && child.localName === 'addrLine',
  );
  if (
    !otherLines.length &&
    Array.from(address.childNodes).some(
      (child) =>
        child !== line && (child.nodeType !== Node.TEXT_NODE || Boolean(child.textContent?.trim())),
    )
  )
    throw new Error('The address contains other content that must be preserved.');
  line.remove();
  if (!otherLines.length) {
    address.remove();
    if (!hasContent(paragraph)) paragraph.remove();
    if (!hasContent(block)) block.remove();
  }
};
