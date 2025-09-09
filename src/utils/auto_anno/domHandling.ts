import { SnippetEntity } from "../../services/mappings/autoAnnoMappings";
import { EditorConstants } from "../../constants/editor";

export const markSpanAndScrollToId = (xmlId: String) => {
  const targetElement= document.querySelector('[xml\\:id="' + xmlId + '"]');

  if (targetElement) {
    const elementRect = targetElement.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.scrollY;

    // window.scrollTo(0, middle);
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',     // Scroll to the top of the element
    });

    domReplaceNodeWithMarkedSpan(targetElement);
  }
}

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

  if (!domNode) {
    throw new Error(`No DOM element found with xml:id="${xmlId}".`);
  }

  type ReferenceHandler = (domNode: Element, snippetEntity: any) => void;
  const referenceHandlers: Record<string, ReferenceHandler> = {
    Person: (domNode, snippetEntity) => replacePersonDomNode(domNode, snippetEntity),
    Settlement: (domNode, snippetEntity) => replacePlaceDomNodeSettlement(domNode, snippetEntity),
    Institution: (domNode, snippetEntity) => replacePlaceDomNodeInstiSight(domNode, 'institution', snippetEntity),
    Sight: (domNode, snippetEntity) => replacePlaceDomNodeInstiSight(domNode, 'sight', snippetEntity),
  };

  if (referenceHandlers.hasOwnProperty(referenceType)) {
    referenceHandlers[referenceType](domNode, snippetEntity);
  } else {
    throw new Error(`Unsupported reference type: "${referenceType}". Supported types are: ${Object.keys(referenceHandlers).join(', ')}`);
  }
}

export const referenceTypeForXmlId = (xmlId: string): string => {
  const domNode = document.querySelector(`[xml\\:id="${xmlId}"]`)

  if (!domNode) {
    throw new Error(`No DOM element found with xml:id="${xmlId}".`);
  }
  const referenceTypeMapping: Record<string, string> = {
    PERSNAME: "Person",
    PLACENAME: "Settlement",
  }

  if (referenceTypeMapping.hasOwnProperty(domNode.tagName)) {
    return referenceTypeMapping[domNode.tagName]
  } else {
    throw new Error(`Unsupported reference type: "${domNode.tagName}". Supported types are: ${Object.keys(referenceTypeMapping).join(', ')}`);
  }
}

const replacePersonDomNode = (
  domNode: Element,
  { entityKey, entityName }: { entityKey: string; entityName: string }
): void => {

  let nameNode = domNode.querySelector("name");
  if (!nameNode) {
    nameNode = document.createElement("name")
    nameNode.setAttribute("key", entityKey);
    nameNode.textContent = entityName;
    domNode.appendChild(nameNode);
  } else {
    nameNode.setAttribute("key", entityKey);
    nameNode.textContent = entityName;
  }
}

const replacePlaceDomNodeSettlement = (
  placeNameNode: Element,
  snippetEntity: SnippetEntity
): void => {
  if (placeNameNode.tagName !== 'PLACENAME') { throw new Error(`Invalid element provided for ${placeNameNode.tagName}`); }

  const settlementNode = document.createElement("settlement");

  if (snippetEntity.entityKind) { settlementNode.setAttribute("type", snippetEntity.entityKind); }

  settlementNode.setAttribute("style", "hidden")
  settlementNode.setAttribute("type", "locality")
  settlementNode.setAttribute("key", snippetEntity.entityKey)
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

  const nameNode = document.createElement("name")
  nameNode.setAttribute("key", snippetEntity.entityKey)
  nameNode.setAttribute("type", typeOfPlace)
  nameNode.setAttribute("sub_type", '')
  nameNode.setAttribute("style", 'hidden')
  nameNode.textContent = snippetEntity.entityName

  placeNameNode.appendChild(nameNode)

  console.log("snippetEntity: ", snippetEntity)

  const settlementNode = document.createElement("settlement");
  settlementNode.setAttribute("type", 'locality');
  settlementNode.setAttribute(("key"), snippetEntity.entityKey)
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
  transformedHTML = transformedHTML.replace(/schemalocation/gi, (match) => match.replace(/schemalocation/gi, 'schemaLocation'));
  transformedHTML = transformedHTML.replace(/&nbsp;/gi, " ");
  // transformedHTML = transformedHTML.replace(/&amp;c/gi, "&");

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

export const replaceWithCamelCase = (
  text: string
): string => {
  EditorConstants.camelCaseTags.forEach(tag => {
    const lowercaseTag = tag.toLowerCase();
    text = text.replace(new RegExp(`\\b${lowercaseTag}\\b`, 'g'), tag);
  });
  return text;
}

export const replaceDataKeys= (
  text: string
): string => {
  return text.replace(/data-key="(.*?)"/g, 'key="$1"')
}

export const removeTmpIds = (text: string): string => {
	// remove all tmp:id="..." or tmp_id="..."
	return text.replace(/\s?tmp:id=".*?"/g, '').replace(/\s?tmp_id=".*?"/g, '');
};
