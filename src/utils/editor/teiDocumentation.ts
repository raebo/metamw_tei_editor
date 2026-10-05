import { EditorConstants } from '@src/constants/editor';

export const TEI_P5_DOCUMENTATION_BASE_URL = 'https://www.tei-c.org/release/doc/tei-p5-doc/en/html/';

type OpenWindow = (url?: string | URL, target?: string, features?: string) => Window | null;

const isTeiElement = (element: Element): boolean => {
  if (element.namespaceURI === EditorConstants.TEI_NS) return true;

  const root = element.ownerDocument?.documentElement;
  return element.namespaceURI === null && root?.namespaceURI === null && root.localName.toLowerCase() === 'tei';
};

export const teiP5DocumentationUrl = (element: Element): string | null => {
  if (!isTeiElement(element)) return null;

  const elementName = element.localName;
  if (!/^[A-Za-z][A-Za-z0-9._-]*$/.test(elementName)) return null;

  return new URL(`ref-${encodeURIComponent(elementName)}.html`, TEI_P5_DOCUMENTATION_BASE_URL).toString();
};

export const resolveTeiElementByPath = (xmlDoc: XMLDocument | null, sourcePath: string | undefined): Element | null => {
  if (!xmlDoc || !sourcePath || !/^\d+(\.\d+)*$/.test(sourcePath)) return null;

  let current: Node | null = xmlDoc.documentElement;
  for (const index of sourcePath.split('.').map(Number)) {
    current = current?.childNodes[index] ?? null;
  }

  return current?.nodeType === Node.ELEMENT_NODE ? (current as Element) : null;
};

export const openTeiP5Documentation = (element: Element, openWindow: OpenWindow = window.open.bind(window)): boolean => {
  const url = teiP5DocumentationUrl(element);
  if (!url) return false;

  openWindow(url, '_blank', 'noopener,noreferrer');
  return true;
};
