import { SnippetEntity } from '@src/services/mappings/autoAnnoMappings';
import { EditorConstants } from '@src/constants/editor';

const letterXmlDocuments = new WeakMap<Element, XMLDocument>();

const findByXmlId = (root: Document | Element, xmlId: string): Element | null => {
  const elements =
    root instanceof Document
      ? Array.from(root.getElementsByTagName('*'))
      : [root, ...Array.from(root.getElementsByTagName('*'))];

  return elements.find((element) => element.getAttribute('xml:id') === xmlId) ?? null;
};

const queryByXmlId = (xmlId: string): Element | null =>
  findByXmlId(document.documentElement, xmlId);

const getLetterXmlRoot = (element: Element): Element | null => element.closest('#letterXml');

const getMirroredElements = (xmlId: string): Element[] => {
  const previewElement = queryByXmlId(xmlId);
  if (!previewElement) {
    throw new Error(`No DOM element found with xml:id="${xmlId}".`);
  }

  const letterRoot = getLetterXmlRoot(previewElement);
  const xmlDocument = letterRoot ? letterXmlDocuments.get(letterRoot) : undefined;
  const xmlElement = xmlDocument ? findByXmlId(xmlDocument, xmlId) : null;

  if (xmlDocument && !xmlElement) {
    throw new Error(`No XML source element found with xml:id="${xmlId}".`);
  }

  return xmlElement ? [previewElement, xmlElement] : [previewElement];
};

export const initializeLetterXmlExportSource = (root: Element, xmlString: string): void => {
  const xmlDocument = new DOMParser().parseFromString(xmlString, 'application/xml');
  if (xmlDocument.querySelector('parsererror')) {
    throw new Error('Cannot initialize letter export from invalid XML.');
  }

  letterXmlDocuments.set(root, xmlDocument);
};

export const markSpanAndScrollToId = (xmlId: string) => {
  const targetElement = queryByXmlId(xmlId);

  if (targetElement) {
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center', // Scroll to the top of the element
    });

    domReplaceNodeWithMarkedSpan(targetElement);
  }
};

/**
 * Replaces a DOM element with a surrounding span element with the class "marked".
 * Removes all existing <span> elements with the "marked" class before replacing.
 *
 * @param element - The DOM element to replace.
 */
export const domReplaceNodeWithMarkedSpan = (element: Element): void => {
  if (!element || !(element instanceof HTMLElement)) {
    throw new Error('Invalid element provided.');
  }

  const existingMarkedSpans = document.querySelectorAll('span.marked');
  existingMarkedSpans.forEach((span) => span.replaceWith(...span.childNodes));

  const span = document.createElement('span');
  span.className = 'marked';

  element.replaceWith(span);
  span.appendChild(element);
};

export const autoAnnoReplaceDomNodeContent = (
  xmlId: string,
  referenceType: string,
  snippetEntity: SnippetEntity,
): void => {
  type ReferenceHandler = (domNode: Element, snippetEntity: SnippetEntity) => void;
  const referenceHandlers: Record<string, ReferenceHandler> = {
    Person: (domNode, snippetEntity) => replacePersonDomNode(domNode, snippetEntity),
    Settlement: (domNode, snippetEntity) => replacePlaceDomNodeSettlement(domNode, snippetEntity),
    Institution: (domNode, snippetEntity) =>
      replacePlaceDomNodeInstiSight(domNode, 'institution', snippetEntity),
    Sight: (domNode, snippetEntity) =>
      replacePlaceDomNodeInstiSight(domNode, 'sight', snippetEntity),
  };

  if (Object.prototype.hasOwnProperty.call(referenceHandlers, referenceType)) {
    getMirroredElements(xmlId).forEach((element) =>
      referenceHandlers[referenceType](element, snippetEntity),
    );
  } else {
    throw new Error(
      `Unsupported reference type: "${referenceType}". Supported types are: ${Object.keys(referenceHandlers).join(', ')}`,
    );
  }
};

export const referenceTypeForXmlId = (xmlId: string): string => {
  const domNode = queryByXmlId(xmlId);

  if (!domNode) {
    throw new Error(`No DOM element found with xml:id="${xmlId}".`);
  }
  const referenceTypeMapping: Record<string, string> = {
    persname: 'Person',
    placename: 'Settlement',
  };
  const normalizedTagName = domNode.tagName.toLowerCase();

  if (Object.prototype.hasOwnProperty.call(referenceTypeMapping, normalizedTagName)) {
    return referenceTypeMapping[normalizedTagName];
  } else {
    throw new Error(
      `Unsupported reference type: "${domNode.tagName}". Supported types are: ${Object.keys(referenceTypeMapping).join(', ')}`,
    );
  }
};

