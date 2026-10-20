import { v4 as uuidv4 } from 'uuid';
import { EditorConstants } from '@src/constants/editor';

export type FractionData = {
  numerator: string;
  denominator: string;
};

export type FractionCaret = {
  elementType: string;
  sourcePath: string;
  reference: string;
};

export type FractionVariant = 'horizontal' | 'vertical-slash' | 'vertical-noslash';

type FractionStructure = {
  formulaRend: string;
  numeratorRend: string;
  separatorRend: string;
  separatorText: string;
  denominatorRend: string;
};

export const FRACTION_STRUCTURES: Record<FractionVariant, FractionStructure> = {
  horizontal: {
    formulaRend: 'fraction_bar',
    numeratorRend: 'supbar',
    separatorRend: 'barbar',
    separatorText: '/',
    denominatorRend: 'subbar',
  },
  'vertical-slash': {
    formulaRend: 'fraction_slash',
    numeratorRend: 'supslash',
    separatorRend: 'barslash',
    separatorText: '',
    denominatorRend: 'subslash',
  },
  'vertical-noslash': {
    formulaRend: 'fraction_noslash',
    numeratorRend: 'supnoslash',
    separatorRend: 'barnoslash',
    separatorText: '/',
    denominatorRend: 'subnoslash',
  },
};

export type HorizontalFractionData = FractionData;
export type HorizontalFractionCaret = FractionCaret;

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

const normalizeData = (data: FractionData): FractionData => {
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

const structureForFormula = (formula: Element): [FractionVariant, FractionStructure] => {
  const entry = Object.entries(FRACTION_STRUCTURES).find(([, structure]) => structure.formulaRend === formula.getAttribute('rend'));
  if (formula.localName.toLowerCase() !== 'formula' || !entry) {
    throw new Error('The selected element is not a supported fraction.');
  }
  return entry as [FractionVariant, FractionStructure];
};

const validateFraction = (
  formula: Element,
  expectedVariant?: FractionVariant,
): { variant: FractionVariant; numerator: Element; separator: Element; denominator: Element } => {
  const [variant, structure] = structureForFormula(formula);
  if (expectedVariant && variant !== expectedVariant) throw new Error('The selected fraction has a different display variant.');
  const numerator = directChildByRend(formula, structure.numeratorRend);
  const separator = directChildByRend(formula, structure.separatorRend);
  const denominator = directChildByRend(formula, structure.denominatorRend);
  if (!numerator || !separator || !denominator) {
    throw new Error('The fraction structure is invalid.');
  }
  return { variant, numerator, separator, denominator };
};

const createFractionElement = (xmlDoc: Document, variant: FractionVariant, data: FractionData): Element => {
  const structure = FRACTION_STRUCTURES[variant];
  const formula = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'formula');
  formula.setAttribute('xml:id', `formula_${uuidv4()}`);
  formula.setAttribute('rend', structure.formulaRend);

  const numerator = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'hi');
  numerator.setAttribute('rend', structure.numeratorRend);
  numerator.textContent = data.numerator;

  const separator = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'hi');
  separator.setAttribute('rend', structure.separatorRend);
  separator.textContent = structure.separatorText;

  const denominator = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'hi');
  denominator.setAttribute('rend', structure.denominatorRend);
  denominator.textContent = data.denominator;

  formula.append(numerator, separator, denominator);
  return formula;
};

export const captureFractionCaret = (xmlString: string, selection: Selection | null = window.getSelection()): FractionCaret => {
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

export const insertFraction = (
  xmlDoc: Document,
  sourcePath: string,
  caretReference: string,
  rawData: FractionData,
  variant: FractionVariant,
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
  const formula = createFractionElement(xmlDoc, variant, data);
  const sourceText = sourceTextNode.nodeValue ?? '';
  const prefix = sourceText.slice(0, offset);
  const suffix = sourceText.slice(offset);
  sourceTextNode.nodeValue = prefix && /\s$/u.test(prefix) ? prefix : `${prefix} `;
  parent.insertBefore(formula, sourceTextNode.nextSibling);
  parent.insertBefore(xmlDoc.createTextNode(suffix && /^\s/u.test(suffix) ? suffix : ` ${suffix}`), formula.nextSibling);
  return formula;
};

export const resolveFraction = (xmlDoc: Document, reference: string, expectedVariant?: FractionVariant): Element => {
  const formula = elementByPath(xmlDoc, reference) ?? elementByXmlId(xmlDoc, reference.replace(/^#/, ''));
  if (!formula) throw new Error('The fraction could not be found.');
  validateFraction(formula, expectedVariant);
  return formula;
};

export const readFraction = (formula: Element): FractionData & { variant: FractionVariant } => {
  const { variant, numerator, denominator } = validateFraction(formula);
  return {
    variant,
    numerator: numerator.textContent ?? '',
    denominator: denominator.textContent ?? '',
  };
};

export const readHorizontalFraction = (formula: Element): HorizontalFractionData => {
  const { numerator, denominator } = validateFraction(formula);
  return {
    numerator: numerator.textContent ?? '',
    denominator: denominator.textContent ?? '',
  };
};

export const updateFraction = (formula: Element, rawData: FractionData, expectedVariant?: FractionVariant): Element => {
  const { variant, numerator, separator, denominator } = validateFraction(formula, expectedVariant);
  const data = normalizeData(rawData);
  numerator.textContent = data.numerator;
  separator.textContent = FRACTION_STRUCTURES[variant].separatorText;
  denominator.textContent = data.denominator;
  if (!formula.getAttribute('xml:id')) formula.setAttribute('xml:id', `formula_${uuidv4()}`);
  return formula;
};

export const deleteFraction = (formula: Element, expectedVariant?: FractionVariant): void => {
  validateFraction(formula, expectedVariant);
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

export const captureHorizontalFractionCaret = captureFractionCaret;

export const insertHorizontalFraction = (
  xmlDoc: Document,
  sourcePath: string,
  caretReference: string,
  rawData: HorizontalFractionData,
): Element => insertFraction(xmlDoc, sourcePath, caretReference, rawData, 'horizontal');

export const resolveHorizontalFraction = (xmlDoc: Document, reference: string): Element => resolveFraction(xmlDoc, reference, 'horizontal');

export const updateHorizontalFraction = (formula: Element, rawData: HorizontalFractionData): Element =>
  updateFraction(formula, rawData, 'horizontal');

export const deleteHorizontalFraction = (formula: Element): void => deleteFraction(formula, 'horizontal');
