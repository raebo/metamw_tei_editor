import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FigureImage from './FigureImage';
import { readFigureImageMap } from '@src/utils/editor/graphicStructure';
import { manuscriptAnnotationReference } from '@src/utils/editor/manuscriptAnnotation';
import { AUTHOR_FOOTNOTE_REFERENCE_TYPES } from '@src/utils/editor/authorFootnote';
import type { InlineFormat } from '@src/utils/editor/inlineFormatting';

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
  'target',
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

const FRACTION_RENDERING = {
  fraction_bar: { variant: 'horizontal', numeratorRend: 'supbar', denominatorRend: 'subbar' },
  fraction_slash: {
    variant: 'vertical-slash',
    numeratorRend: 'supslash',
    denominatorRend: 'subslash',
  },
  fraction_noslash: {
    variant: 'vertical-noslash',
    numeratorRend: 'supnoslash',
    denominatorRend: 'subnoslash',
  },
} as const;

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
  const { t } = useTranslation();

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
      const abbreviationElement =
        tagName === 'choice' ? Array.from(element.children).find((child) => child.localName.toLowerCase() === 'abbr') : undefined;
      const expansionElement =
        tagName === 'choice' ? Array.from(element.children).find((child) => child.localName.toLowerCase() === 'expan') : undefined;
      const isAbbreviationChoice = Boolean(abbreviationElement && expansionElement);
      const fractionRendering =
        tagName === 'formula' ? FRACTION_RENDERING[element.getAttribute('rend') as keyof typeof FRACTION_RENDERING] : undefined;
      const fractionNumerator = fractionRendering
        ? Array.from(element.children).find((child) => child.getAttribute('rend') === fractionRendering.numeratorRend)
        : undefined;
      const fractionDenominator = fractionRendering
        ? Array.from(element.children).find((child) => child.getAttribute('rend') === fractionRendering.denominatorRend)
        : undefined;
      const isFraction = Boolean(fractionRendering && fractionNumerator && fractionDenominator);
      const isBodyCrossReferenceLink = tagName === 'link' && Boolean(element.closest('body')) && Boolean(element.getAttribute('target'));

      if (STRIP_WITH_CONTENT_TAGS.has(tagName) && !isBodyCrossReferenceLink) {
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
      const isAuthorFootnote = tagName === 'note' && element.getAttribute('type') === 'footnote';
      // Render author footnotes as regular HTML containers so legacy TEI print-layout
      // rules for note[type="footnote"] cannot move their content out of view.
      const TagName = isTableHead
        ? 'caption'
        : isAuthorFootnote
          ? 'div'
          : isBodyCrossReferenceLink
            ? 'span'
            : (TABLE_ELEMENT_TAGS[tagName] ?? (element.tagName as keyof JSX.IntrinsicElements));

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

      const isForeignHandAnnotation = tagName === 'note' && element.getAttribute('type') === 'note';
      const isForeignText = tagName === 'foreign';
      const rend = element.getAttribute('rend');
      const inlineFormat: InlineFormat | null =
        tagName === 'hi' && (rend === 'superscript' || rend === 'subscript' || rend === 'groundline' || rend === 'latintype') ? rend : null;
      const isManuscriptAnnotation = tagName === 'p' && element.parentElement?.localName.toLowerCase() === 'scriptdesc';
      const isAuthorFootnoteReference =
        tagName === 'ref' &&
        AUTHOR_FOOTNOTE_REFERENCE_TYPES.includes(element.getAttribute('type') as (typeof AUTHOR_FOOTNOTE_REFERENCE_TYPES)[number]);
      const isCrossReference =
        Boolean(element.closest('body')) &&
        !isAuthorFootnoteReference &&
        ((['ref', 'link'].includes(tagName) && Boolean(element.getAttribute('target'))) ||
          (tagName === 'anchor' && element.getAttribute('type') === 'cross-reference'));
      const crossReferenceTarget = tagName === 'anchor' ? (element.getAttribute('xml:id') ?? '?') : (element.getAttribute('target') ?? '?');
      const crossReferenceId = element.getAttribute('xml:id') ?? `path:${sourcePath.join('.')}`;
      const authorFootnoteId = isAuthorFootnote
        ? element.getAttribute('xml:id')
        : isAuthorFootnoteReference
          ? element.getAttribute('target')?.replace(/^#/, '')
          : null;
      const authorFootnoteMarker = isAuthorFootnote
        ? (element.getAttribute('n') ?? '?')
        : isAuthorFootnoteReference
          ? element.textContent?.trim() || '?'
          : null;
      const authorFootnoteLabel = authorFootnoteId ? t('editor:dialog.authorFootnote.anchorLabel', { marker: authorFootnoteMarker }) : null;
      const annotationNumber = isForeignHandAnnotation ? element.getAttribute('n') : null;
      const annotationLabel = isForeignHandAnnotation
        ? t('editor:dialog.foreignHandAnnotation.anchorLabel', {
            number: annotationNumber ?? '?',
            content: element.textContent?.trim() ?? '',
          })
        : null;
      if (isForeignHandAnnotation) {
        appendClassName(attributes, 'tei-foreign-hand-annotation');
        attributes.tabIndex = 0;
        attributes.role = 'note';
        attributes['aria-label'] = annotationLabel;
        attributes.contentEditable = false;
      }
      if (isAbbreviationChoice) {
        const rawExpansion = expansionElement?.textContent ?? '';
        const expansion =
          rawExpansion.startsWith('"') && rawExpansion.endsWith('"') && rawExpansion.length >= 2 ? rawExpansion.slice(1, -1) : rawExpansion;
        appendClassName(attributes, 'tei-abbreviation');
        attributes.tabIndex = 0;
        attributes.role = 'button';
        attributes.title = t('editor:dialog.abbreviation.anchorLabel', { expansion });
        attributes['aria-label'] = attributes.title;
        attributes['data-editor-abbreviation-reference'] = element.getAttribute('xml:id') ?? `path:${sourcePath.join('.')}`;
        attributes.contentEditable = false;
      }
      if (isForeignText) {
        appendClassName(attributes, 'tei-foreign-text');
        attributes.tabIndex = 0;
        attributes.role = 'button';
        attributes.title = t('editor:dialog.foreignText.anchorLabel', {
          language: element.getAttribute('xml:lang') ?? '?',
        });
        attributes['aria-label'] = attributes.title;
        attributes['data-editor-foreign-text-reference'] = element.getAttribute('xml:id') ?? `path:${sourcePath.join('.')}`;
        attributes.contentEditable = false;
      }
      if (inlineFormat) {
        appendClassName(attributes, `tei-inline-format tei-${inlineFormat}`);
        attributes.tabIndex = 0;
        attributes.role = 'button';
        attributes.title = t(`editor:dialog.inlineFormatting.${inlineFormat}.anchorLabel`);
        attributes['aria-label'] = attributes.title;
        attributes['data-editor-inline-format-reference'] = element.getAttribute('xml:id') ?? `path:${sourcePath.join('.')}`;
        attributes['data-editor-inline-format'] = inlineFormat;
      }
      if (isFraction && fractionRendering) {
        const numerator = fractionNumerator?.textContent ?? '';
        const denominator = fractionDenominator?.textContent ?? '';
        appendClassName(attributes, `tei-fraction tei-fraction--${fractionRendering.variant}`);
        if (fractionRendering.variant === 'horizontal') {
          appendClassName(attributes, 'tei-horizontal-fraction');
        }
        attributes.tabIndex = 0;
        attributes.role = 'button';
        attributes.title = t('editor:dialog.horizontalFraction.anchorLabel', {
          numerator,
          denominator,
        });
        attributes['aria-label'] = attributes.title;
        const fractionReference = element.getAttribute('xml:id') ?? `path:${sourcePath.join('.')}`;
        attributes['data-editor-fraction-reference'] = fractionReference;
        attributes['data-editor-fraction-variant'] = fractionRendering.variant;
        if (fractionRendering.variant === 'horizontal') {
          attributes['data-editor-horizontal-fraction-reference'] = fractionReference;
        }
        attributes.contentEditable = false;
      }
      if (isManuscriptAnnotation) {
        appendClassName(attributes, 'tei-manuscript-annotation');
        attributes.contentEditable = false;
      }
      if (isAuthorFootnote || isAuthorFootnoteReference) {
        appendClassName(attributes, isAuthorFootnote ? 'tei-author-footnote' : 'tei-author-footnote-reference');
        attributes.tabIndex = 0;
        attributes.role = isAuthorFootnote ? 'note' : 'button';
        attributes['aria-label'] = authorFootnoteLabel;
        attributes['data-editor-author-footnote-id'] = authorFootnoteId;
        attributes.contentEditable = false;
      }
      if (isCrossReference) {
        appendClassName(attributes, `tei-cross-reference tei-cross-reference--${tagName}`);
        attributes.tabIndex = 0;
        attributes.role = 'button';
        attributes.title = t('editor:dialog.crossReference.anchorLabel', {
          target: crossReferenceTarget,
        });
        attributes['aria-label'] = t('editor:dialog.crossReference.anchorLabel', {
          target: crossReferenceTarget,
        });
        attributes['data-editor-cross-reference-id'] = crossReferenceId;
        attributes.contentEditable = false;
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
      const abbreviationChildIndex = abbreviationElement ? Array.from(element.childNodes).indexOf(abbreviationElement) : -1;
      const renderedChildren =
        isAbbreviationChoice && abbreviationChildIndex >= 0 ? (
          children[abbreviationChildIndex]
        ) : isForeignHandAnnotation ? (
          <span className="tei-foreign-hand-annotation-content">
            <strong className="tei-foreign-hand-annotation-number">
              {t('editor:dialog.foreignHandAnnotation.contentLabel', {
                number: annotationNumber ?? '?',
              })}
            </strong>{' '}
            {children}
          </span>
        ) : isAuthorFootnote ? (
          <span className="tei-author-footnote-content">
            <strong className="tei-author-footnote-marker">
              {t('editor:dialog.authorFootnote.contentLabel', {
                marker: authorFootnoteMarker,
              })}
            </strong>{' '}
            {children}
          </span>
        ) : isCrossReference && children.length === 0 ? (
          <span className="tei-cross-reference-marker" aria-hidden="true">
            {tagName === 'anchor' ? '⚑' : '↗'} {crossReferenceTarget}
          </span>
        ) : (
          children
        );
      const renderedElement = (
        <TagName key={`${element.tagName}-${Math.random()}`} {...attributes} data-editor-xml-path={sourcePath.join('.')}>
          {tagName === 'table' ? (
            <>
              {tableCaption}
              <tbody>{tableRows}</tbody>
            </>
          ) : (
            renderedChildren
          )}
        </TagName>
      );
      if (isForeignHandAnnotation) {
        return (
          <React.Fragment key={`foreign-hand-annotation-${sourcePath.join('.')}`}>
            <button
              type="button"
              className="tei-foreign-hand-annotation-marker"
              data-editor-foreign-annotation-id={element.getAttribute('xml:id') ?? ''}
              title={annotationLabel ?? undefined}
              aria-label={annotationLabel ?? undefined}
              aria-haspopup="dialog"
              contentEditable={false}
            >
              {annotationNumber ?? '?'}
            </button>
            {renderedElement}
          </React.Fragment>
        );
      }
      if (isManuscriptAnnotation) {
        const reference = manuscriptAnnotationReference(element, sourcePath.join('.'));
        const label = t('editor:dialog.manuscriptAnnotation.editAction');
        return (
          <React.Fragment key={`manuscript-annotation-${sourcePath.join('.')}`}>
            <button
              type="button"
              className="tei-manuscript-annotation-caret"
              data-editor-manuscript-annotation-reference={reference}
              title={label}
              aria-label={label}
              aria-haspopup="dialog"
              contentEditable={false}
            >
              ▶
            </button>
            {renderedElement}
          </React.Fragment>
        );
      }
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