const replacePersonDomNode = (
  domNode: Element,
  { entityKey, entityName }: { entityKey: string; entityName: string },
): void => {
  let nameNode = domNode.querySelector('name');
  if (!nameNode) {
    nameNode = domNode.ownerDocument.createElementNS(EditorConstants.TEI_NS, 'name');
    nameNode.setAttribute('key', entityKey);
    nameNode.textContent = entityName;
    domNode.appendChild(nameNode);
  } else {
    nameNode.setAttribute('key', entityKey);
    nameNode.textContent = entityName;
  }
};

const replacePlaceDomNodeSettlement = (
  placeNameNode: Element,
  snippetEntity: SnippetEntity,
): void => {
  if (placeNameNode.tagName.toLowerCase() !== 'placename') {
    throw new Error(`Invalid element provided for ${placeNameNode.tagName}`);
  }

  const settlementNode = placeNameNode.ownerDocument.createElementNS(
    EditorConstants.TEI_NS,
    'settlement',
  );

  if (snippetEntity.entityKind) {
    settlementNode.setAttribute('type', snippetEntity.entityKind);
  }

  settlementNode.setAttribute('style', 'hidden');
  settlementNode.setAttribute('type', 'locality');
  settlementNode.setAttribute('key', snippetEntity.entityKey);
  settlementNode.textContent = snippetEntity.entityName;
  placeNameNode.appendChild(settlementNode);

  if (snippetEntity.entityPlaceCountryName) {
    const countryNode = placeNameNode.ownerDocument.createElementNS(
      EditorConstants.TEI_NS,
      'country',
    );
    countryNode.textContent = snippetEntity.entityPlaceCountryName;
    countryNode.setAttribute('style', 'hidden');
    placeNameNode.appendChild(countryNode);
  }
};

const replacePlaceDomNodeInstiSight = (
  placeNameNode: Element,
  typeOfPlace: string,
  snippetEntity: SnippetEntity,
): void => {
  if (placeNameNode.tagName.toLowerCase() !== 'placename') {
    throw new Error(`Invalid element provided for ${placeNameNode.tagName}`);
  }

  const nameNode = placeNameNode.ownerDocument.createElementNS(EditorConstants.TEI_NS, 'name');
  nameNode.setAttribute('key', snippetEntity.entityKey);
  nameNode.setAttribute('type', typeOfPlace);
  nameNode.setAttribute('sub_type', '');
  nameNode.setAttribute('style', 'hidden');
  nameNode.textContent = snippetEntity.entityName;

  placeNameNode.appendChild(nameNode);

  const settlementNode = placeNameNode.ownerDocument.createElementNS(
    EditorConstants.TEI_NS,
    'settlement',
  );
  settlementNode.setAttribute('type', 'locality');
  settlementNode.setAttribute('key', snippetEntity.entityKey);
  settlementNode.setAttribute('style', 'hidden');

  if (snippetEntity.entitySettlementKind) {
    settlementNode.textContent = snippetEntity.entitySettlementKind;
  }
  placeNameNode.appendChild(settlementNode);

  if (snippetEntity.entityPlaceCountryName) {
    const countryNode = placeNameNode.ownerDocument.createElementNS(
      EditorConstants.TEI_NS,
      'country',
    );
    countryNode.textContent = snippetEntity.entityPlaceCountryName;
    countryNode.setAttribute('style', 'hidden');
    placeNameNode.appendChild(countryNode);
  }
};

export const removeSnippetEntityFromDom = (xmlId: string): void => {
  getMirroredElements(xmlId).forEach((domNode) => {
    const childNodes = Array.from(domNode.childNodes);
    let textContent = '';

    for (const node of childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        textContent += node.textContent?.trim() ?? '';
      } else if (node.nodeName.toLowerCase() === 'name') {
        break;
      }
    }
    const textNode = domNode.ownerDocument.createTextNode(textContent);

    domNode.replaceWith(textNode);
  });
};

export const serializeLetterXmlForExport = (root: Element): string => {
  const xmlDocument = letterXmlDocuments.get(root);
  if (!xmlDocument) {
    throw new Error('No XML export source initialized.');
  }

  return new XMLSerializer().serializeToString(xmlDocument);
};

export const removeMarkedSpans = (root: Element): Element => {
  const markedSpans = root.querySelectorAll('span.marked');

  markedSpans.forEach((span) => {
    while (span.firstChild) {
      span.parentNode?.insertBefore(span.firstChild, span);
    }
    span.parentNode?.removeChild(span);
  });

  return root;
};
