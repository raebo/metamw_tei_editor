import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Menu, MenuItem, Divider, Box, MenuList, Paper, Popper } from '@mui/material';
import { createContextMenuItems, MenuItemType } from '@src/components/editor/letter/Util/ContextMenuLetterItems';
import { useAppDispatch } from '@src/redux/hooks';
import { useSelector, useStore } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { EditorConstants, LetterState } from '@src/constants/editor';
import { EditorUtils } from '@src/utils/editor';
import { setDialogType, setEditorSelectedItem, setNodeClicked, setReloadLetterContent } from '@src/redux/slices/editor.letter.slice';
import { enqueueSnackbar } from 'notistack';
import { MiscUtils } from '@src/utils/misc';
import {
  setEditorMarkedAndContentLeftRightThunk,
  setEditorDialogAndReferenceThunk,
  setEditorNodeClickedAndContentLeftRightThunk,
} from '@src/redux/thunks/editor.letter.thunk';
import { getMenuItemsNoMarking } from '@src/constants/menuItems';
import { debounce } from 'lodash-es';
import { rightClickPathHandles } from '@src/utils/editor/rightClickPathHandles';
import { useTranslation } from 'react-i18next';
import { findFigureAnchor } from '@src/utils/editor/figureAnchor';
import type { ParagraphStructureOperation } from '@src/utils/editor/paragraphStructure';
import type { ListStructureOperation } from '@src/utils/editor/listStructure';
import type { TableStructureOperation } from '@src/utils/editor/tableStructure';
import type { GraphicStructureOperation } from '@src/components/editor/letter/Dialog/Components/GraphicStructureDialog';
import { captureForeignHandAnnotationCaret } from '@src/utils/editor/foreignHandAnnotation';
import { openTeiP5Documentation, resolveTeiElementByPath } from '@src/utils/editor/teiDocumentation';
import { captureFractionCaret } from '@src/utils/editor/horizontalFraction';
import {
  contentMarkedKeyHandleDefinitions,
  generateKeyHandleAction,
  runXmlAction,
} from '@src/components/editor/letter/Center/lib/keyHandlerDefinitions';
import { removeInlineFormatting, resolveInlineFormatting } from '@src/utils/editor/inlineFormatting';

const SECTION_SELECTOR =
  'div[data-editor-xml-path], div1[data-editor-xml-path], div2[data-editor-xml-path], div3[data-editor-xml-path], div4[data-editor-xml-path], div5[data-editor-xml-path], div6[data-editor-xml-path], div7[data-editor-xml-path]';

const fractionDialogType = (variant?: string): string => {
  if (variant === 'vertical-slash') return EditorConstants.dialogTypes.VERTICAL_SLASH_FRACTION;
  if (variant === 'vertical-noslash') return EditorConstants.dialogTypes.VERTICAL_NOSLASH_FRACTION;
  return EditorConstants.dialogTypes.HORIZONTAL_FRACTION;
};

interface UserActionMenuProps {
  xmlContentRef: React.RefObject<HTMLDivElement>;
  setLetterState: (letterState: LetterState) => void;
  anchorPosition: { top: number; left: number } | null;
  setAnchorPosition: (position: { top: number; left: number } | null) => void;
}

