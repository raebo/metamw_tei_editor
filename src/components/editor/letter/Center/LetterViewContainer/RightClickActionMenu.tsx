import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Box, Menu, Divider, ListSubheader, MenuList, Paper, Popper, Typography } from '@mui/material';
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
import { removeSectionHeading, resolveSourceElement, type ParagraphStructureOperation } from '@src/utils/editor/paragraphStructure';
import { canInsertSectionAddressLine, insertSectionAddressLine, resolveAddressSource } from '@src/utils/editor/sectionAddressLine';
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
import { removeInlineFormatting, resolveInlineFormatting, type InlineFormat } from '@src/utils/editor/inlineFormatting';
import EditorCommandMenuItem, { editorCommandMenuPaperSx } from '@src/components/editor/letter/Util/EditorCommandMenuItem';

const SECTION_SELECTOR =
  'div[data-editor-xml-path], div1[data-editor-xml-path], div2[data-editor-xml-path], div3[data-editor-xml-path], div4[data-editor-xml-path], div5[data-editor-xml-path], div6[data-editor-xml-path], div7[data-editor-xml-path]';
const SELECTION_HINT_SESSION_KEY = 'tei-editor-selection-clear-hint-count';
const SELECTION_HINT_DISPLAY_LIMIT = 3;
const SELECTION_HINT_DURATION_MS = 7000;

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
  const [showSelectionHint, setShowSelectionHint] = useState(false);

  const xmlDocRef = useRef<XMLDocument | null>(null);

  const addressSectionReference = useRef<string | null>(null);
  const addressInsertPending = useRef(false);

  const getAddressSectionReference = useCallback((target: Element | null): string | null => {
    const section = target?.closest<HTMLElement>(SECTION_SELECTOR);
    const source = resolveTeiElementByPath(xmlDocRef.current, section?.dataset.editorXmlPath);
    if (!source || !canInsertSectionAddressLine(source)) return null;
    return source.getAttribute('xml:id') ?? `path:${section!.dataset.editorXmlPath}`;
  }, []);

  const insertAddressLine = useCallback(
    async (reference: string) => {
      if (addressInsertPending.current) return;
      addressInsertPending.current = true;
      try {
        await runXmlAction(
          dispatch,
          () => reduxStore.getState() as RootState,
          (doc) => {
            insertSectionAddressLine(resolveAddressSource(doc, reference));
          },
          EditorConstants.changeTypes.misc.ADDRLINE_ADDED,
          t('editor:dialog.sectionAddressLine.inserted'),
        );
      } finally {
        addressInsertPending.current = false;
      }
    },
    [dispatch, reduxStore, t],
  );

  useEffect(() => {
    addressSectionReference.current = null;
  }, [stateEditorLetter.id, stateEditorLetter.xmlContent]);

  useEffect(() => {
    const rememberSection = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const target = event.target instanceof Element ? event.target : null;
      addressSectionReference.current = target && xmlContentRef.current?.contains(target) ? getAddressSectionReference(target) : null;
    };
    const insertFromShortcut = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== 'c' ||
        !event.ctrlKey ||
        !event.altKey ||
        event.shiftKey ||
        event.metaKey ||
        event.repeat ||
        event.isComposing ||
        event.defaultPrevented ||
        !addressSectionReference.current
      )
        return;
      const state = (reduxStore.getState() as RootState).editorLetter;
      const target = event.target instanceof Element ? event.target : null;
      if (
        state.dialogType ||
        state.figureUploadInProgress ||
        state.letter.viewMode !== 'WYSIWYG' ||
        target?.closest('input, textarea, select, [role="dialog"]') ||
        (target && target !== document.body && !xmlContentRef.current?.contains(target))
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      void insertAddressLine(addressSectionReference.current);
    };
    document.addEventListener('click', rememberSection, true);
    document.addEventListener('keydown', insertFromShortcut, true);
    return () => {
      document.removeEventListener('click', rememberSection, true);
      document.removeEventListener('keydown', insertFromShortcut, true);
    };
  }, [getAddressSectionReference, insertAddressLine, reduxStore, xmlContentRef]);

  const runMarkedAction = useCallback(
    (shortcut: string) => {
      const definition = contentMarkedKeyHandleDefinitions[shortcut];
      if (!definition) return;
      const action = generateKeyHandleAction(definition);
      void action?.(dispatch, () => reduxStore.getState() as RootState);
    },
    [dispatch, reduxStore],
  );

  const removeInlineFormat = useCallback(
    (reference: string, format: InlineFormat) => {
      void runXmlAction(
        dispatch,
        () => reduxStore.getState() as RootState,
        (xmlDoc) => removeInlineFormatting(resolveInlineFormatting(xmlDoc, reference, format), format),
        EditorConstants.changeTypes.misc.CONTENT_FORMAT_CHANGED,
        t(`editor:dialog.inlineFormatting.${format}.removed`),
      );
    },
    [dispatch, reduxStore, t],
  );

  const deleteSectionHeading = useCallback(
    (sourcePath: string) => {
      void runXmlAction(
        dispatch,
        () => reduxStore.getState() as RootState,
        (xmlDoc) => removeSectionHeading(resolveSourceElement(xmlDoc, sourcePath)),
        EditorConstants.changeTypes.misc.BODY_STRUCTURE_CHANGED,
        t('editor:dialog.paragraphStructure.sectionHeadingRemoved'),
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
  const menuItemsMarked = useMemo(() => {
    const contextualItems = createContextMenuItems({
      handleMenuItemClick: (left, right) => {
        props.setAnchorPosition(null);
        dispatch(setEditorSelectedItem({ selectedItem: { left, right } }));
      },
      handleMenuItemDialogClick: (dialogType: string) => {
        props.setAnchorPosition(null);
        dispatch(setDialogType({ dialogType }));
      },
      handleShortcut: runMarkedAction,
    });

    const splitParagraph: MenuItemType = {
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
    };
    const listCommands: MenuItemType = {
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
    };
    const foreignText: MenuItemType = {
      label: t('editor:dialog.foreignText.contextAction'),
      keyShortcut: 'Ctrl+Alt+X',
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
    };
    const abbreviation: MenuItemType = {
      label: t('editor:dialog.abbreviation.contextAction'),
      keyShortcut: 'Ctrl+1',
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
    };
    const inlineFormatting: MenuItemType = {
      label: t('editor:dialog.inlineFormatting.contextMenu'),
      hasSubMenu: true,
      subMenu: [
        ['superscript', 'ctrl+5'],
        ['subscript', 'ctrl+6'],
        ['groundline', 'ctrl+7'],
        ['latintype', 'ctrl+8'],
        ['antiqua', 'ctrl+alt+g'],
        ['gothic', 'ctrl+alt+h'],
      ].map(([format, shortcut]) => ({
        label: t(`editor:dialog.inlineFormatting.${format}.applyAction`),
        keyShortcut: shortcut,
        action: () => {
          props.setAnchorPosition(null);
          runMarkedAction(shortcut);
        },
      })),
    };
    const crossReferences: MenuItemType = {
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
    };

    return [
      {
        label: t('editor:dialog.commandGroups.entities'),
        hasSubMenu: true,
        subMenu: contextualItems.filter((item) => item.group === 'entities'),
      },
      {
        label: t('editor:dialog.commandGroups.textMarkup'),
        hasSubMenu: true,
        subMenu: [foreignText, abbreviation, inlineFormatting],
      },
      {
        label: t('editor:dialog.commandGroups.references'),
        hasSubMenu: true,
        subMenu: [...contextualItems.filter((item) => item.group === 'references'), crossReferences],
      },
      {
        label: t('editor:dialog.commandGroups.structure'),
        hasSubMenu: true,
        subMenu: [splitParagraph, listCommands, ...contextualItems.filter((item) => item.group === 'structure')],
      },
      { type: 'divider' as const },
      {
        label: t('editor:dialog.selection.clearAction'),
        keyShortcut: 'Esc',
        action: clearMarkedSelection,
      },
    ];
  }, [clearMarkedSelection, dispatch, props, runMarkedAction, t]);

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
      const addressLineTarget = targetElement?.closest<HTMLElement>('[data-editor-address-line-reference]');
      const addressLineReference = addressLineTarget?.dataset.editorAddressLineReference;
      if (addressLineReference) {
        const openAddressLine = (operation: 'edit' | 'delete') =>
          dispatch(
            setEditorDialogAndReferenceThunk({
              dialogType: EditorConstants.dialogTypes.SECTION_ADDRESS_LINE,
              elementType: 'addrLine',
              elementXmlId: addressLineReference,
              elementKey: operation,
            }),
          );
        setDisplayMenuItems([
          {
            label: t('editor:dialog.sectionAddressLine.edit'),
            action: () => {
              openAddressLine('edit');
            },
          },
          {
            label: t('editor:dialog.sectionAddressLine.delete'),
            danger: true,
            action: () => {
              openAddressLine('delete');
            },
          },
        ]);
        props.setAnchorPosition({ top: event.clientY, left: event.clientX });
        return;
      }
      if (targetElement?.closest('span.marked')) {
        setDisplayMenuItems(menuItemsMarked);
        props.setAnchorPosition({ top: event.clientY, left: event.clientX });
        return;
      }
      const inlineFormatTarget = targetElement?.closest<HTMLElement>('[data-editor-inline-format-reference]');
      const inlineFormatReference = inlineFormatTarget?.dataset.editorInlineFormatReference;
      const inlineFormat = inlineFormatTarget?.dataset.editorInlineFormat;
      if (
        inlineFormatReference &&
        (inlineFormat === 'superscript' ||
          inlineFormat === 'subscript' ||
          inlineFormat === 'groundline' ||
          inlineFormat === 'latintype' ||
          inlineFormat === 'antiqua' ||
          inlineFormat === 'gothic')
      ) {
        setDisplayMenuItems([
          {
            label: t(`editor:dialog.inlineFormatting.${inlineFormat}.removeAction`),
            danger: true,
            action: () => removeInlineFormat(inlineFormatReference, inlineFormat),
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
            danger: true,
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
            danger: true,
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
            danger: true,
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
            danger: true,
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
            danger: true,
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
            danger: true,
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
      const sectionCaretAnchor = targetElement?.closest<HTMLElement>('[data-editor-section-caret]');

      if (!sectionCaretAnchor) {
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
      }

      const paragraphAnchor = targetElement?.closest<HTMLElement>('p[data-editor-xml-path]');
      const sectionAnchor = targetElement?.closest<HTMLElement>(SECTION_SELECTOR);
      const writingActAnchor = targetElement?.closest<HTMLElement>('div[type="act_of_writing"][data-editor-xml-path]');
      const addressReference = getAddressSectionReference(targetElement);
      const addressCommand: MenuItemType | null =
        addressReference || writingActAnchor
          ? {
              label: t('editor:dialog.sectionAddressLine.insert'),
              keyShortcut: 'Ctrl+Alt+C',
              disabled: !addressReference,
              disabledReason: !addressReference ? t('editor:dialog.commandGroups.disabledReasons.addressContextRequired') : undefined,
              action: () => {
                if (addressReference) void insertAddressLine(addressReference);
              },
            }
          : null;
      if (addressCommand && !sectionCaretAnchor) {
        menuItemsToAdd.push(addressCommand);
        isClickable = true;
      }
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
      const writingActContentActions: NonNullable<MenuItemType['subMenu']> = [];
      const writingActMetadataActions: NonNullable<MenuItemType['subMenu']> = [];
      const writingActOrganizationActions: NonNullable<MenuItemType['subMenu']> = [];
      const listActions: NonNullable<MenuItemType['subMenu']> = [];
      const tableActions: NonNullable<MenuItemType['subMenu']> = [];
      const tableCellActions: NonNullable<MenuItemType['subMenu']> = [];
      const tableRowActions: NonNullable<MenuItemType['subMenu']> = [];
      const tableColumnActions: NonNullable<MenuItemType['subMenu']> = [];
      const wholeTableActions: NonNullable<MenuItemType['subMenu']> = [];
      const graphicActions: NonNullable<MenuItemType['subMenu']> = [];
      const referenceActions: NonNullable<MenuItemType['subMenu']> = [];
      let annotationCaret: ReturnType<typeof captureForeignHandAnnotationCaret> | null = null;
      let fractionCaret: ReturnType<typeof captureFractionCaret> | null = null;
      const writingActNumber = writingActAnchor?.getAttribute('n') ?? null;
      let figureUploadCommand: MenuItemType | null = null;
      let documentationCommand: MenuItemType | null = null;

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
        const paragraphSource = resolveTeiElementByPath(xmlDocRef.current, paragraphAnchor.dataset.editorXmlPath);
        const paragraphContentEditable = paragraphSource?.children.length === 0;
        structureActions.push({
          label: t('editor:dialog.paragraphStructure.actions.editParagraphContent'),
          action: () => openStructureDialog('paragraph-edit', paragraphAnchor),
          disabled: !paragraphContentEditable,
          disabledReason: !paragraphContentEditable ? t('editor:dialog.commandGroups.disabledReasons.plainParagraphRequired') : undefined,
        });
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
        const sectionSource = resolveTeiElementByPath(xmlDocRef.current, sectionAnchor.dataset.editorXmlPath);
        const hasHeading = Boolean(
          sectionSource && Array.from(sectionSource.children).some((child) => child.localName.toLowerCase() === 'head'),
        );

        const appendParagraphCommand: MenuItemType = {
          label: t('editor:dialog.paragraphStructure.actions.appendParagraph'),
          action: () => openStructureDialog('paragraph-append', sectionAnchor),
        };
        structureActions.push(appendParagraphCommand);
        if (isWritingAct) writingActContentActions.push(appendParagraphCommand);

        if (sectionName === 'div' || (sectionLevel >= 1 && sectionLevel < 7)) {
          const childSectionCommand: MenuItemType = {
            label: t('editor:dialog.paragraphStructure.actions.insertChildSection'),
            action: () => openStructureDialog('section-child', sectionAnchor),
          };
          structureActions.push(childSectionCommand);
          if (isWritingAct) writingActContentActions.push(childSectionCommand);
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
          structureActions.push({
            label: t('editor:dialog.paragraphStructure.actions.deleteSectionHeading'),
            danger: true,
            disabled: !hasHeading,
            disabledReason: !hasHeading ? t('editor:dialog.commandGroups.disabledReasons.sectionHeadingRequired') : undefined,
            action: () => {
              const sourcePath = sectionAnchor.dataset.editorXmlPath;
              if (sourcePath !== undefined) deleteSectionHeading(sourcePath);
            },
          });
        }
      }

      if (writingActAnchor) {
        const writingActSource = resolveTeiElementByPath(xmlDocRef.current, writingActAnchor.dataset.editorXmlPath);
        const managePeopleItem = menuItemsNoMarking.find(
          (item) => item.identifier === EditorConstants.menuItemTypes.WRITING_ACT.MANAGE_AUTHOR_WRITER,
        );
        if (managePeopleItem?.action) {
          writingActMetadataActions.push({
            label: t('editor:dialog.paragraphStructure.actions.manageWritingActPeople'),
            action: () => managePeopleItem.action?.({ node: writingActSource ?? writingActAnchor }),
          });
        }

        writingActOrganizationActions.push({
          label: t('editor:dialog.paragraphStructure.actions.addWritingAct'),
          action: () => {
            const sourcePath = writingActAnchor.dataset.editorXmlPath;
            if (sourcePath === undefined) return;
            dispatch(
              setEditorDialogAndReferenceThunk({
                dialogType: EditorConstants.dialogTypes.ADD_WRITING_PART,
                elementType: writingActAnchor.localName,
                elementXmlId: sourcePath,
                elementKey: null,
              }),
            );
          },
        });

        const writingActs = writingActSource?.parentElement
          ? Array.from(writingActSource.parentElement.children).filter(
              (child) => child.localName.toLowerCase() === 'div' && child.getAttribute('type') === 'act_of_writing',
            )
          : [];
        const writingActIndex = writingActSource ? writingActs.indexOf(writingActSource) : -1;
        const addMoveAction = (identifier: string, label: string, disabled: boolean, disabledReason: string) => {
          const moveItem = menuItemsNoMarking.find((item) => item.identifier === identifier);
          if (!moveItem?.action) return;
          writingActOrganizationActions.push({
            label,
            action: () => moveItem.action?.({ node: writingActAnchor }),
            disabled,
            disabledReason,
          });
        };

        addMoveAction(
          EditorConstants.menuItemTypes.WRITING_ACT.MOVE_UP,
          t('editor:dialog.paragraphStructure.actions.moveWritingActUp'),
          writingActIndex <= 0,
          t('editor:dialog.paragraphStructure.disabledReasons.firstWritingAct'),
        );
        addMoveAction(
          EditorConstants.menuItemTypes.WRITING_ACT.MOVE_DOWN,
          t('editor:dialog.paragraphStructure.actions.moveWritingActDown'),
          writingActIndex < 0 || writingActIndex >= writingActs.length - 1,
          t('editor:dialog.paragraphStructure.disabledReasons.lastWritingAct'),
        );
      }

      if (structureActions.length > 0) {
        if (sectionCaretAnchor && writingActAnchor) {
          if (addressCommand) writingActMetadataActions.push(addressCommand);
          menuItemsToAdd.push(
            {
              type: 'header',
              label: writingActNumber
                ? t('editor:dialog.paragraphStructure.writingActMenuTitle', {
                    number: writingActNumber,
                  })
                : t('editor:dialog.paragraphStructure.writingActMenuTitleWithoutNumber'),
            },
            {
              label: t('editor:dialog.commandGroups.content'),
              hasSubMenu: true,
              subMenu: writingActContentActions,
            },
            {
              label: t('editor:dialog.commandGroups.metadata'),
              hasSubMenu: true,
              subMenu: writingActMetadataActions,
            },
            {
              label: t('editor:dialog.commandGroups.organize'),
              hasSubMenu: true,
              subMenu: writingActOrganizationActions,
            },
          );
        } else {
          if (menuItemsToAdd.length > 0) menuItemsToAdd.push({ type: 'divider' });
          menuItemsToAdd.push({
            label: t('editor:dialog.paragraphStructure.contextAction'),
            hasSubMenu: true,
            subMenu: structureActions,
          });
        }
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
        listActions.push(
          {
            label: t('editor:dialog.listStructure.actions.addItem'),
            action: () => openListDialog('list-add-item', listSource),
          },
          {
            label: t('editor:dialog.listStructure.actions.editItem'),
            action: () => openListDialog('list-edit-item', itemAnchor ?? listSource),
            disabled: !itemAnchor,
            disabledReason: !itemAnchor ? t('editor:dialog.commandGroups.disabledReasons.listItemRequired') : undefined,
          },
          {
            label: t('editor:dialog.listStructure.actions.deleteItem'),
            danger: true,
            action: () => openListDialog('list-delete-item', itemAnchor ?? listSource),
            disabled: !itemAnchor,
            disabledReason: !itemAnchor ? t('editor:dialog.commandGroups.disabledReasons.listItemRequired') : undefined,
          },
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
            danger: true,
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
        const tableCommand = (
          label: string,
          operation: TableStructureOperation,
          anchor: HTMLElement,
          elementType: 'cell' | 'row',
          disabled: boolean,
          disabledReason: string,
          danger = false,
        ): MenuItemType => ({
          label,
          action: () => openTableDialog(operation, anchor, elementType),
          disabled,
          disabledReason: disabled ? disabledReason : undefined,
          danger,
        });
        const cellTarget = cellAnchor ?? tableSource;
        const rowTarget = rowAnchor ?? tableSource;
        const cellUnavailable = !cellAnchor;
        const rowUnavailable = !rowAnchor;
        const cellReason = t('editor:dialog.commandGroups.disabledReasons.tableCellRequired');
        const rowReason = t('editor:dialog.commandGroups.disabledReasons.tableRowRequired');

        tableCellActions.push(
          tableCommand(
            t('editor:dialog.tableStructure.actions.editCell'),
            'table-cell-edit',
            cellTarget,
            'cell',
            cellUnavailable,
            cellReason,
          ),
          tableCommand(
            t('editor:dialog.tableStructure.actions.insertCell'),
            'table-cell-insert',
            cellTarget,
            'cell',
            cellUnavailable,
            cellReason,
          ),
          tableCommand(
            t('editor:dialog.tableStructure.actions.joinRight'),
            'table-cells-join-right',
            cellTarget,
            'cell',
            cellUnavailable,
            cellReason,
          ),
          tableCommand(
            t('editor:dialog.tableStructure.actions.splitLeft'),
            'table-cell-split-left',
            cellTarget,
            'cell',
            cellUnavailable,
            cellReason,
          ),
          tableCommand(
            t('editor:dialog.tableStructure.actions.splitRight'),
            'table-cell-split-right',
            cellTarget,
            'cell',
            cellUnavailable,
            cellReason,
          ),
          tableCommand(
            t('editor:dialog.tableStructure.actions.joinAbove'),
            'table-cell-join-above',
            cellTarget,
            'cell',
            cellUnavailable,
            cellReason,
          ),
          tableCommand(
            t('editor:dialog.tableStructure.actions.joinBelow'),
            'table-cell-join-below',
            cellTarget,
            'cell',
            cellUnavailable,
            cellReason,
          ),
          tableCommand(
            t('editor:dialog.tableStructure.actions.splitAbove'),
            'table-cell-split-above',
            cellTarget,
            'cell',
            cellUnavailable,
            cellReason,
          ),
          tableCommand(
            t('editor:dialog.tableStructure.actions.splitBelow'),
            'table-cell-split-below',
            cellTarget,
            'cell',
            cellUnavailable,
            cellReason,
          ),
          tableCommand(t('editor:dialog.tableStructure.actions.join'), 'table-join', cellTarget, 'cell', cellUnavailable, cellReason),
          tableCommand(t('editor:dialog.tableStructure.actions.split'), 'table-split', cellTarget, 'cell', cellUnavailable, cellReason),
        );
        tableRowActions.push(
          tableCommand(t('editor:dialog.tableStructure.actions.rowAbove'), 'table-row-above', rowTarget, 'row', rowUnavailable, rowReason),
          tableCommand(t('editor:dialog.tableStructure.actions.rowBelow'), 'table-row-below', rowTarget, 'row', rowUnavailable, rowReason),
          tableCommand(
            t('editor:dialog.tableStructure.actions.rowsCustom'),
            'table-rows-custom',
            rowTarget,
            'row',
            rowUnavailable,
            rowReason,
          ),
          tableCommand(
            t('editor:dialog.tableStructure.actions.deleteRow'),
            'table-row-delete',
            rowTarget,
            'row',
            rowUnavailable,
            rowReason,
            true,
          ),
        );
        tableColumnActions.push(
          tableCommand(
            t('editor:dialog.tableStructure.actions.columnBefore'),
            'table-column-before',
            cellTarget,
            'cell',
            cellUnavailable,
            cellReason,
          ),
          tableCommand(
            t('editor:dialog.tableStructure.actions.columnAfter'),
            'table-column-after',
            cellTarget,
            'cell',
            cellUnavailable,
            cellReason,
          ),
          tableCommand(
            t('editor:dialog.tableStructure.actions.columnsCustom'),
            'table-columns-custom',
            cellTarget,
            'cell',
            cellUnavailable,
            cellReason,
          ),
          tableCommand(
            t('editor:dialog.tableStructure.actions.deleteColumn'),
            'table-column-delete',
            cellTarget,
            'cell',
            cellUnavailable,
            cellReason,
            true,
          ),
        );
        wholeTableActions.push({
          label: t('editor:dialog.tableStructure.actions.sort'),
          action: () => openTableDialog('table-sort', tableSource, 'table'),
        });
        wholeTableActions.push({
          label: t('editor:dialog.tableStructure.actions.deleteTable'),
          danger: true,
          action: () => openTableDialog('table-delete', tableSource, 'table'),
        });
      }

      if (tableCellActions.length > 0)
        tableActions.push({
          label: t('editor:dialog.tableStructure.groups.cell'),
          hasSubMenu: true,
          subMenu: tableCellActions,
          disabled: !cellAnchor,
          disabledReason: !cellAnchor ? t('editor:dialog.commandGroups.disabledReasons.tableCellRequired') : undefined,
        });
      if (tableRowActions.length > 0)
        tableActions.push({
          label: t('editor:dialog.tableStructure.groups.row'),
          hasSubMenu: true,
          subMenu: tableRowActions,
          disabled: !rowAnchor,
          disabledReason: !rowAnchor ? t('editor:dialog.commandGroups.disabledReasons.tableRowRequired') : undefined,
        });
      if (tableColumnActions.length > 0)
        tableActions.push({
          label: t('editor:dialog.tableStructure.groups.column'),
          hasSubMenu: true,
          subMenu: tableColumnActions,
          disabled: !cellAnchor,
          disabledReason: !cellAnchor ? t('editor:dialog.commandGroups.disabledReasons.tableCellRequired') : undefined,
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
        const referenceStartIndex = menuItemsToAdd.length;
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
        referenceActions.push(...menuItemsToAdd.slice(referenceStartIndex));
      }

      if (fractionCaret) {
        if (menuItemsToAdd.length > 0) menuItemsToAdd.push({ type: 'divider' });
        const fractionCommand: MenuItemType = {
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
        };
        menuItemsToAdd.push(fractionCommand);
        referenceActions.push(fractionCommand);
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

      if (xmlDocRef.current && xmlContentRef.current) {
        const figureAnchor = findFigureAnchor(targetNode, xmlContentRef.current, xmlDocRef.current);

        if (figureAnchor) {
          if (menuItemsToAdd.length > 0) menuItemsToAdd.push({ type: 'divider' });
          figureUploadCommand = {
            label: t('editor:dialog.figureUpload.contextAction'),
            disabled: figureUploadInProgress,
            disabledReason: figureUploadInProgress ? t('editor:dialog.commandGroups.disabledReasons.figureUploadInProgress') : undefined,
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
          };
          menuItemsToAdd.push(figureUploadCommand);
          isClickable = true;
        }
      }

      const documentationAnchor = targetElement?.closest<HTMLElement>('[data-editor-xml-path]');
      if (documentationAnchor) {
        const documentationElement = resolveTeiElementByPath(xmlDocRef.current, documentationAnchor.dataset.editorXmlPath);
        const elementName = documentationElement?.localName ?? documentationAnchor.localName;

        if (menuItemsToAdd.length > 0) menuItemsToAdd.push({ type: 'divider' });
        documentationCommand = {
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
        };
        menuItemsToAdd.push(documentationCommand);
        isClickable = true;
      }

      if (!isClickable) {
        props.setAnchorPosition(null);
        dispatch(setNodeClicked({ nodeClicked: false }));
        return;
      }

      if (!sectionCaretAnchor && writingActAnchor) {
        const writingActIdentifiers = new Set<string>([
          EditorConstants.menuItemTypes.WRITING_ACT.MANAGE_AUTHOR_WRITER,
          EditorConstants.menuItemTypes.WRITING_ACT.MOVE_UP,
          EditorConstants.menuItemTypes.WRITING_ACT.MOVE_DOWN,
        ]);
        const writingActCommands = new Set([...writingActMetadataActions, ...writingActOrganizationActions]);
        const structuralMenus = new Set([structureActions, listActions, tableActions, graphicActions]);
        const contextualActions = menuItemsToAdd.filter(
          (item) =>
            item.type !== 'divider' &&
            item.type !== 'header' &&
            !writingActIdentifiers.has(item.identifier ?? '') &&
            !writingActCommands.has(item) &&
            item !== addressCommand &&
            item !== figureUploadCommand &&
            item !== documentationCommand &&
            !referenceActions.includes(item) &&
            !(item.subMenu && structuralMenus.has(item.subMenu)),
        );
        const contentStructureActions = structureActions.filter((item) => !writingActCommands.has(item));
        const contentActions: NonNullable<MenuItemType['subMenu']> = [
          {
            label: t('editor:dialog.paragraphStructure.contextAction'),
            hasSubMenu: true,
            subMenu: contentStructureActions,
            disabled: contentStructureActions.length === 0,
          },
          {
            label: t('editor:dialog.listStructure.contextAction'),
            hasSubMenu: true,
            subMenu: listActions,
            disabled: listActions.length === 0,
          },
          {
            label: t('editor:dialog.tableStructure.contextAction'),
            hasSubMenu: true,
            subMenu: tableActions,
            disabled: tableActions.length === 0,
          },
          {
            label: t('editor:dialog.graphicStructure.contextAction'),
            hasSubMenu: true,
            subMenu: [...graphicActions, ...(figureUploadCommand ? [figureUploadCommand] : [])],
            disabled: graphicActions.length === 0 && !figureUploadCommand,
          },
        ];
        const metadataActions = [
          ...writingActMetadataActions,
          ...(addressCommand && !writingActMetadataActions.includes(addressCommand) ? [addressCommand] : []),
        ];

        setDisplayMenuItems([
          {
            type: 'header',
            label: writingActNumber
              ? t('editor:dialog.paragraphStructure.writingActMenuTitle', {
                  number: writingActNumber,
                })
              : t('editor:dialog.paragraphStructure.writingActMenuTitleWithoutNumber'),
          },
          ...(contextualActions.length > 0
            ? [
                {
                  label: t('editor:dialog.commandGroups.editElement'),
                  hasSubMenu: true,
                  subMenu: contextualActions,
                } satisfies MenuItemType,
              ]
            : []),
          {
            type: 'header',
            label: t('editor:dialog.commandGroups.content'),
          },
          ...contentActions,
          { type: 'divider' },
          {
            label: t('editor:dialog.commandGroups.metadata'),
            hasSubMenu: true,
            subMenu: metadataActions,
            disabled: metadataActions.length === 0,
          },
          {
            label: t('editor:dialog.commandGroups.references'),
            hasSubMenu: true,
            subMenu: referenceActions,
            disabled: referenceActions.length === 0,
          },
          {
            label: t('editor:dialog.commandGroups.organize'),
            hasSubMenu: true,
            subMenu: writingActOrganizationActions,
            disabled: writingActOrganizationActions.length === 0,
          },
          ...(documentationCommand ? [{ type: 'divider' as const }, documentationCommand] : []),
        ]);
      } else {
        setDisplayMenuItems(menuItemsToAdd);
      }
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
      deleteSectionHeading,
      figureUploadInProgress,
      menuItemsMarked,
      menuItemsNoMarking,
      pathHandlers,
      props,
      removeInlineFormat,
      getAddressSectionReference,
      insertAddressLine,
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

  useEffect(() => {
    if (!contentTextIsMarked) {
      setShowSelectionHint(false);
      return;
    }

    let displayCount = 0;
    try {
      displayCount = Number.parseInt(window.sessionStorage.getItem(SELECTION_HINT_SESSION_KEY) ?? '0', 10) || 0;
    } catch {
      displayCount = 0;
    }
    if (displayCount >= SELECTION_HINT_DISPLAY_LIMIT) return;

    setShowSelectionHint(true);
    try {
      window.sessionStorage.setItem(SELECTION_HINT_SESSION_KEY, String(displayCount + 1));
    } catch {
      // The hint remains usable when browser storage is unavailable.
    }

    const timeout = window.setTimeout(() => setShowSelectionHint(false), SELECTION_HINT_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [contentTextIsMarked]);

  return (
    <>
      {contentTextIsMarked && showSelectionHint && (
        <Paper
          role="status"
          aria-live="polite"
          aria-atomic="true"
          elevation={6}
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            zIndex: (theme) => theme.zIndex.snackbar,
            maxWidth: 440,
            border: '1px solid',
            borderColor: 'info.main',
            borderRadius: 1.5,
            px: 2,
            py: 1.25,
            pointerEvents: 'none',
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {t('editor:dialog.selection.hintTitle')}
          </Typography>
          <Typography variant="body2">
            {t('editor:dialog.selection.hintKeyboardPrefix')}{' '}
            <Box
              component="kbd"
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 0.75,
                bgcolor: 'action.hover',
                fontFamily: 'monospace',
                fontWeight: 700,
                px: 0.75,
                py: 0.125,
              }}
            >
              Esc
            </Box>
            {'. '}
            {t('editor:dialog.selection.hintMouse')}
          </Typography>
        </Paper>
      )}
      <Menu
        open={Boolean(props.anchorPosition)}
        onClose={handleCloseAll}
        anchorReference="anchorPosition"
        anchorPosition={props.anchorPosition ? { top: props.anchorPosition.top, left: props.anchorPosition.left } : undefined}
        slotProps={{ paper: { sx: editorCommandMenuPaperSx } }}
      >
        {displayMenuItems.map((item, index) =>
          item.type === 'divider' ? (
            <Divider key={index} />
          ) : item.type === 'header' ? (
            <ListSubheader key={index} disableSticky sx={{ lineHeight: 2.5, fontWeight: 700, pl: 1, pr: 2 }}>
              {item.label}
            </ListSubheader>
          ) : item.type === 'inactive' ? (
            <EditorCommandMenuItem
              key={index}
              label={item.label}
              disabled
              disabledReason={item.disabledReason ?? t('editor:dialog.commandGroups.unavailable')}
            />
          ) : (
            <EditorCommandMenuItem
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
              label={item.label}
              shortcut={item.keyShortcut}
              hasSubMenu={item.hasSubMenu}
              disabled={item.disabled}
              disabledReason={item.disabledReason ?? (item.disabled ? t('editor:dialog.commandGroups.unavailable') : undefined)}
              danger={item.danger}
            />
          ),
        )}
      </Menu>
      {openSubmenuIndex !== null && displayMenuItems[openSubmenuIndex]?.subMenu && (
        <Popper
          anchorEl={submenuAnchorEl}
          open={Boolean(submenuAnchorEl)}
          placement="right-start"
          sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
        >
          <Paper elevation={8} sx={editorCommandMenuPaperSx}>
            <MenuList>
              {displayMenuItems[openSubmenuIndex]!.subMenu!.map((subItem, subIndex) => (
                <EditorCommandMenuItem
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
                  label={subItem.label}
                  shortcut={subItem.keyShortcut}
                  hasSubMenu={subItem.hasSubMenu}
                  disabled={subItem.disabled}
                  disabledReason={subItem.disabledReason ?? (subItem.disabled ? t('editor:dialog.commandGroups.unavailable') : undefined)}
                  danger={subItem.danger}
                />
              ))}
            </MenuList>
          </Paper>
        </Popper>
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
            <Paper elevation={8} sx={editorCommandMenuPaperSx}>
              <MenuList>
                {displayMenuItems[openSubmenuIndex]!.subMenu![openNestedSubmenuIndex]!.subMenu!.map((nestedItem, nestedIndex) => (
                  <EditorCommandMenuItem
                    key={nestedIndex}
                    onClick={() => {
                      nestedItem.action?.(selectedNode ? { node: selectedNode } : {});
                      handleCloseAll();
                    }}
                    label={nestedItem.label}
                    shortcut={nestedItem.keyShortcut}
                    disabled={nestedItem.disabled}
                    disabledReason={
                      nestedItem.disabledReason ?? (nestedItem.disabled ? t('editor:dialog.commandGroups.unavailable') : undefined)
                    }
                    danger={nestedItem.danger}
                  />
                ))}
              </MenuList>
            </Paper>
          </Popper>
        )}
    </>
  );
};

export default RightClickActionMenuOptimized;
