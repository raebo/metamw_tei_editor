import { v4 as uuidv4 } from 'uuid';
import { EditorConstants } from '@src/constants/editor';

export type HorizontalFractionData = {
  numerator: string;
  denominator: string;
};

export type HorizontalFractionCaret = {
  elementType: string;
  sourcePath: string;
  reference: string;
};

const CARET_REFERENCE_PATTERN = /^caret:(\d+):(\d+)$/;

const isElement = (node: Node | null): node is Element => node?.nodeType === Node.ELEMENT_NODE;

const elementByXmlId = (xmlDoc: Document, xmlId: string): Element | null =>
  Array.from(xmlDoc.getElementsByTagNameNS('*', '*')).find((element) => element.getAttribute('xml:id') === xmlId) ?? null;

const elementByPath = (xmlDoc: Document, reference: string): Element | null => {
  if (!reference.startsWith('path:')) return null;
  const encodedPath = reference.slice(5);
  const indexes = encodedPath === '' ? [] : encodedPath.split('.').map(Number);
  if (indexes.some((index) => !Number.isInteger(index) || index < 0)) return null;

  let current: Node | null = xmlDoc.documentElement;
  for (const index of indexes) current = current?.childNodes[index] ?? null;
  return isElement(current) ? current : null;
};

const hasControlCharacters = (value: string): boolean =>
  Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127;
  });

const resolveSourceElement = (xmlDoc: Document, encodedPath: string): Element => {
  const indexes = encodedPath === '' ? [] : encodedPath.split('.').map(Number);
  if (indexes.some((index) => !Number.isInteger(index) || index < 0)) {
    throw new Error('The fraction source path is invalid.');
  }

  let current: Node | null = xmlDoc.documentElement;
  for (const index of indexes) current = current?.childNodes[index] ?? null;
  if (!isElement(current)) throw new Error('The fraction source element could not be resolved.');

  const paragraph = current.closest('p');
  if (!paragraph?.closest('body')) {
    throw new Error('Fractions can only be inserted in a paragraph in the letter body.');
  }
  if (current.closest('formula')) throw new Error('Fractions cannot be nested.');
  return current;
};

const normalizeData = (data: HorizontalFractionData): HorizontalFractionData => {
  const normalized = {
    numerator: data.numerator.trim(),
    denominator: data.denominator.trim(),
  };
  if (!normalized.numerator || !normalized.denominator) {
    throw new Error('Numerator and denominator are required.');
  }
  if (hasControlCharacters(normalized.numerator) || hasControlCharacters(normalized.denominator)) {
    throw new Error('The fraction contains invalid control characters.');
  }
  return normalized;
};

const directChildByRend = (formula: Element, rend: string): Element | null =>
  Array.from(formula.children).find((child) => child.localName.toLowerCase() === 'hi' && child.getAttribute('rend') === rend) ?? null;

const validateFraction = (formula: Element): { numerator: Element; separator: Element; denominator: Element } => {
  if (formula.localName.toLowerCase() !== 'formula' || formula.getAttribute('rend') !== 'fraction_bar') {
    throw new Error('The selected element is not a horizontal fraction.');
  }
  const numerator = directChildByRend(formula, 'supbar');
  const separator = directChildByRend(formula, 'barbar');
  const denominator = directChildByRend(formula, 'subbar');
  if (!numerator || !separator || !denominator) {
    throw new Error('The horizontal fraction structure is invalid.');
  }
  return { numerator, separator, denominator };
};

const createFractionElement = (xmlDoc: Document, data: HorizontalFractionData): Element => {
  const formula = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'formula');
  formula.setAttribute('xml:id', `formula_${uuidv4()}`);
  formula.setAttribute('rend', 'fraction_bar');

  const numerator = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'hi');
  numerator.setAttribute('rend', 'supbar');
  numerator.textContent = data.numerator;

  const separator = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'hi');
  separator.setAttribute('rend', 'barbar');
  separator.textContent = '/';

  const denominator = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'hi');
  denominator.setAttribute('rend', 'subbar');
  denominator.textContent = data.denominator;

  formula.append(numerator, separator, denominator);
  return formula;
};

