import React, { useCallback, useEffect } from 'react';
import FigureImage from './FigureImage';
import { readFigureImageMap } from '@src/utils/editor/graphicStructure';

type XmlDisplayParserProps = {
  xmlContentRef: React.RefObject<HTMLDivElement> | null;
  xmlString: string;
  letterId?: number | null;
  focusedFigureXmlId?: string | null;
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
  'cols',
  'data-key',
  'key',
  'n',
  'rend',
  'resp',
  'role',
  'rows',
  'subtype',
  'type',
]);

// Defensive check on top of the attribute allowlist: even for the allowed `style` attribute,
// reject any declaration that could trigger a network request or code execution (url(...),
// legacy IE expression(...), @import, javascript: URLs).
const UNSAFE_STYLE_VALUE = /url\(|expression\(|@import|javascript:/i;
const FIGURE_ALIGNMENT_CLASSES: Record<string, string> = {
  center: 'tei-figure-align-center',
  left: 'tei-figure-align-left',
  right: 'tei-figure-align-right',
};
const FIGURE_REND_CLASSES: Record<string, string> = {
  inline: 'tei-figure-rend-inline',
  inline_big_size: 'tei-figure-rend-inline-big-size',
  below: 'tei-figure-rend-block',
  above: 'tei-figure-rend-block',
  bottom: 'tei-figure-rend-block',
  top: 'tei-figure-rend-block',
  margin: 'tei-figure-rend-block',
  overleaf: 'tei-figure-rend-block',
  inspace: 'tei-figure-rend-block',
  opposite: 'tei-figure-rend-block',
};
const FIGURE_SUBTYPE_CLASSES: Record<string, string> = {
  inline: 'tei-figure-subtype-inline',
  inline_graphic: 'tei-figure-subtype-inline',
  eighth_page: 'tei-figure-subtype-eighth-page',
  quarter_page: 'tei-figure-subtype-quarter-page',
  half_page: 'tei-figure-subtype-half-page',
  'three-quarter_page': 'tei-figure-subtype-three-quarter-page',
  full_page: 'tei-figure-subtype-full-page',
};
const PARAGRAPH_STYLE_CLASSES: Record<string, string> = {
  paragraph_without_indent: 'tei-paragraph-without-indent',
  paragraph_without_indent_indented: 'tei-paragraph-without-indent-indented',
  paragraph_hanging: 'tei-paragraph-hanging',
  'paragraph centered': 'tei-paragraph-centered',
  paragraph_right: 'tei-paragraph-right',
};

const TABLE_ELEMENT_TAGS: Partial<Record<string, keyof JSX.IntrinsicElements>> = {
  cell: 'td',
  row: 'tr',
};

const appendClassName = (attributes: Record<string, any>, className?: string) => {
  if (!className) return;
  attributes.className = [attributes.className, className].filter(Boolean).join(' ');
};

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

  const renderNode = (node: ChildNode, sourcePath: number[] = []): React.ReactNode => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      if (STRIP_WITH_CONTENT_TAGS.has(tagName)) {
        return null;
      }

      if (tagName === 'facsimile') return null;

      if (tagName === 'graphic') {
        const figure = element.parentElement;
        if (figure?.tagName.toLowerCase() !== 'figure') {
          return null;
        }

        const figureXmlId = figure.getAttribute('xml:id');
        const figDesc = Array.from(figure.children).find((child) => child.tagName.toLowerCase() === 'figdesc');

        return (
          <FigureImage
            key={`graphic-${sourcePath.join('.')}`}
            letterId={props.letterId ?? null}
            figureXmlId={figureXmlId}
            description={figDesc?.textContent ?? null}
            imageMap={readFigureImageMap(figure)}
          />
        );
      }

      const children = Array.from(element.childNodes).map((child, index) => renderNode(child, [...sourcePath, index]));

      if (tagName === 'figure' && !Array.from(element.children).some((child) => child.tagName.toLowerCase() === 'graphic')) {
        const figDesc = Array.from(element.children).find((child) => child.tagName.toLowerCase() === 'figdesc');
        children.push(
          <FigureImage
            key={`missing-graphic-${sourcePath.join('.')}`}
            letterId={props.letterId ?? null}
            figureXmlId={null}
            description={figDesc?.textContent ?? null}
            imageMap={readFigureImageMap(element)}
          />,
        );
      }

      if (UNWRAP_TAGS.has(tagName)) {
        return <React.Fragment key={`${element.tagName}-${Math.random()}`}>{children}</React.Fragment>;
      }

      const isTableHead = tagName === 'head' && element.parentElement?.tagName.toLowerCase() === 'table';
      const TagName = isTableHead ? 'caption' : (TABLE_ELEMENT_TAGS[tagName] ?? (element.tagName as keyof JSX.IntrinsicElements));

      const attributes = Array.from(element.attributes).reduce(
        (acc, attr) => {
          if (!ALLOWED_ATTRIBUTES.has(attr.name)) {
            return acc;
          }

          if (attr.name === 'style') {
            if (attr.value === 'display_none') {
              acc.style = { display: 'none' };
            } else if (tagName === 'figure' && FIGURE_ALIGNMENT_CLASSES[attr.value]) {
              appendClassName(acc, FIGURE_ALIGNMENT_CLASSES[attr.value]);
            } else if (tagName === 'p') {
              appendClassName(acc, PARAGRAPH_STYLE_CLASSES[attr.value]);
            } else if (tagName !== 'figure') {
              acc.style = parseInlineStyle(attr.value);
            }
          } else if (tagName === 'figure' && attr.name === 'rend') {
            appendClassName(acc, FIGURE_REND_CLASSES[attr.value]);
          } else if (tagName === 'figure' && attr.name === 'subtype') {
            appendClassName(acc, FIGURE_SUBTYPE_CLASSES[attr.value]);
          } else if (attr.name === 'key') {
            // A literal object property named "key" is always intercepted by React as the
            // reconciliation key and never reaches the DOM, however it is merged in - so the
            // XML "key" attribute (used for entity linking, see markupGeneration.ts) cannot be
            // rendered as a real DOM attribute here. Nothing currently reads it back from this
            // preview DOM (see XMLDisplayParser tests), so this is a known, accepted gap rather
            // than a silent attribute that only sometimes works.
            return acc;
          } else if (tagName === 'cell' && attr.name === 'cols') {
            acc.colSpan = attr.value;
          } else if (tagName === 'cell' && attr.name === 'rows') {
            acc.rowSpan = attr.value;
          } else if ((tagName === 'cell' || tagName === 'row') && attr.name === 'role') {
            acc['data-tei-role'] = attr.value;
          } else {
            acc[attr.name] = attr.value;
          }
          return acc;
        },
        {} as Record<string, any>,
      );

      if (tagName === 'list') {
        appendClassName(attributes, 'tei-list');
        attributes.tabIndex = 0;
      }
      if (tagName === 'table') appendClassName(attributes, 'tei-table');
      if (tagName === 'row') attributes['data-editor-tei-element'] = 'row';
      if (tagName === 'cell') {
        appendClassName(attributes, 'tei-table-cell');
        attributes['data-editor-tei-element'] = 'cell';
        // Table cells remain semantic cells while acting as keyboard focus targets for editor actions.

        attributes.tabIndex = 0;
      }

      if (tagName === 'figure' && element.getAttribute('xml:id') === props.focusedFigureXmlId) {
        appendClassName(attributes, 'tei-figure--focused');
        attributes.tabIndex = -1;
      }

      const tableCaption =
        tagName === 'table'
          ? children.filter((_child, index) => {
              const sourceChild = element.childNodes[index];
              return sourceChild.nodeType === Node.ELEMENT_NODE && (sourceChild as Element).tagName.toLowerCase() === 'head';
            })
          : [];
      const tableRows =
        tagName === 'table'
          ? children.filter((_child, index) => {
              const sourceChild = element.childNodes[index];
              return sourceChild.nodeType === Node.ELEMENT_NODE && (sourceChild as Element).tagName.toLowerCase() === 'row';
            })
          : [];
      const renderedElement = (
        <TagName key={`${element.tagName}-${Math.random()}`} {...attributes} data-editor-xml-path={sourcePath.join('.')}>
          {tagName === 'table' ? (
            <>
              {tableCaption}
              <tbody>{tableRows}</tbody>
            </>
          ) : (
            children
          )}
        </TagName>
      );
      if (tagName !== 'table') return renderedElement;

      return (
        <React.Fragment key={`table-${sourcePath.join('.')}`}>
          <button
            type="button"
            className="tei-table-caret"
            data-editor-table-caret="true"
            data-editor-xml-path={sourcePath.join('.')}
            tabIndex={0}
            aria-label="Tabelle auswählen"
          >
            ▶
          </button>
          {renderedElement}
        </React.Fragment>
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

  const containerProps = props.xmlContentRef && props.xmlContentRef.current ? { onContextMenu: handleReactContextMenu } : {};

  const doc = parseXml(props.xmlString);
  const root = doc.documentElement;

  return <div {...containerProps}>{renderNode(root)}</div>;
};

export default XMLDisplayParser;
