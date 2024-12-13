import { SnippetEntity } from "../../services/mappings/autoAnnoMappings";

/**
 * Replaces a DOM element with a surrounding span element with the class "marked".
 * Removes all existing <span> elements with the "marked" class before replacing.
 *
 * @param element - The DOM element to replace.
 */
export const domReplaceNodeWithMarkedSpan = (element: Element): void => {
  if (!element || !(element instanceof HTMLElement)) {
    throw new Error("Invalid element provided.");
  }

  const existingMarkedSpans = document.querySelectorAll("span.marked");
  existingMarkedSpans.forEach((span) => span.replaceWith(...span.childNodes));

  const span = document.createElement("span");
  span.className = "marked";

  element.replaceWith(span);
  span.appendChild(element);
}

export const autoAnnoReplaceDomNodeContent = (
  xmlId: string,
  referenceKey: string,
  referenceType: string,
  snippetEntity: SnippetEntity
): void => {
  const domNode = document.querySelector(`[xml\\:id="${xmlId}"]`);

  if (!domNode) { throw new Error(`No element found with xml:id="${xmlId}"`); }

  if (referenceType === "Person") {
    replacePersonDomNode(domNode, snippetEntity);
  } else {
    replacePlaceDomNode(domNode, snippetEntity);
  }
}

const replacePersonDomNode = (
  domNode: Element,
  snippetEntity: SnippetEntity
): void => {

  const nameNode = domNode.querySelector("name");
  if (!nameNode) { throw new Error("No name element found in DOM node."); }

  nameNode.setAttribute("key", snippetEntity.entityKey);
  nameNode.textContent = snippetEntity.entityName;
}

const replacePlaceDomNode = (
  domNode: Element,
  snippetEntity: SnippetEntity
): void => {
  const placeNameNode = domNode.querySelector("placeName");
  if (!placeNameNode) {
    return;
  }
  placeNameNode.setAttribute("key", snippetEntity.entityKey);

  placeNameNode.textContent = snippetEntity.entityName;
}

export const removeSnippetEntityFromDom = (
  xmlId: string
): void => {
  const domNode = document.querySelector(`[xml\\:id="${xmlId}"]`);

  if (!domNode) { throw new Error(`No element found with xml:id="${xmlId}"`); }

  const childNodes = Array.from(domNode.childNodes);
  let textContent = '';

  for (const node of childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      textContent += node.textContent?.trim() ?? '';
    } else if (node.nodeName.toLowerCase() === 'name') {
      break;
    }
  }
  const textNode = document.createTextNode(textContent);

  domNode.replaceWith(textNode);
}

export const transformLetterXmlForExport = (
  xmlString: string | null | undefined
): string  => {
  if (xmlString === undefined || !xmlString) { throw Error("No XML string provided."); }

  let transformedHTML = xmlString.replace(/\n\s*/g, ' ');

  transformedHTML = transformedHTML.replace(/<\/?persname/gi, (match) => match.replace(/persname/gi, 'persName'));
  transformedHTML = transformedHTML.replace(/<\/?placename/gi, (match) => match.replace(/placename/gi, 'placeName'));

  return transformedHTML;
}