export const captureHorizontalFractionCaret = (
  xmlString: string,
  selection: Selection | null = window.getSelection(),
): HorizontalFractionCaret => {
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
  if (!renderedParent || sourcePath === undefined || !renderedParent.closest('p[data-editor-xml-path]')) {
    throw new Error('Please place the cursor inside a paragraph in the letter text.');
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

export const insertHorizontalFraction = (
  xmlDoc: Document,
  sourcePath: string,
  caretReference: string,
  rawData: HorizontalFractionData,
): Element => {
  const caretMatch = CARET_REFERENCE_PATTERN.exec(caretReference);
  if (!caretMatch) throw new Error('The fraction caret reference is invalid.');

  const parent = resolveSourceElement(xmlDoc, sourcePath);
  const sourceTextNode = parent.childNodes[Number(caretMatch[1])] ?? null;
  const offset = Number(caretMatch[2]);
  if (sourceTextNode?.nodeType !== Node.TEXT_NODE || offset > (sourceTextNode.nodeValue?.length ?? 0)) {
    throw new Error('The fraction text position could not be resolved.');
  }

  const data = normalizeData(rawData);
  const formula = createFractionElement(xmlDoc, data);
  const sourceText = sourceTextNode.nodeValue ?? '';
  const prefix = sourceText.slice(0, offset);
  const suffix = sourceText.slice(offset);
  sourceTextNode.nodeValue = prefix && /\s$/u.test(prefix) ? prefix : `${prefix} `;
  parent.insertBefore(formula, sourceTextNode.nextSibling);
  parent.insertBefore(xmlDoc.createTextNode(suffix && /^\s/u.test(suffix) ? suffix : ` ${suffix}`), formula.nextSibling);
  return formula;
};

export const resolveHorizontalFraction = (xmlDoc: Document, reference: string): Element => {
  const formula = elementByPath(xmlDoc, reference) ?? elementByXmlId(xmlDoc, reference.replace(/^#/, ''));
  if (!formula) throw new Error('The horizontal fraction could not be found.');
  validateFraction(formula);
  return formula;
};

export const readHorizontalFraction = (formula: Element): HorizontalFractionData => {
  const { numerator, denominator } = validateFraction(formula);
  return {
    numerator: numerator.textContent ?? '',
    denominator: denominator.textContent ?? '',
  };
};

export const updateHorizontalFraction = (formula: Element, rawData: HorizontalFractionData): Element => {
  const { numerator, separator, denominator } = validateFraction(formula);
  const data = normalizeData(rawData);
  numerator.textContent = data.numerator;
  separator.textContent = '/';
  denominator.textContent = data.denominator;
  if (!formula.getAttribute('xml:id')) formula.setAttribute('xml:id', `formula_${uuidv4()}`);
  return formula;
};

export const deleteHorizontalFraction = (formula: Element): void => {
  validateFraction(formula);
  const parent = formula.parentNode;
  if (!parent) throw new Error('The horizontal fraction has no parent element.');

  const previous = formula.previousSibling;
  const next = formula.nextSibling;
  formula.remove();

  if (previous?.nodeType === Node.TEXT_NODE && next?.nodeType === Node.TEXT_NODE) {
    const left = previous.nodeValue ?? '';
    const right = next.nodeValue ?? '';
    const leftContent = left.trimEnd();
    const rightContent = right.trimStart();
    previous.nodeValue = leftContent && rightContent ? `${leftContent} ${rightContent}` : leftContent || rightContent;
    next.remove();
    return;
  }

  if (!next && previous?.nodeType === Node.TEXT_NODE) {
    previous.nodeValue = (previous.nodeValue ?? '').trimEnd();
  }
  if (!previous && next?.nodeType === Node.TEXT_NODE) {
    next.nodeValue = (next.nodeValue ?? '').trimStart();
  }
};
