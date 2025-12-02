import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Menu, MenuItem, Divider, Box } from '@mui/material';
import { createContextMenuItems, MenuItemType } from '../../Util/ContextMenuLetterItems';
import { useAppDispatch } from '@src/redux/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { LetterState } from '@src/constants/editor';
import { EditorUtils } from '@src/utils/editor';
import {
  setDialogType,
  setEditorSelectedItem,
  setNodeClicked,
  setReloadLetterContent,
} from '@src/redux/slices/editor.letter.slice';
import { enqueueSnackbar } from 'notistack';
import { MiscUtils } from '@src/utils/misc';
import {
  setEditorMarkedAndContentLeftRightThunk,
  setEditorNodeClickedAndContentLeftRightThunk,
} from '@src/redux/thunks/editor.letter.thunk';
import { getMenuItemsNoMarking } from '@src/constants/menuItems';
import { debounce } from 'lodash-es';
import { rightClickPathHandles } from '@src/utils/editor/rightClickPathHandles';

interface UserActionMenuProps {
  xmlContentRef: React.RefObject<HTMLDivElement>;
  setLetterState: (letterState: LetterState) => void;
  anchorPosition: { top: number; left: number } | null;
  setAnchorPosition: (position: { top: number; left: number } | null) => void;
}

const RightClickActionMenuOptimized = (props: UserActionMenuProps) => {
  const dispatch = useAppDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);
  const xmlContentRef = props.xmlContentRef;

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [displayMenuItems, setDisplayMenuItems] = useState<MenuItemType[]>([]);
  const [submenuAnchorEl, setSubmenuAnchorEl] = useState<null | HTMLElement>(null);
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null);

  const xmlDocRef = useRef<XMLDocument | null>(null);

  /** CACHE MENU ITEMS */
  const menuItemsMarked = useMemo(
    () =>
      createContextMenuItems({
        handleMenuItemClick: (left, right) => {
          props.setAnchorPosition(null);
          dispatch(setEditorSelectedItem({ selectedItem: { left, right } }));
        },
        handleMenuItemDialogClick: (dialogType: string) => {
          props.setAnchorPosition(null);
          dispatch(setDialogType({ dialogType }));
        },
      }),
    [dispatch, props],
  );

  const menuItemsNoMarking: MenuItemType[] = useMemo(
    () => getMenuItemsNoMarking(dispatch, stateEditorLetter, xmlDocRef),
    [dispatch, stateEditorLetter],
  );

  const pathHandlers = useMemo(
    () => rightClickPathHandles.pathHandlerFactory(menuItemsNoMarking),
    [menuItemsNoMarking],
  );

  /** LOAD XML DOC ON LETTER CHANGE */
  useEffect(() => {
    if (!stateEditorLetter.xmlContent) {
      dispatch(setReloadLetterContent({ reloadLetterContent: true }));
      return;
    }
    try {
      xmlDocRef.current = EditorUtils.xmlCheck.extractTeiDocumentFromString(
        stateEditorLetter.xmlContent,
      );
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
              EditorUtils.textMarking.removeMarkedSpans(xmlContentRef.current!);
              EditorUtils.textMarking.markValidSelection(sel, sel.getRangeAt(0));

              const xmlDoc = EditorUtils.xmlCheck.extractDocumentByRef(xmlContentRef);

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
    [dispatch, menuItemsMarked, props],
  );

  const handleNoMarkupRightClick = useCallback(
    (event: MouseEvent) => {
      if (event.button !== 2) return;
      event.preventDefault();

      setDisplayMenuItems([]);
      const targetNode = event.target as Node;
      const menuItemsToAdd: MenuItemType[] = [];
      let isClickable = false;

      for (const handler of pathHandlers) {
        EditorUtils.xmlCheck.isNodeMatchingPath(
          targetNode,
          handler.paths,
          (node) => {
            setSelectedNode(node);
            const items = handler.getMenuItems(node);
            if (items.length > 0) {
              menuItemsToAdd.push(...items);
              isClickable = true;
            }
          },
          () => {},
        );
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
    [dispatch, pathHandlers, props],
  );

  /** CLOSE MENU */
  const handleCloseAll = () => {
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
        anchorPosition={
          props.anchorPosition
            ? { top: props.anchorPosition.top, left: props.anchorPosition.left }
            : undefined
        }
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
        >
          {displayMenuItems[openSubmenuIndex]!.subMenu!.map((subItem, subIndex) => (
            <MenuItem
              key={subIndex}
              onClick={() => {
                subItem.action?.(selectedNode ? { node: selectedNode } : {});
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
                <span>{subItem.label}</span>
                {subItem.keyShortcut && (
                  <span style={SndMenuItemStylesSpan}>{subItem.keyShortcut}</span>
                )}
              </Box>
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
};

export default RightClickActionMenuOptimized;
