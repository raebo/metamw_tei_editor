export interface FigureAnchor {
  element: Element;
  xmlId: string;
}

const findTeiBody = (xmlDocument: XMLDocument): Element | null =>
  Array.from(xmlDocument.getElementsByTagName('*')).find((element) => {
    const text = element.parentElement;
    const tei = text?.parentElement;
    return element.localName.toLowerCase() === 'body' && text?.localName.toLowerCase() === 'text' && tei?.localName.toLowerCase() === 'tei';
  }) ?? null;

export const findFigureAnchor = (targetNode: Node, renderedRoot: Element, xmlDocument: XMLDocument): FigureAnchor | null => {
  const sourceBody = findTeiBody(xmlDocument);
  if (!sourceBody) return null;

  let candidate = targetNode.nodeType === Node.ELEMENT_NODE ? (targetNode as Element) : targetNode.parentElement;

  while (candidate && candidate !== renderedRoot) {
    if (candidate.localName.toLowerCase() === 'body') return null;

    const xmlId = candidate.getAttribute('xml:id');
    if (xmlId) {
      const sourceElements = Array.from(xmlDocument.getElementsByTagName('*')).filter(
        (element) => element.getAttribute('xml:id') === xmlId,
      );
      if (sourceElements.length === 1 && sourceBody.contains(sourceElements[0])) {
        return { element: candidate, xmlId };
      }
    }
    candidate = candidate.parentElement;
  }

  return null;
};
