import { EditorUtils } from "./index";
import React from 'react';
import {NodeAnchestorPath} from "./rightClickPathHandles";
import {EditorConstants} from "../../constants/editor";

export const xmlCheck = {
	// be careful with the path syntax: When giving an attribute, do not forget the @ before the attribute name
  // this is correct:  EditorUtils.xmlCheck.queryPath(teiHeader, `fileDesc > titleStmt > title[@type='${titleType}']`)
	// this is incorrect: EditorUtils.xmlCheck.queryPath(teiHeader, `fileDesc > titleStmt > title[type='${titleType}']`)
	queryPath: (root: Element | XMLDocument, path: string): Element[] => {
		const doc = root.nodeType === Node.DOCUMENT_NODE
			? root as XMLDocument
			: (root.ownerDocument as XMLDocument);

		if (!doc) return [];

		const xpath = path
			.split(">")
			.map(part => {
				const match = part.match(/^([^\[]+)(\[.*\])?$/); // split name and [..]
				if (!match) return "";

				const nodeName = match[1].trim();
				const predicate = match[2]
					? match[2].replace(/\[([^\]=]+)=/g, "[$1=") // insert @ before attr name
					: "";

				return "tei:" + nodeName + predicate;
			})
			.join("/");

		const nsResolver = (prefix: string | null): string | null => {
			if (prefix === "tei") return EditorConstants.TEI_NS;
			return null;
		};

		if (!nsResolver)	{ throw new Error("Namespace resolver is not defined"); }

		const result = doc.evaluate(
			xpath,
			root,
			nsResolver,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null
		);

		const elements: Element[] = [];
		for (let i = 0; i < result.snapshotLength; i++) {
			const el = result.snapshotItem(i);
			if (el && el.nodeType === Node.ELEMENT_NODE) {
				elements.push(el as Element);
			}
		}

		return elements;
	},
	extractTeiDocumentFromString: (xmlString: string|  null) : XMLDocument => {
		if (!xmlString) throw new Error("XML string is null");

		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(xmlString, "application/xml") as unknown as XMLDocument;

		if (xmlDoc.getElementsByTagName("parsererror").length) {
			throw new Error("Error parsing XML: " + xmlDoc.getElementsByTagName("parsererror")[0].textContent);
		}

		return xmlDoc;
	},
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

    if (baseNode === null) { return null }

		let currentNode = baseNode as Element

		while (currentNode !== null && currentNode.tagName?.toLowerCase() !== 'tei') {
			if (currentNode.children.length === 0) break;
			currentNode = currentNode.children[0]
		}

		if (currentNode.tagName?.toLowerCase() !== 'tei') {
			throw new Error("No <tei> root element found");
		}

    return currentNode.outerHTML
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
  getAncestorNodeNames(node: Node): string[] {
    const ancestorNames: string[] = []

    // eslint-disable-next-line array-callback-return
    this.getAncestorsNodes(node).map((ancestor) => {
      if (ancestor.nodeType === Node.ELEMENT_NODE) {
        ancestorNames.push(ancestor.nodeName.toLowerCase());
      }
    })

    return ancestorNames;
  },
	isNodeMatchingPath(
		node: Node,
		nodeAnchestorPaths: NodeAnchestorPath[],
		onValid: (node: Node) => void,
		onInvalid: (message: string) => void
	) : boolean {
		const ancestorNodeNames = [
			node.nodeName.toLowerCase(),
			...EditorUtils.xmlCheck.getAncestorNodeNames(node)
		]
			.reverse()
			.join(" ");

		const matchingEntry = nodeAnchestorPaths.find(
			(entry) => {
				const pathMatches = entry.parentPath.toLowerCase() === ancestorNodeNames
				const attributesMatch = entry.checkAttributes ? entry.checkAttributes(node as Element) : true;

				return pathMatches && attributesMatch;
			}
		);

		if (!matchingEntry) {
			onInvalid("No matching entry for: " + ancestorNodeNames);
			return false;
		}

		// ✅ If checkElementDetails exists, call it
		if (matchingEntry.checkElementDetails) {
			if (!matchingEntry.checkElementDetails(node as Element)) {
				onInvalid("CheckElementDetails failed: " + ancestorNodeNames);
				return false;
			}
		}

		onValid(node);
		return true;
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
