import React, { useCallback, useEffect } from 'react';

type XmlDisplayParserProps = {
  xmlContentRef: React.RefObject<HTMLDivElement> | null;
  xmlString: string;
  onRightClickMarked?: (pos: { top: number; left: number }) => void | null;
};

// Element names that must never be rendered, whatever their case (XML is case-sensitive, but
// document.createElement()/the browser's HTML element registry is not - `<SCRIPT>`/`<Script>`
// behave exactly like `<script>`). Their whole subtree is dropped, not just the tag itself,
// since their text content is code/markup/binary-ish data, never letter prose.
const STRIP_WITH_CONTENT_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'link',
  'meta',
  'base',
  'svg',
  'math',
  'img',
  'image',
  'picture',
  'video',
  'audio',
  'source',
  'track',
  'template',
  'noscript',
  'applet',
  'frame',
  'frameset',
]);

// Element names with no legitimate use in TEI letter content but whose text content may still
// be meaningful (e.g. XML that happens to mirror an HTML link/button) - unlike the tags above,
// only the tag itself is dropped, its already-sanitized children are kept.
const UNWRAP_TAGS = new Set(['a', 'button', 'form']);

// The letter/TEI content only ever needs these attributes (verified against every
// `setAttribute` call in markupGeneration.ts plus the `marked` class used for the right-click
// handler below). In particular there is no legitimate use of `href`/`src`/`xlink:href`/
// `formaction`/... or any `on*` event handler attribute, so none of those are ever passed
// through - regardless of what the source XML contains.
const ALLOWED_ATTRIBUTES = new Set([
  'class',
  'style',
  'xml:id',
  'xml:lang',
  'data-key',
  'key',
  'n',
  'rend',
  'resp',
  'subtype',
  'type',
]);

// Defensive check on top of the attribute allowlist: even for the allowed `style` attribute,
// reject any declaration that could trigger a network request or code execution (url(...),
// legacy IE expression(...), @import, javascript: URLs).
const UNSAFE_STYLE_VALUE = /url\(|expression\(|@import|javascript:/i;

const parseInlineStyle = (styleValue: string): React.CSSProperties => {
  return styleValue.split(';').reduce((styleObj, styleProp) => {
    const [key, value] = styleProp.split(':').map((s) => s.trim());
    if (key && value && !UNSAFE_STYLE_VALUE.test(value)) {
      const camelCasedKey = key.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      (styleObj as Record<string, string>)[camelCasedKey] = value;
    }
    return styleObj;
  }, {} as React.CSSProperties);
};

const XMLDisplayParser = (props: XmlDisplayParserProps) => {
  const parseXml = (xmlString: string) => {
    const parser = new DOMParser();

    return parser.parseFromString(xmlString, 'application/xml');
  };

  const renderNode = (node: ChildNode): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      if (STRIP_WITH_CONTENT_TAGS.has(tagName)) {
        return null;
      }

      const children = Array.from(element.childNodes).map((child) => renderNode(child));

      if (UNWRAP_TAGS.has(tagName)) {
        return (
          <React.Fragment key={`${element.tagName}-${Math.random()}`}>{children}</React.Fragment>
        );
      }

      const TagName = element.tagName as keyof JSX.IntrinsicElements;

      const attributes = Array.from(element.attributes).reduce(
        (acc, attr) => {
          if (!ALLOWED_ATTRIBUTES.has(attr.name)) {
            return acc;
          }

          if (attr.name === 'style') {
            acc.style = parseInlineStyle(attr.value);
          } else if (attr.name === 'key') {
            // A literal object property named "key" is always intercepted by React as the
            // reconciliation key and never reaches the DOM, however it is merged in - so the
            // XML "key" attribute (used for entity linking, see markupGeneration.ts) cannot be
            // rendered as a real DOM attribute here. Nothing currently reads it back from this
            // preview DOM (see XMLDisplayParser tests), so this is a known, accepted gap rather
            // than a silent attribute that only sometimes works.
            return acc;
          } else {
            acc[attr.name] = attr.value;
          }
          return acc;
        },
        {} as Record<string, any>,
      );

      return (
        <TagName key={`${element.tagName}-${Math.random()}`} {...attributes}>
          {children}
        </TagName>
      );
    }

    return null;
  };

  const handleNativeContextMenu = useCallback(
    (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target?.tagName.toLowerCase() === 'span' && target.classList.contains('marked')) {
        event.preventDefault();
        props.onRightClickMarked?.({ top: event.clientY, left: event.clientX });
      }
    },
    [props.onRightClickMarked], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleReactContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    handleNativeContextMenu(event.nativeEvent); // delegate to native handler
  };

  useEffect(() => {
    if (!props.xmlContentRef || !props.xmlContentRef.current) return;

    const container = props.xmlContentRef.current;

    container.addEventListener('contextmenu', handleNativeContextMenu, { capture: true });
    return () => {
      container.removeEventListener('contextmenu', handleNativeContextMenu, { capture: true });
    };
  }, [handleNativeContextMenu, props.xmlContentRef]);

  const containerProps =
    props.xmlContentRef && props.xmlContentRef.current
      ? { onContextMenu: handleReactContextMenu }
      : {};

  const doc = parseXml(props.xmlString);
  const root = doc.documentElement;

  return <div {...containerProps}>{renderNode(root)}</div>;
};

export default XMLDisplayParser;
