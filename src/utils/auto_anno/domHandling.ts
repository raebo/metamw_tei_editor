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
  referenceType: string,
  snippetEntity: SnippetEntity
): void => {
  const domNode = document.querySelector(`[xml\\:id="${xmlId}"]`);

  if (!domNode) { throw new Error(`No element found with xml:id="${xmlId}"`); }

  domNode.setAttribute("checked", "true");

  if (referenceType === "Person") {
    replacePersonDomNode(domNode, snippetEntity);
  } else if (referenceType === "Settlement") {
    replacePlaceDomNodeSettlement(domNode, snippetEntity);
  } else if (referenceType === "Institution") {
    replacePlaceDomNodeInstiSight(domNode, 'institution', snippetEntity);
  } else if (referenceType === "Sight") {
    replacePlaceDomNodeInstiSight(domNode, 'sight', snippetEntity);
  } else {
    throw new Error(`Unsupported reference type: ${referenceType}`);
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

const replacePlaceDomNodeSettlement = (
  placeNameNode: Element,
  snippetEntity: SnippetEntity
): void => {
  if (placeNameNode.tagName !== 'PLACENAME') { throw new Error(`Invalid element provided for ${placeNameNode.tagName}`); }

  const settlementNode = document.createElement("settlement");

  if (snippetEntity.entityKind) { settlementNode.setAttribute("type", snippetEntity.entityKind); }

  settlementNode.setAttribute("style", "hidden")
  settlementNode.textContent = snippetEntity.entityName
  placeNameNode.appendChild(settlementNode);

  if (snippetEntity.entityPlaceCountryName) {
    const countryNode = document.createElement("country");
    countryNode.textContent = snippetEntity.entityPlaceCountryName
    countryNode.setAttribute("style", "hidden")
    placeNameNode.appendChild(countryNode);
  }
}

const replacePlaceDomNodeInstiSight = (
  placeNameNode: Element,
  typeOfPlace: string,
  snippetEntity: SnippetEntity
): void => {
  if (placeNameNode.tagName !== 'PLACENAME') { throw new Error(`Invalid element provided for ${placeNameNode.tagName}`); }

  const nameNOde = document.createElement("name")
  nameNOde.setAttribute("key", snippetEntity.entityKey)
  nameNOde.setAttribute("type", typeOfPlace)
  nameNOde.setAttribute("sub_type", '')
  nameNOde.setAttribute("style", 'hidden')
  nameNOde.textContent = snippetEntity.entityName

  placeNameNode.appendChild(nameNOde)

  const settlementNode = document.createElement("settlement");
  settlementNode.setAttribute("type", 'locality');
  settlementNode.setAttribute("style", "hidden")

  if (snippetEntity.entitySettlementKind) { settlementNode.textContent = snippetEntity.entitySettlementKind}
  placeNameNode.appendChild(settlementNode);

  if (snippetEntity.entityPlaceCountryName) {
    const countryNode = document.createElement("country");
    countryNode.textContent = snippetEntity.entityPlaceCountryName
    countryNode.setAttribute("style", "hidden")
    placeNameNode.appendChild(countryNode);
  }

}


const replacePlaceDomNodeSight= (
  placeNameNode: Element,
  snippetEntity: SnippetEntity
): void => {
  if (placeNameNode.tagName !== 'PLACENAME') { throw new Error(`Invalid element provided for ${placeNameNode.tagName}`); }

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

  return transformedHTML.endsWith(';') ? transformedHTML.slice(0, -1) : transformedHTML;
}


export const removeMarkedSpans = (
  root: Element)
  : Element =>{
  const markedSpans = root.querySelectorAll('span.marked');

  markedSpans.forEach((span) => {
    while (span.firstChild) {
      span.parentNode?.insertBefore(span.firstChild, span);
    }
    span.parentNode?.removeChild(span);
  });

  return root
}