const RightClickActionMenuOptimized = (props: UserActionMenuProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const reduxStore = useStore();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);
  const contentTextIsMarked = useSelector((state: RootState) => state.editorLetter.content.textIsMarked);
  const figureUploadInProgress = useSelector((state: RootState) => state.editorLetter.figureUploadInProgress);
  const xmlContentRef = props.xmlContentRef;

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [displayMenuItems, setDisplayMenuItems] = useState<MenuItemType[]>([]);
  const [submenuAnchorEl, setSubmenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null);
  const [nestedSubmenuAnchorEl, setNestedSubmenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openNestedSubmenuIndex, setOpenNestedSubmenuIndex] = useState<number | null>(null);

  const xmlDocRef = useRef<XMLDocument | null>(null);

  const runMarkedAction = useCallback(
    (shortcut: string) => {
      const definition = contentMarkedKeyHandleDefinitions[shortcut];
      if (!definition) return;
      const action = generateKeyHandleAction(definition);
      void action?.(dispatch, () => reduxStore.getState() as RootState);
    },
    [dispatch, reduxStore],
  );

  const removeSuperscript = useCallback(
    (reference: string) => {
      void runXmlAction(
        dispatch,
        () => reduxStore.getState() as RootState,
        (xmlDoc) => removeInlineFormatting(resolveInlineFormatting(xmlDoc, reference, 'superscript'), 'superscript'),
        EditorConstants.changeTypes.misc.CONTENT_FORMAT_CHANGED,
        t('editor:dialog.inlineFormatting.superscript.removed'),
      );
    },
    [dispatch, reduxStore, t],
  );

  const clearMarkedSelection = useCallback(() => {
    try {
      window.getSelection()?.removeAllRanges();
      EditorUtils.textMarking.removeMarkedSpans(xmlContentRef.current);

      let xmlContent = stateEditorLetter.xmlContent;
      if (xmlContent) {
        const xmlDoc = EditorUtils.xmlCheck.extractTeiDocumentFromString(xmlContent);
        EditorUtils.textMarking.removeMarkedSpans(xmlDoc.documentElement);
        xmlContent = new XMLSerializer().serializeToString(xmlDoc);
      }

      dispatch(
        setEditorMarkedAndContentLeftRightThunk({
          textIsMarked: false,
          contentLeft: null,
          contentRight: null,
          xmlContent,
        }),
      );
      setDisplayMenuItems([]);
      props.setAnchorPosition(null);
    } catch (err) {
      enqueueSnackbar(MiscUtils.misc.getErrorMessage(err), { variant: 'error' });
    }
  }, [dispatch, props, stateEditorLetter.xmlContent, xmlContentRef]);

  /** CACHE MENU ITEMS */
  const menuItemsMarked = useMemo(
    () => [
      ...createContextMenuItems({
        handleMenuItemClick: (left, right) => {
          props.setAnchorPosition(null);
          dispatch(setEditorSelectedItem({ selectedItem: { left, right } }));
        },
        handleMenuItemDialogClick: (dialogType: string) => {
          props.setAnchorPosition(null);
          dispatch(setDialogType({ dialogType }));
        },
      }),
      { type: 'divider' as const },
      {
        label: t('editor:dialog.paragraphStructure.actions.splitParagraph'),
        action: () => {
          props.setAnchorPosition(null);
          dispatch(
            setEditorDialogAndReferenceThunk({
              dialogType: EditorConstants.dialogTypes.PARAGRAPH_STRUCTURE,
              elementType: 'selection',
              elementXmlId: '',
              elementKey: 'paragraph-split',
            }),
          );
        },
      },
      { type: 'divider' as const },
      {
        label: t('editor:dialog.listStructure.contextAction'),
        hasSubMenu: true,
        subMenu: [
          {
            label: t('editor:dialog.listStructure.actions.selectionOrdered'),
            action: () => {
              props.setAnchorPosition(null);
              dispatch(
                setEditorDialogAndReferenceThunk({
                  dialogType: EditorConstants.dialogTypes.LIST_STRUCTURE,
                  elementType: 'selection',
                  elementXmlId: '',
                  elementKey: 'list-selection-ordered',
                }),
              );
            },
          },
          {
            label: t('editor:dialog.listStructure.actions.selectionUnordered'),
            action: () => {
              props.setAnchorPosition(null);
              dispatch(
                setEditorDialogAndReferenceThunk({
                  dialogType: EditorConstants.dialogTypes.LIST_STRUCTURE,
                  elementType: 'selection',
                  elementXmlId: '',
                  elementKey: 'list-selection-unordered',
                }),
              );
            },
          },
        ],
      },
      { type: 'divider' as const },
      {
        label: t('editor:dialog.foreignText.contextAction'),
        keyShortcut: 'ctrl+alt+x',
        action: () => {
          props.setAnchorPosition(null);
          dispatch(
            setEditorDialogAndReferenceThunk({
              dialogType: EditorConstants.dialogTypes.FOREIGN_TEXT,
              elementType: 'foreign',
              elementXmlId: '',
              elementKey: 'create',
            }),
          );
        },
      },
      {
        label: t('editor:dialog.abbreviation.contextAction'),
        keyShortcut: 'ctrl+1',
        action: () => {
          props.setAnchorPosition(null);
          dispatch(
            setEditorDialogAndReferenceThunk({
              dialogType: EditorConstants.dialogTypes.ABBREVIATION,
              elementType: 'choice',
              elementXmlId: '',
              elementKey: 'create',
            }),
          );
        },
      },
      {
        label: t('editor:dialog.inlineFormatting.superscript.applyAction'),
        keyShortcut: 'ctrl+5',
        action: () => {
          props.setAnchorPosition(null);
          runMarkedAction('ctrl+5');
        },
      },
      { type: 'divider' as const },
      {
        label: t('editor:dialog.crossReference.contextAction'),
        hasSubMenu: true,
        subMenu: [
          ['register', 'ctrl+alt+r'],
          ['letter-annotation', 'ctrl+shift+r'],
          ['external-url', 'ctrl+alt+u'],
          ['internal-url', 'ctrl+shift+u'],
          ['generic-target', 'ctrl+alt+z'],
          ['generic-start', 'ctrl+shift+z'],
        ].map(([kind, shortcut]) => ({
          label: t(`editor:dialog.crossReference.kinds.${kind}`),
          keyShortcut: shortcut,
          action: () => {
            props.setAnchorPosition(null);
            dispatch(
              setEditorDialogAndReferenceThunk({
                dialogType: EditorConstants.dialogTypes.CROSS_REFERENCE,
                elementType: kind,
                elementXmlId: '',
                elementKey: 'selection',
              }),
            );
          },
        })),
      },
      { type: 'divider' as const },
      {
        label: t('editor:dialog.selection.clearAction'),
        keyShortcut: 'Esc',
        action: clearMarkedSelection,
      },
    ],
    [clearMarkedSelection, dispatch, props, runMarkedAction, t],
  );

  const menuItemsNoMarking: MenuItemType[] = useMemo(
    () => getMenuItemsNoMarking(dispatch, stateEditorLetter, xmlDocRef),
    [dispatch, stateEditorLetter],
  );

  const pathHandlers = useMemo(() => rightClickPathHandles.pathHandlerFactory(menuItemsNoMarking), [menuItemsNoMarking]);

  /** LOAD XML DOC ON LETTER CHANGE */
  useEffect(() => {
    if (!stateEditorLetter.xmlContent) {
      dispatch(setReloadLetterContent({ reloadLetterContent: true }));
      return;
    }
    try {
      xmlDocRef.current = EditorUtils.xmlCheck.extractTeiDocumentFromString(stateEditorLetter.xmlContent);
    } catch (err) {
      enqueueSnackbar(MiscUtils.misc.getErrorMessage(err), { variant: 'error' });
      xmlDocRef.current = null;
    }
  }, [stateEditorLetter.xmlContent, dispatch]);

  /** DEBOUNCED SELECTION HANDLER */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleMouseUpMarkedElements = useCallback(
    debounce((_event: MouseEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.toString().length === 0) return;

      requestAnimationFrame(() => {
        try {
          if (!xmlContentRef.current) {
            enqueueSnackbar('No XML content reference found', { variant: 'error' });
            return;
          }

          EditorUtils.textMarking.isValidSelection(
            selection,
            xmlContentRef.current,
            (sel: Selection) => {
              if (!stateEditorLetter.xmlContent) {
                throw new Error('No source XML content found');
              }

              const range = sel.getRangeAt(0);
              const xmlDoc = EditorUtils.textMarking.createMarkedXmlDocument(stateEditorLetter.xmlContent, xmlContentRef.current!, range);

              EditorUtils.textMarking.removeMarkedSpans(xmlContentRef.current!);
              EditorUtils.textMarking.markValidSelection(sel, range);

              dispatch(
                setEditorMarkedAndContentLeftRightThunk({
                  textIsMarked: true,
                  contentLeft: null,
                  contentRight: null,
                  xmlContent: new XMLSerializer().serializeToString(xmlDoc),
                }),
              );

              setDisplayMenuItems(menuItemsMarked);
            },
            (message: string) => {
              EditorUtils.textMarking.removeMarkedSpans(xmlContentRef.current!);
              props.setLetterState({
                viewMode: 'WYSIWYG',
                xmlContent: xmlContentRef.current?.innerHTML ?? '',
                undoAvailable: stateEditorLetter.undoAvailable,
                redoAvailable: stateEditorLetter.redoAvailable,
              });

              dispatch(
                setEditorMarkedAndContentLeftRightThunk({
                  textIsMarked: false,
                  contentLeft: null,
                  contentRight: null,
                }),
              );

              enqueueSnackbar(message, { variant: 'error' });
            },
          );
        } catch (err) {
          enqueueSnackbar(MiscUtils.misc.getErrorMessage(err), { variant: 'error' });
        }
      });
    }, 100),
    [dispatch, menuItemsMarked, props, stateEditorLetter.xmlContent],
  );

  const handleNoMarkupRightClick = useCallback(
    (event: MouseEvent) => {
      const keyboardContextMenu = event.button === 0 && event.detail === 0;
      if (event.button !== 2 && !keyboardContextMenu) return;
      event.preventDefault();

      setDisplayMenuItems([]);
      const targetNode = event.target as Node;
      const targetElement = targetNode.nodeType === Node.ELEMENT_NODE ? (targetNode as HTMLElement) : targetNode.parentElement;
      if (targetElement?.closest('span.marked')) {
        setDisplayMenuItems(menuItemsMarked);
        props.setAnchorPosition({ top: event.clientY, left: event.clientX });
        return;
      }
      const inlineFormatTarget = targetElement?.closest<HTMLElement>('[data-editor-inline-format-reference]');
      const inlineFormatReference = inlineFormatTarget?.dataset.editorInlineFormatReference;
      if (inlineFormatReference && inlineFormatTarget.dataset.editorInlineFormat === 'superscript') {
        setDisplayMenuItems([
          {
            label: t('editor:dialog.inlineFormatting.superscript.removeAction'),
            action: () => removeSuperscript(inlineFormatReference),
          },
        ]);
        props.setAnchorPosition({ top: event.clientY, left: event.clientX });
        dispatch(
          setEditorNodeClickedAndContentLeftRightThunk({
            nodeClicked: true,
            textIsMarked: false,
            contentLeft: null,
            contentRight: null,
          }),
        );
        return;
      }
      const fractionTarget = targetElement?.closest<HTMLElement>(
        '[data-editor-fraction-reference], [data-editor-horizontal-fraction-reference]',
      );
      const fractionReference =
        fractionTarget?.dataset.editorFractionReference ?? fractionTarget?.dataset.editorHorizontalFractionReference;
      const fractionVariant = fractionTarget?.dataset.editorFractionVariant;
      if (fractionReference) {
        const openFractionDialog = (elementKey: 'edit' | 'delete') => {
          dispatch(
            setEditorDialogAndReferenceThunk({
              dialogType: fractionDialogType(fractionVariant),
              elementType: 'formula',
              elementXmlId: fractionReference,
              elementKey,
            }),
          );
        };
        setDisplayMenuItems([
          {
            label: t('editor:dialog.horizontalFraction.editAction'),
            action: () => openFractionDialog('edit'),
          },
          {
            label: t('editor:dialog.horizontalFraction.deleteAction'),
            action: () => openFractionDialog('delete'),
          },
        ]);
        props.setAnchorPosition({ top: event.clientY, left: event.clientX });
        dispatch(
          setEditorNodeClickedAndContentLeftRightThunk({
            nodeClicked: true,
            textIsMarked: false,
            contentLeft: null,
            contentRight: null,
          }),
        );
        return;
      }
      const crossReferenceTarget = targetElement?.closest<HTMLElement>('[data-editor-cross-reference-id]');
      const abbreviationTarget = targetElement?.closest<HTMLElement>('[data-editor-abbreviation-reference]');
      const abbreviationReference = abbreviationTarget?.dataset.editorAbbreviationReference;
      if (abbreviationReference) {
        const openAbbreviationDialog = (elementKey: 'edit' | 'delete') => {
          dispatch(
            setEditorDialogAndReferenceThunk({
              dialogType: EditorConstants.dialogTypes.ABBREVIATION,
              elementType: 'choice',
              elementXmlId: abbreviationReference,
              elementKey,
            }),
          );
        };
        setDisplayMenuItems([
          {
            label: t('editor:dialog.abbreviation.editAction'),
            action: () => openAbbreviationDialog('edit'),
          },
          {
            label: t('editor:dialog.abbreviation.deleteAction'),
            action: () => openAbbreviationDialog('delete'),
          },
        ]);
        props.setAnchorPosition({ top: event.clientY, left: event.clientX });
        dispatch(
          setEditorNodeClickedAndContentLeftRightThunk({
            nodeClicked: true,
            textIsMarked: false,
            contentLeft: null,
            contentRight: null,
          }),
        );
        return;
      }
      const foreignTextTarget = targetElement?.closest<HTMLElement>('[data-editor-foreign-text-reference]');
      const foreignTextReference = foreignTextTarget?.dataset.editorForeignTextReference;
      if (foreignTextReference) {
        const openForeignTextDialog = (elementKey: 'edit' | 'delete') => {
          dispatch(
            setEditorDialogAndReferenceThunk({
              dialogType: EditorConstants.dialogTypes.FOREIGN_TEXT,
              elementType: 'foreign',
              elementXmlId: foreignTextReference,
              elementKey,
            }),
          );
        };
        setDisplayMenuItems([
          {
            label: t('editor:dialog.foreignText.editAction'),
            action: () => openForeignTextDialog('edit'),
          },
          {
            label: t('editor:dialog.foreignText.deleteAction'),
            action: () => openForeignTextDialog('delete'),
          },
        ]);
        props.setAnchorPosition({ top: event.clientY, left: event.clientX });
        dispatch(
          setEditorNodeClickedAndContentLeftRightThunk({
            nodeClicked: true,
            textIsMarked: false,
            contentLeft: null,
            contentRight: null,
          }),
        );
        return;
      }
      const crossReferenceId = crossReferenceTarget?.dataset.editorCrossReferenceId;
      if (crossReferenceId) {
        const openCrossReferenceDialog = (elementKey: 'edit' | 'delete') => {
          dispatch(
            setEditorDialogAndReferenceThunk({
              dialogType: EditorConstants.dialogTypes.CROSS_REFERENCE,
              elementType: crossReferenceTarget.localName,
              elementXmlId: crossReferenceId,
              elementKey,
            }),
          );
        };
        setDisplayMenuItems([
          {
            label: t('editor:dialog.crossReference.editAction'),
            action: () => openCrossReferenceDialog('edit'),
          },
          {
            label: t('editor:dialog.crossReference.deleteAction'),
            action: () => openCrossReferenceDialog('delete'),
          },
        ]);
        props.setAnchorPosition({ top: event.clientY, left: event.clientX });
        dispatch(
          setEditorNodeClickedAndContentLeftRightThunk({
            nodeClicked: true,
            textIsMarked: false,
            contentLeft: null,
            contentRight: null,
          }),
        );
        return;
      }
      const authorFootnoteTarget = targetElement?.closest<HTMLElement>('[data-editor-author-footnote-id]');
      const authorFootnoteId = authorFootnoteTarget?.dataset.editorAuthorFootnoteId;
      if (authorFootnoteId) {
        const openAuthorFootnoteDialog = (elementKey: 'edit' | 'delete') => {
          dispatch(
            setEditorDialogAndReferenceThunk({
              dialogType: EditorConstants.dialogTypes.ADD_FOOTNOTE_AUTHOR,
              elementType: 'note',
              elementXmlId: authorFootnoteId,
              elementKey,
            }),
          );
        };
        setDisplayMenuItems([
          {
            label: t('editor:dialog.authorFootnote.editAction'),
            action: () => openAuthorFootnoteDialog('edit'),
          },
          {
            label: t('editor:dialog.authorFootnote.deleteAction'),
            action: () => openAuthorFootnoteDialog('delete'),
          },
        ]);
        props.setAnchorPosition({ top: event.clientY, left: event.clientX });
        dispatch(
          setEditorNodeClickedAndContentLeftRightThunk({
            nodeClicked: true,
            textIsMarked: false,
            contentLeft: null,
            contentRight: null,
          }),
        );
        return;
      }
      const manuscriptAnnotationMarker = targetElement?.closest<HTMLElement>('[data-editor-manuscript-annotation-reference]');
      const manuscriptAnnotationContent = targetElement?.closest<HTMLElement>('p.tei-manuscript-annotation[data-editor-xml-path]');
      const manuscriptSourcePath = manuscriptAnnotationContent?.dataset.editorXmlPath;
      const manuscriptAnnotationReference =
        manuscriptAnnotationMarker?.dataset.editorManuscriptAnnotationReference ||
        manuscriptAnnotationContent?.getAttribute('xml:id') ||
        (manuscriptSourcePath ? `path:${manuscriptSourcePath}` : null);
      if (manuscriptAnnotationReference) {
        const openManuscriptAnnotationDialog = (elementKey: 'edit' | 'delete') => {
          dispatch(
            setEditorDialogAndReferenceThunk({
              dialogType: EditorConstants.dialogTypes.MANUSCRIPT_ANNOTATION,
              elementType: 'p',
              elementXmlId: manuscriptAnnotationReference,
              elementKey,
            }),
          );
        };
        setDisplayMenuItems([
          {
            label: t('editor:dialog.manuscriptAnnotation.editAction'),
            action: () => openManuscriptAnnotationDialog('edit'),
          },
          {
            label: t('editor:dialog.manuscriptAnnotation.deleteAction'),
            action: () => openManuscriptAnnotationDialog('delete'),
          },
        ]);
        props.setAnchorPosition({ top: event.clientY, left: event.clientX });
        dispatch(
          setEditorNodeClickedAndContentLeftRightThunk({
            nodeClicked: true,
            textIsMarked: false,
            contentLeft: null,
            contentRight: null,
          }),
        );
        return;
      }

      const menuItemsToAdd: MenuItemType[] = [];
      let isClickable = false;

      for (const handler of pathHandlers) {
        EditorUtils.xmlCheck.isNodeMatchingPath(
          targetNode,
          handler.paths,
          (node) => {
            setSelectedNode(node);
            const items = handler.getMenuItems(node);
            const validItems = (items || []).filter((i): i is MenuItemType => i !== undefined && i !== null);
            if (validItems.length > 0) {
              menuItemsToAdd.push(...validItems);
              isClickable = true;
            }
          },
          () => {},
        );
      }

      const paragraphAnchor = targetElement?.closest<HTMLElement>('p[data-editor-xml-path]');
      const sectionAnchor = targetElement?.closest<HTMLElement>(SECTION_SELECTOR);
      const listAnchor = targetElement?.closest<HTMLElement>('list[data-editor-xml-path]');
      const itemAnchor = targetElement?.closest<HTMLElement>('item[data-editor-xml-path]');
      const tableCaretAnchor = targetElement?.closest<HTMLElement>('[data-editor-table-caret]');
      const tableElementAnchor = targetElement?.closest<HTMLElement>('table[data-editor-xml-path]');
      const tableAnchor = tableCaretAnchor ?? tableElementAnchor;
      const rowAnchor = targetElement?.closest<HTMLElement>('[data-editor-tei-element="row"][data-editor-xml-path]');
      const cellAnchor = targetElement?.closest<HTMLElement>('[data-editor-tei-element="cell"][data-editor-xml-path]');
      const renderedFigureAnchor = targetElement?.closest<HTMLElement>('figure[data-editor-xml-path]');
      const foreignAnnotationAnchor = targetElement?.closest<HTMLElement>('note[type="note"]');
      const foreignAnnotationMarker = targetElement?.closest<HTMLElement>('[data-editor-foreign-annotation-id]');
      const structureActions: NonNullable<MenuItemType['subMenu']> = [];
      const listActions: NonNullable<MenuItemType['subMenu']> = [];
      const tableActions: NonNullable<MenuItemType['subMenu']> = [];
      const tableCellActions: NonNullable<MenuItemType['subMenu']> = [];
      const tableRowActions: NonNullable<MenuItemType['subMenu']> = [];
      const tableColumnActions: NonNullable<MenuItemType['subMenu']> = [];
      const wholeTableActions: NonNullable<MenuItemType['subMenu']> = [];
      const graphicActions: NonNullable<MenuItemType['subMenu']> = [];
      let annotationCaret: ReturnType<typeof captureForeignHandAnnotationCaret> | null = null;
      let fractionCaret: ReturnType<typeof captureFractionCaret> | null = null;

      if (stateEditorLetter.xmlContent) {
        try {
          annotationCaret = captureForeignHandAnnotationCaret(stateEditorLetter.xmlContent);
        } catch {
          annotationCaret = null;
        }
        try {
          fractionCaret = captureFractionCaret(stateEditorLetter.xmlContent);
        } catch {
          fractionCaret = null;
        }
      }

      const openStructureDialog = (operation: ParagraphStructureOperation, anchor: HTMLElement) => {
        const sourcePath = anchor.dataset.editorXmlPath;
        if (sourcePath === undefined) return;
        dispatch(
          setEditorDialogAndReferenceThunk({
            dialogType: EditorConstants.dialogTypes.PARAGRAPH_STRUCTURE,
            elementType: anchor.localName,
            elementXmlId: sourcePath,
            elementKey: operation,
          }),
        );
      };

      const openListDialog = (operation: ListStructureOperation, anchor: HTMLElement) => {
        const sourcePath = anchor.dataset.editorXmlPath;
        if (sourcePath === undefined) return;
        dispatch(
          setEditorDialogAndReferenceThunk({
            dialogType: EditorConstants.dialogTypes.LIST_STRUCTURE,
            elementType: anchor.localName,
            elementXmlId: sourcePath,
            elementKey: operation,
          }),
        );
      };

      const openTableDialog = (operation: TableStructureOperation, anchor: HTMLElement, elementType = anchor.localName) => {
        const sourcePath = anchor.dataset.editorXmlPath;
        if (sourcePath === undefined) return;
        dispatch(
          setEditorDialogAndReferenceThunk({
            dialogType: EditorConstants.dialogTypes.TABLE_STRUCTURE,
            elementType,
            elementXmlId: sourcePath,
            elementKey: operation,
          }),
        );
      };

      const openGraphicDialog = (operation: GraphicStructureOperation, anchor: HTMLElement) => {
        const sourcePath = anchor.dataset.editorXmlPath;
        if (sourcePath === undefined) return;
        dispatch(
          setEditorDialogAndReferenceThunk({
            dialogType: EditorConstants.dialogTypes.GRAPHIC_STRUCTURE,
            elementType: anchor.localName,
            elementXmlId: sourcePath,
            elementKey: operation,
          }),
        );
      };

      if (paragraphAnchor?.closest('body')) {
        structureActions.push(
          {
            label: t('editor:dialog.paragraphStructure.actions.insertParagraph'),
            action: () => openStructureDialog('paragraph-insert', paragraphAnchor),
          },
          {
            label: t('editor:dialog.paragraphStructure.actions.convertParagraph'),
            action: () => openStructureDialog('paragraph-convert', paragraphAnchor),
          },
        );
      }

      if (sectionAnchor?.closest('body')) {
        const sectionName = sectionAnchor.localName.toLowerCase();
        const sectionLevel = sectionName === 'div' ? 0 : Number(sectionName.slice(3));
        const isWritingAct = sectionAnchor.getAttribute('type') === 'act_of_writing';

        if (sectionName === 'div' || (sectionLevel >= 1 && sectionLevel < 7)) {
          structureActions.push({
            label: t('editor:dialog.paragraphStructure.actions.insertChildSection'),
            action: () => openStructureDialog('section-child', sectionAnchor),
          });
        }
        if (!isWritingAct && /^div([1-7])?$/.test(sectionName)) {
          structureActions.push(
            {
              label: t('editor:dialog.paragraphStructure.actions.insertSiblingSection'),
              action: () => openStructureDialog('section-sibling', sectionAnchor),
            },
            {
              label: t('editor:dialog.paragraphStructure.actions.editSection'),
              action: () => openStructureDialog('section-edit', sectionAnchor),
            },
          );
        }
      }

      if (structureActions.length > 0) {
        if (menuItemsToAdd.length > 0) menuItemsToAdd.push({ type: 'divider' });
        menuItemsToAdd.push({
          label: t('editor:dialog.paragraphStructure.contextAction'),
          hasSubMenu: true,
          subMenu: structureActions,
        });
        isClickable = true;
      }

      if (paragraphAnchor?.closest('body')) {
        listActions.push(
          {
            label: t('editor:dialog.listStructure.actions.emptyOrdered'),
            action: () => openListDialog('list-empty-ordered', paragraphAnchor),
          },
          {
            label: t('editor:dialog.listStructure.actions.emptyUnordered'),
            action: () => openListDialog('list-empty-unordered', paragraphAnchor),
          },
        );
      }

      const listSource = itemAnchor ?? listAnchor;
      if (listSource?.closest('body')) {
        listActions.push({
          label: t('editor:dialog.listStructure.actions.addItem'),
          action: () => openListDialog('list-add-item', listSource),
        });
        if (itemAnchor) {
          listActions.push(
            {
              label: t('editor:dialog.listStructure.actions.editItem'),
              action: () => openListDialog('list-edit-item', itemAnchor),
            },
            {
              label: t('editor:dialog.listStructure.actions.deleteItem'),
              action: () => openListDialog('list-delete-item', itemAnchor),
            },
          );
        }
        listActions.push(
          {
            label: t('editor:dialog.listStructure.actions.sortAscending'),
            action: () => openListDialog('list-sort-ascending', listSource),
          },
          {
            label: t('editor:dialog.listStructure.actions.sortDescending'),
            action: () => openListDialog('list-sort-descending', listSource),
          },
          {
            label: t('editor:dialog.listStructure.actions.deleteList'),
            action: () => openListDialog('list-delete', listSource),
          },
        );
      }

      if (listActions.length > 0) {
        if (menuItemsToAdd.length > 0) menuItemsToAdd.push({ type: 'divider' });
        menuItemsToAdd.push({
          label: t('editor:dialog.listStructure.contextAction'),
          hasSubMenu: true,
          subMenu: listActions,
        });
        isClickable = true;
      }

      if (paragraphAnchor?.closest('body')) {
        tableActions.push({
          label: t('editor:dialog.tableStructure.actions.create'),
          action: () => openTableDialog('table-create', paragraphAnchor),
        });
      }

      const tableSource = cellAnchor ?? rowAnchor ?? tableAnchor;
      if (tableSource?.closest('body')) {
        if (rowAnchor) {
          tableRowActions.push(
            {
              label: t('editor:dialog.tableStructure.actions.rowAbove'),
              action: () => openTableDialog('table-row-above', rowAnchor, 'row'),
            },
            {
              label: t('editor:dialog.tableStructure.actions.rowBelow'),
              action: () => openTableDialog('table-row-below', rowAnchor, 'row'),
            },
            {
              label: t('editor:dialog.tableStructure.actions.rowsCustom'),
              action: () => openTableDialog('table-rows-custom', rowAnchor, 'row'),
            },
            {
              label: t('editor:dialog.tableStructure.actions.deleteRow'),
              action: () => openTableDialog('table-row-delete', rowAnchor, 'row'),
            },
          );
        }
        if (cellAnchor) {
          tableCellActions.push(
            {
              label: t('editor:dialog.tableStructure.actions.editCell'),
              action: () => openTableDialog('table-cell-edit', cellAnchor, 'cell'),
            },
            {
              label: t('editor:dialog.tableStructure.actions.insertCell'),
              action: () => openTableDialog('table-cell-insert', cellAnchor, 'cell'),
            },
            {
              label: t('editor:dialog.tableStructure.actions.joinRight'),
              action: () => openTableDialog('table-cells-join-right', cellAnchor, 'cell'),
            },
            {
              label: t('editor:dialog.tableStructure.actions.splitLeft'),
              action: () => openTableDialog('table-cell-split-left', cellAnchor, 'cell'),
            },
            {
              label: t('editor:dialog.tableStructure.actions.splitRight'),
              action: () => openTableDialog('table-cell-split-right', cellAnchor, 'cell'),
            },
            {
              label: t('editor:dialog.tableStructure.actions.joinAbove'),
              action: () => openTableDialog('table-cell-join-above', cellAnchor, 'cell'),
            },
            {
              label: t('editor:dialog.tableStructure.actions.joinBelow'),
              action: () => openTableDialog('table-cell-join-below', cellAnchor, 'cell'),
            },
            {
              label: t('editor:dialog.tableStructure.actions.splitAbove'),
              action: () => openTableDialog('table-cell-split-above', cellAnchor, 'cell'),
            },
            {
              label: t('editor:dialog.tableStructure.actions.splitBelow'),
              action: () => openTableDialog('table-cell-split-below', cellAnchor, 'cell'),
            },
            {
              label: t('editor:dialog.tableStructure.actions.join'),
              action: () => openTableDialog('table-join', cellAnchor, 'cell'),
            },
            {
              label: t('editor:dialog.tableStructure.actions.split'),
              action: () => openTableDialog('table-split', cellAnchor, 'cell'),
            },
          );
          tableColumnActions.push(
            {
              label: t('editor:dialog.tableStructure.actions.columnBefore'),
              action: () => openTableDialog('table-column-before', cellAnchor, 'cell'),
            },
            {
              label: t('editor:dialog.tableStructure.actions.columnAfter'),
              action: () => openTableDialog('table-column-after', cellAnchor, 'cell'),
            },
            {
              label: t('editor:dialog.tableStructure.actions.columnsCustom'),
              action: () => openTableDialog('table-columns-custom', cellAnchor, 'cell'),
            },
            {
              label: t('editor:dialog.tableStructure.actions.deleteColumn'),
              action: () => openTableDialog('table-column-delete', cellAnchor, 'cell'),
            },
          );
        }
        wholeTableActions.push({
          label: t('editor:dialog.tableStructure.actions.sort'),
          action: () => openTableDialog('table-sort', tableSource, 'table'),
        });
        wholeTableActions.push({
          label: t('editor:dialog.tableStructure.actions.deleteTable'),
          action: () => openTableDialog('table-delete', tableSource, 'table'),
        });
      }

      if (tableCellActions.length > 0)
        tableActions.push({
          label: t('editor:dialog.tableStructure.groups.cell'),
          hasSubMenu: true,
          subMenu: tableCellActions,
        });
      if (tableRowActions.length > 0)
        tableActions.push({
          label: t('editor:dialog.tableStructure.groups.row'),
          hasSubMenu: true,
          subMenu: tableRowActions,
        });
      if (tableColumnActions.length > 0)
        tableActions.push({
          label: t('editor:dialog.tableStructure.groups.column'),
          hasSubMenu: true,
          subMenu: tableColumnActions,
        });
      if (wholeTableActions.length > 0)
        tableActions.push({
          label: t('editor:dialog.tableStructure.groups.table'),
          hasSubMenu: true,
          subMenu: wholeTableActions,
        });

      if (tableActions.length > 0) {
        if (menuItemsToAdd.length > 0) menuItemsToAdd.push({ type: 'divider' });
        menuItemsToAdd.push({
          label: t('editor:dialog.tableStructure.contextAction'),
          hasSubMenu: true,
          subMenu: tableActions,
        });
        isClickable = true;
      }

      if (paragraphAnchor?.closest('body')) {
        graphicActions.push(
          {
            label: t('editor:dialog.graphicStructure.actions.block'),
            action: () => openGraphicDialog('graphic-block', paragraphAnchor),
          },
          {
            label: t('editor:dialog.graphicStructure.actions.inline'),
            action: () => openGraphicDialog('graphic-inline-copy', paragraphAnchor),
          },
        );
      }
      if (renderedFigureAnchor?.closest('body')) {
        graphicActions.push({
          label: t('editor:dialog.graphicStructure.actions.imageMap'),
          action: () => openGraphicDialog('image-map-edit', renderedFigureAnchor),
        });
      }
      if (graphicActions.length > 0) {
        if (menuItemsToAdd.length > 0) menuItemsToAdd.push({ type: 'divider' });
        menuItemsToAdd.push({
          label: t('editor:dialog.graphicStructure.contextAction'),
          hasSubMenu: true,
          subMenu: graphicActions,
        });
        isClickable = true;
      }

      if (annotationCaret) {
        if (menuItemsToAdd.length > 0) menuItemsToAdd.push({ type: 'divider' });
        menuItemsToAdd.push({
          label: t('editor:dialog.foreignHandAnnotation.contextAction'),
          keyShortcut: 'STRG+ALT+A',
          action: () => {
            dispatch(
              setEditorDialogAndReferenceThunk({
                dialogType: EditorConstants.dialogTypes.FOREIGN_HAND_ANNOTATION,
                elementType: annotationCaret!.elementType,
                elementXmlId: annotationCaret!.sourcePath,
                elementKey: annotationCaret!.reference,
              }),
            );
          },
        });
        isClickable = true;

        menuItemsToAdd.push({
          label: t('editor:dialog.authorFootnote.contextAction'),
          keyShortcut: 'STRG+ALT+F',
          action: () => {
            dispatch(
              setEditorDialogAndReferenceThunk({
                dialogType: EditorConstants.dialogTypes.ADD_FOOTNOTE_AUTHOR,
                elementType: annotationCaret!.elementType,
                elementXmlId: annotationCaret!.sourcePath,
                elementKey: annotationCaret!.reference,
              }),
            );
          },
        });

        menuItemsToAdd.push({
          label: t('editor:dialog.crossReference.contextAction'),
          hasSubMenu: true,
          subMenu: [
            ['register', 'ctrl+alt+r'],
            ['letter-annotation', 'ctrl+shift+r'],
            ['external-url', 'ctrl+alt+u'],
            ['internal-url', 'ctrl+shift+u'],
            ['generic-target', 'ctrl+alt+z'],
            ['generic-start', 'ctrl+shift+z'],
          ].map(([kind, shortcut]) => ({
            label: t(`editor:dialog.crossReference.kinds.${kind}`),
            keyShortcut: shortcut,
            action: () => {
              dispatch(
                setEditorDialogAndReferenceThunk({
                  dialogType: EditorConstants.dialogTypes.CROSS_REFERENCE,
                  elementType: kind,
                  elementXmlId: annotationCaret!.sourcePath,
                  elementKey: annotationCaret!.reference,
                }),
              );
            },
          })),
        });
      }

      if (fractionCaret) {
        if (menuItemsToAdd.length > 0) menuItemsToAdd.push({ type: 'divider' });
        menuItemsToAdd.push({
          label: t('editor:dialog.horizontalFraction.contextAction'),
          hasSubMenu: true,
          subMenu: [
            {
              label: t('editor:dialog.horizontalFraction.horizontalAction'),
              keyShortcut: 'STRG+2',
              action: () => {
                dispatch(
                  setEditorDialogAndReferenceThunk({
                    dialogType: EditorConstants.dialogTypes.HORIZONTAL_FRACTION,
                    elementType: fractionCaret!.elementType,
                    elementXmlId: fractionCaret!.sourcePath,
                    elementKey: fractionCaret!.reference,
                  }),
                );
              },
            },
            {
              label: t('editor:dialog.horizontalFraction.verticalSlashAction'),
              keyShortcut: 'STRG+3',
              action: () => {
                dispatch(
                  setEditorDialogAndReferenceThunk({
                    dialogType: EditorConstants.dialogTypes.VERTICAL_SLASH_FRACTION,
                    elementType: fractionCaret!.elementType,
                    elementXmlId: fractionCaret!.sourcePath,
                    elementKey: fractionCaret!.reference,
                  }),
                );
              },
            },
            {
              label: t('editor:dialog.horizontalFraction.verticalNoSlashAction'),
              keyShortcut: 'STRG+4',
              action: () => {
                dispatch(
                  setEditorDialogAndReferenceThunk({
                    dialogType: EditorConstants.dialogTypes.VERTICAL_NOSLASH_FRACTION,
                    elementType: fractionCaret!.elementType,
                    elementXmlId: fractionCaret!.sourcePath,
                    elementKey: fractionCaret!.reference,
                  }),
                );
              },
            },
          ],
        });
        isClickable = true;
      }

      const foreignAnnotationXmlId =
        foreignAnnotationMarker?.dataset.editorForeignAnnotationId || foreignAnnotationAnchor?.getAttribute('xml:id');
      const hasExistingNoteAction = menuItemsToAdd.some((item) => item.identifier === EditorConstants.menuItemTypes.WRITING_ACT.EDIT_NOTE);
      if (foreignAnnotationXmlId && !hasExistingNoteAction) {
        if (menuItemsToAdd.length > 0) menuItemsToAdd.push({ type: 'divider' });
        menuItemsToAdd.push({
          identifier: EditorConstants.menuItemTypes.WRITING_ACT.EDIT_NOTE,
          label: t('editor:dialog.foreignHandAnnotation.editContextAction'),
          action: () => {
            dispatch(
              setEditorDialogAndReferenceThunk({
                dialogType: EditorConstants.dialogTypes.FOREIGN_HAND_ANNOTATION,
                elementType: 'note',
                elementXmlId: foreignAnnotationXmlId,
                elementKey: 'edit',
              }),
            );
          },
        });
        isClickable = true;
      }

      if (!figureUploadInProgress && xmlDocRef.current && xmlContentRef.current) {
        const figureAnchor = findFigureAnchor(targetNode, xmlContentRef.current, xmlDocRef.current);

        if (figureAnchor) {
          if (menuItemsToAdd.length > 0) menuItemsToAdd.push({ type: 'divider' });
          menuItemsToAdd.push({
            label: t('editor:dialog.figureUpload.contextAction'),
            action: () => {
              dispatch(
                setEditorDialogAndReferenceThunk({
                  dialogType: EditorConstants.dialogTypes.FIGURE_UPLOAD,
                  elementType: figureAnchor.element.tagName,
                  elementXmlId: figureAnchor.xmlId,
                  elementKey: null,
                }),
              );
            },
          });
          isClickable = true;
        }
      }

      const documentationAnchor = targetElement?.closest<HTMLElement>('[data-editor-xml-path]');
      if (documentationAnchor) {
        const documentationElement = resolveTeiElementByPath(xmlDocRef.current, documentationAnchor.dataset.editorXmlPath);
        const elementName = documentationElement?.localName ?? documentationAnchor.localName;

        if (menuItemsToAdd.length > 0) menuItemsToAdd.push({ type: 'divider' });
        menuItemsToAdd.push({
          label: t('editor:dialog.teiDocumentation.contextAction', { element: elementName }),
          action: () => {
            if (!documentationElement || !openTeiP5Documentation(documentationElement)) {
              enqueueSnackbar(
                t('editor:dialog.teiDocumentation.unsupportedElement', {
                  element: elementName,
                }),
                { variant: 'warning' },
              );
            }
          },
        });
        isClickable = true;
      }

      if (!isClickable) {
        props.setAnchorPosition(null);
        dispatch(setNodeClicked({ nodeClicked: false }));
        return;
      }

      setDisplayMenuItems(menuItemsToAdd);
      props.setAnchorPosition({ top: event.clientY, left: event.clientX });
      dispatch(
        setEditorNodeClickedAndContentLeftRightThunk({
          nodeClicked: true,
          textIsMarked: false,
          contentLeft: null,
          contentRight: null,
        }),
      );
    },
    [
      dispatch,
      figureUploadInProgress,
      menuItemsMarked,
      pathHandlers,
      props,
      removeSuperscript,
      stateEditorLetter.xmlContent,
      t,
      xmlContentRef,
    ],
  );

  /** CLOSE MENU */
  const handleCloseAll = () => {
    setNestedSubmenuAnchorEl(null);
    setOpenNestedSubmenuIndex(null);
    setSubmenuAnchorEl(null);
    setOpenSubmenuIndex(null);
    props.setAnchorPosition(null);
    setSelectedNode(null);
  };

  /** REGISTER MOUSE EVENTS */
  useEffect(() => {
    const el = xmlContentRef.current;
    if (!el) return;

    el.addEventListener('mouseup', handleMouseUpMarkedElements, { capture: true });
    el.addEventListener('contextmenu', handleNoMarkupRightClick, { capture: true });

    return () => {
      el.removeEventListener('mouseup', handleMouseUpMarkedElements, { capture: true });
      el.removeEventListener('contextmenu', handleNoMarkupRightClick, { capture: true });
    };
  }, [props.xmlContentRef, handleMouseUpMarkedElements, handleNoMarkupRightClick, xmlContentRef]);

  useEffect(() => {
    if (!contentTextIsMarked) return;

    const handleClearSelectionShortcut = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      clearMarkedSelection();
    };

    document.addEventListener('keydown', handleClearSelectionShortcut, true);
    return () => document.removeEventListener('keydown', handleClearSelectionShortcut, true);
  }, [clearMarkedSelection, contentTextIsMarked]);

  const SndMenuItemStylesSpan = {
    fontSize: '0.575rem',
    padding: '0px 12px',
    minHeight: '15px',
    color: 'grey',
    cursor: 'pointer',
  };

  return (
    <>
      <Menu
        open={Boolean(props.anchorPosition)}
        onClose={handleCloseAll}
        anchorReference="anchorPosition"
        anchorPosition={props.anchorPosition ? { top: props.anchorPosition.top, left: props.anchorPosition.left } : undefined}
      >
        {displayMenuItems.map((item, index) =>
          item.type === 'divider' ? (
            <Divider key={index} />
          ) : item.type === 'inactive' ? (
            <MenuItem key={index} disabled sx={{ fontSize: '90%', opacity: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>{item.label}</span>
              </Box>
            </MenuItem>
          ) : (
            <MenuItem
              key={index}
              onClick={(e) => {
                if (item.hasSubMenu) {
                  setNestedSubmenuAnchorEl(null);
                  setOpenNestedSubmenuIndex(null);
                  setSubmenuAnchorEl(e.currentTarget);
                  setOpenSubmenuIndex(index);
                } else {
                  item.action?.(selectedNode ? { node: selectedNode } : {});
                  handleCloseAll();
                }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  fontSize: '70%',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <span>{item.label}</span>
                {item.keyShortcut && <span style={SndMenuItemStylesSpan}>{item.keyShortcut}</span>}
                {item.hasSubMenu && <span style={{ marginLeft: 'auto' }}>▶</span>}
              </Box>
            </MenuItem>
          ),
        )}
      </Menu>
      {openSubmenuIndex !== null && displayMenuItems[openSubmenuIndex]?.subMenu && (
        <Menu
          anchorEl={submenuAnchorEl}
          open={Boolean(submenuAnchorEl)}
          onClose={handleCloseAll}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { sx: { minWidth: '6rem' } } }}
        >
          {displayMenuItems[openSubmenuIndex]!.subMenu!.map((subItem, subIndex) => (
            <MenuItem
              key={subIndex}
              onClick={(event) => {
                if (subItem.hasSubMenu) {
                  setNestedSubmenuAnchorEl(event.currentTarget);
                  setOpenNestedSubmenuIndex(subIndex);
                } else {
                  subItem.action?.(selectedNode ? { node: selectedNode } : {});
                  handleCloseAll();
                }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  fontSize: '70%',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <span>{subItem.label}</span>
                {subItem.keyShortcut && <span style={SndMenuItemStylesSpan}>{subItem.keyShortcut}</span>}
                {subItem.hasSubMenu && <span style={{ marginLeft: 'auto' }}>▶</span>}
              </Box>
            </MenuItem>
          ))}
        </Menu>
      )}
      {openSubmenuIndex !== null &&
        openNestedSubmenuIndex !== null &&
        displayMenuItems[openSubmenuIndex]?.subMenu?.[openNestedSubmenuIndex]?.subMenu && (
          <Popper
            anchorEl={nestedSubmenuAnchorEl}
            open={Boolean(nestedSubmenuAnchorEl)}
            placement="right-start"
            sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
          >
            <Paper elevation={8}>
              <MenuList>
                {displayMenuItems[openSubmenuIndex]!.subMenu![openNestedSubmenuIndex]!.subMenu!.map((nestedItem, nestedIndex) => (
                  <MenuItem
                    key={nestedIndex}
                    onClick={() => {
                      nestedItem.action?.(selectedNode ? { node: selectedNode } : {});
                      handleCloseAll();
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        fontSize: '70%',
                        justifyContent: 'space-between',
                        width: '100%',
                      }}
                    >
                      <span>{nestedItem.label}</span>
                      {nestedItem.keyShortcut && <span style={SndMenuItemStylesSpan}>{nestedItem.keyShortcut}</span>}
                    </Box>
                  </MenuItem>
                ))}
              </MenuList>
            </Paper>
          </Popper>
        )}
    </>
  );
};

export default RightClickActionMenuOptimized;
