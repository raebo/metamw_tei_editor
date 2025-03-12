export const xmlCheck = {

  elementByXmlTypeAndId: (xmlId: string, nodeType: string, doc: Document = document): Element | null => {
    const baseNode = doc ? doc : document.getElementById("letterXml");

    if (!baseNode) return null;

    return Array.from(baseNode.querySelectorAll(nodeType))
      .find((node) => node.getAttribute("xml:id") === xmlId) || null;
  },
  letterXml: () : string | null => {
    const baseNode = document.getElementById('letterXmlContextMenu')

    if (baseNode === null) {
      return null
    } else {
      return baseNode.innerHTML
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
