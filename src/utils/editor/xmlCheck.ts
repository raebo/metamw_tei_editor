import { EditorUtils } from "./index";
import React from 'react';

export const xmlCheck = {
  xmlLetterDate: (
    xmlRef: React.RefObject<HTMLDivElement>
  ) : string => {

    if (xmlRef.current === null) { throw new Error('XML reference is null'); }

    const xmlContainer = xmlRef.current.querySelector('#letterXmlContent');

    if (!xmlContainer || !xmlContainer.firstChild) {
      console.warn("No valid XML content found in letterXmlContent");
      return new Date().toISOString().split('T')[0];
    }
    const firstElement = xmlContainer.firstChild as Element;
    const letterNameValue = firstElement.getAttribute("xml:id") ?? '';

    if (letterNameValue === undefined) {
      console.warn("No xml:id attribute found in the first element of letterXmlContent");
      return new Date().toISOString().split('T')[0];
    }
    const parts = letterNameValue.split('-');

    return parts.slice(1, 4).join('-');
  },
  createDocumentFromNodeToTeiRoot: (node: Node): Document => {
    let current: Node | null = node;

    while (current && (current as Element).tagName?.toLowerCase() !== 'tei') {
      current = current.parentNode;
      if (!current) throw new Error("Reached top of tree without finding <tei>");
    }

    const teiElement = current as Element;

    return xmlCheck.parseXml(teiElement.outerHTML);
  },
	extractXmlByRef: (xmlRef: React.RefObject<HTMLDivElement> | null): XMLDocument => {
		if (xmlRef === null || xmlRef.current === null) {
			throw new Error('XML reference is null');
		}

		const container = xmlRef.current?.querySelector<HTMLDivElement>('#letterXmlContent');

		if (!container) { throw new Error('No valid XML content found in letterXmlContent'); }

		const xmlString = container.innerHTML.trim();

		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(xmlString, "application/xml");

		if (xmlDoc.getElementsByTagName("parsererror").length) {
			throw new Error("Error parsing XML: " + xmlDoc.getElementsByTagName("parsererror")[0].textContent);
		}

		return xmlDoc;
	},
  parseXml: (xmlString: string) : Document => {
    return new DOMParser().parseFromString(xmlString, "text/xml");
  },
  serializeDocument: (doc: Document): string => {
    return new XMLSerializer().serializeToString(doc)
  },
  elementByXmlTypeAndId: (xmlId: string, nodeType: string, doc: Document = document): Element | null => {
    const baseNode = doc ? doc : document.getElementById("letterXml");

    if (!baseNode) return null;

    return Array.from(baseNode.querySelectorAll(nodeType))
      .find((node) => node.getAttribute("xml:id") === xmlId) || null;
  },
  letterXml: () : string | null => {
    const baseNode = document.getElementById('letterXmlContent')

    if (baseNode === null) {
      return null
    } else {
      return baseNode.innerHTML
    }
  },
  getAncestorsNodes: (node: Node): ParentNode[] => {
    const ancestors = [];
    let callAgain = true
    while (node.parentNode && callAgain) {
      ancestors.push(node.parentNode);
      node = node.parentNode;
      if (node.nodeName === "TEI" || node.nodeName === 'tei') {
        callAgain = false
      }
    }
    return ancestors;
  },
  getAncestorNodeNames(node: Node): String[] {
    const ancestorNames: String[] = []

    // eslint-disable-next-line array-callback-return
    this.getAncestorsNodes(node).map((ancestor) => {
      if (ancestor.nodeType === Node.ELEMENT_NODE) {
        ancestorNames.push(ancestor.nodeName.toLowerCase());
      }
    })

    return ancestorNames;
  },
  isADeletableNode(
    node: Node,
    onValid: (node: Node) => void,
    onInvalid: (message: string) => void
  ): boolean {

    const { nodeAnchestorPaths } = EditorUtils.removeNodeHandles

    const ancestorNodeNames = [
      node.nodeName.toLowerCase(), ...EditorUtils.xmlCheck.getAncestorNodeNames(node)
    ].reverse().join(" ")

    const matchingEntry = nodeAnchestorPaths().find(entry => {
      return entry.parentPath.toLowerCase() === ancestorNodeNames;
    });

    if (!matchingEntry) {
      onInvalid("Knoten ist nicht löschbar: " + ancestorNodeNames);
      return false;
    }

    if (matchingEntry.checkElementDetails(node as Element)) {
      onValid(node);
      return true
    } else {
      onInvalid("Knoten ist nicht löschbar checkElementDetails: " + ancestorNodeNames);
      return false;
    }
  },
  getSelectionOffsets(rootElement: HTMLElement, range: Range): { start: number; end: number } | null {
    let walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT, null);
    let currentNode: Node | null = walker.nextNode();
    let currentOffset = 0;
    let selectionStart = -1, selectionEnd = -1;

    while (currentNode) {
      if (currentNode.nodeType === Node.TEXT_NODE && currentNode.nodeValue) {
        const textLength = currentNode.nodeValue.length;

        // Check if the selection starts in this node
        if (currentNode === range.startContainer) {
          selectionStart = currentOffset + range.startOffset;
        }
        // Check if the selection ends in this node
        if (currentNode === range.endContainer) {
          selectionEnd = currentOffset + range.endOffset;
          break;
        }

        currentOffset += textLength;
      }
      currentNode = walker.nextNode();
    }

    return selectionStart !== -1 && selectionEnd !== -1 ? { start: selectionStart, end: selectionEnd } : null;
  },
  checkSelectionRestrictedTags(xmlDoc: Document, selectionStart: number, selectionEnd: number, restrictedTags: string[]): boolean {
    const walker = xmlDoc.createTreeWalker(xmlDoc.documentElement, NodeFilter.SHOW_TEXT, null);
    let currentNode: Node | null = walker.nextNode();
    let currentOffset = 0;

    while (currentNode) {
      if (currentNode.nodeType === Node.TEXT_NODE && currentNode.nodeValue) {

        // console.log("currentNode", currentNode.nodeValue)

        const parentTag = currentNode.parentElement?.tagName ?? "";
        const textLength = currentNode.nodeValue.length;

        // Check if this text node is inside a restricted tag
        if (restrictedTags.includes(parentTag)) {
          const startInRestricted = selectionStart >= currentOffset && selectionStart < currentOffset + textLength;
          const endInRestricted = selectionEnd > currentOffset && selectionEnd <= currentOffset + textLength;
          const fullyInside = selectionStart >= currentOffset && selectionEnd <= currentOffset + textLength;

          if (startInRestricted || endInRestricted || fullyInside) {
            return false;
          }
        }
        currentOffset += textLength;
      }
      currentNode = walker.nextNode();
    }

    return true;
  },
}
