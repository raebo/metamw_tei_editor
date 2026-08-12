import React from 'react';

// Small allowlist of inline formatting tags that are safe to render as-is (the kind of markup
// that can legitimately show up inside a marked passage of a letter). Anything not in this list
// gets its tag stripped while its already-sanitized children are kept, so a foreign/crafted
// element (e.g. <img>, <svg>, <script>, <a>) can never become a live DOM node.
const ALLOWED_TAGS = new Set([
  'SPAN',
  'EM',
  'I',
  'B',
  'STRONG',
  'BR',
  'SUP',
  'SUB',
  'DEL',
  'MARK',
  'P',
  'DIV',
  'UL',
  'OL',
  'LI',
]);

// Only `class` is kept - no `style`, no `id`, and in particular no `href`/`src`/`on*`
// attributes, which are exactly what an XSS payload needs to run.
const ALLOWED_ATTRIBUTES = new Set(['class']);

// Tags whose text content is code/CSS, never prose - drop them entirely (tag *and* children)
// instead of falling back to "unwrap the tag, keep the text" like for every other disallowed tag.
const STRIP_WITH_CONTENT_TAGS = new Set(['SCRIPT', 'STYLE']);

export interface SanitizedHtmlProps {
  html: string;
  className?: string;
  id?: string;
}

function renderSafeNode(node: ChildNode, key: string): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    // Comments, processing instructions, etc. are dropped entirely.
    return null;
  }

  const element = node as Element;

  if (STRIP_WITH_CONTENT_TAGS.has(element.tagName)) {
    return null;
  }

  const children = Array.from(element.childNodes).map((child, index) =>
    renderSafeNode(child, `${key}-${index}`),
  );

  if (!ALLOWED_TAGS.has(element.tagName)) {
    return <React.Fragment key={key}>{children}</React.Fragment>;
  }

  const Tag = element.tagName.toLowerCase() as keyof JSX.IntrinsicElements;
  const attributes: Record<string, string> = {};
  Array.from(element.attributes).forEach((attribute) => {
    const name = attribute.name.toLowerCase();
    if (ALLOWED_ATTRIBUTES.has(name)) {
      // React's JSX prop for the DOM `class` attribute is `className`.
      attributes[name === 'class' ? 'className' : name] = attribute.value;
    }
  });

  return (
    <Tag key={key} {...attributes}>
      {children}
    </Tag>
  );
}

/**
 * Renders untrusted HTML (e.g. a snippet of TEI-derived markup taken from the letter document)
 * as real React elements instead of via dangerouslySetInnerHTML. Only a small allowlist of
 * inline formatting tags/attributes survives the walk; everything else is dropped while its
 * text content is kept. There is no code path here that ever sets an attacker-controlled
 * attribute or tag name onto a live DOM node, so this cannot execute scripts, fire event
 * handlers, or navigate to a `javascript:` URL.
 */
const SanitizedHtml: React.FC<SanitizedHtmlProps> = ({ html, className, id }) => {
  const parsedDocument = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = parsedDocument.body.firstElementChild;

  return (
    <div className={className} id={id}>
      {root
        ? Array.from(root.childNodes).map((child, index) => renderSafeNode(child, `n-${index}`))
        : null}
    </div>
  );
};

export default SanitizedHtml;
