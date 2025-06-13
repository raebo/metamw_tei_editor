import React, {useEffect, useRef, useState} from "react";
import { fetchLetterData } from "../../../../services/editor/apiLettersRequest.service";
import XMLDisplayParser from "../../../support/XmlDisplayParser";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/redux.store";
import { Alert, Divider, Menu, MenuItem, Typography } from "@mui/material";
import { EditorUtils } from "../../../../utils/editor";
import { enqueueSnackbar } from "notistack";
import { useAppDispatch } from "../../../../redux/hooks";
import {
  setDialogType,
  setEditorSelectedItem,
  setReloadLetterContent
} from "../../../../redux/slices/editor.letter.slice";
import { EditorConstants } from "../../../../constants/editor";
import {
  setEditorMarkedAndContentLeftRightThunk,
  setEditorNodeClickedAndContentLeftRightThunk
} from "../../../../redux/thunks/editor.letter.thunk";
import { fetchPinnedLetterData } from "../../../../services/editor/apiPinnedLettersRequest.service";
import { MiscUtils } from "../../../../utils/misc";
import LetterViewCode from './LetterViewCode';
import { removeMarkedSpans } from '../../../../utils/auto_anno/domHandling';

type NodeActionCallback = (args: {
  node?: Node;
}) => void;

type MenuItemType = {
  label?: string
  action?: NodeActionCallback
  type?: 'divider' | null
}

const LetterViewContainer = () => {

  const dispatch = useAppDispatch();
  const contentTextIsMarked = useSelector((state: RootState) => state.editorLetter.content.textIsMarked);
  const nodeClicked = useSelector((state: RootState) => state.editorLetter.content.nodeClicked);
  const stateLetterFontSize = useSelector((state: RootState) => state.auth.settings?.letterFontSize)
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const xmlContentRef = useRef<HTMLDivElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters)

  const [letterState, setLetterState] = useState<{ viewMode: "CODE" | "WYSIWYG" | null; xmlContent: string | null }>({
    viewMode: null,
    xmlContent: null,
  });

  const reloadLetterContent = useSelector((state: RootState) => state.editorLetter.reloadLetterContent);
  const [anchorPosition, setAnchorPosition] = useState<null | { top: number; left: number }>(null);

  const [displayMenuItems, setDisplayMenuItems] = useState<MenuItemType[]>([]);
  const menuItems : MenuItemType[] = [
    { label: 'Person Hinzufügen', action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_PERSON) },
    { label: 'Ort Hinzufügen', action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_PLACE) },
    { label: 'Werk Hinzufügen', action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_CREATION) },
    { label: 'FMBC Werk Hinzufügen', action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_FMBC_CREATION) },
    { label: 'Verweis FMB-Brief Hinzufügen', action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.ADD_LETTER_FROM_PROTAG) },
    { label: 'Verweis GB-Brief Hinzufügen', action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.ADD_LETTER_TO_PROTAG) },
    { type: 'divider' },
    { label: 'Kommentar Hinzufügen', action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.ADD_NOTE) },
  ];

  const menuItemsNoMarking : MenuItemType[] = [
    { label: 'Eintrag Entfernen', action: ({ node }: { node?: Node }) => {
        try {
          if (!node) throw new Error("No node given as value")

          const anchNode = EditorUtils.removeNodeHandles.findAnchestorPathNode(node)

          if (!anchNode) throw new Error("No anchNode found with given path")

          const xmlContent =
            EditorUtils.removeNodeHandles.removeNode(
              node,
              anchNode.afterDeleteCallback
            )

          if (!xmlContent) throw new Error("No xml content found");

          EditorUtils.backendService.patchContent(
            xmlContent, stateEditorLetter.id, EditorConstants.changeTypes.NODE_REMOVED, null
          ).then(
            (result) => {
              if (result) {
                dispatch(setReloadLetterContent({ reloadLetterContent: true }))
                enqueueSnackbar(`${anchNode.nodeType.name} wurde entfernt`, { variant: "success" })
              } else {
                enqueueSnackbar("Data could not be updated on backend side", { variant: "error" })
              }
            }
          )
        } catch(error) {
          enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: "error" });
        }
      } },
  ]

  const fetchSingleLetterData = async (letterId: number) : Promise<string> => {
    try {
      const result = await fetchLetterData(letterId)
      return result?.xmlContent ?? "ERROR: Empty result"

    } catch (e) {
      return "ERROR: Failed to fetch letter content"
    }
  }

  const pinnedLetterData = async (letterId: number): Promise<string> => {
    try {
      const result = await fetchPinnedLetterData(letterId);
      return result?.xmlContent ?? "ERROR: Empty result";
    } catch (e) {
      return "ERROR: Failed to fetch letter content";
    }
  };

  useEffect(() => {
    if (stateEditorLetter.id && statePinnedLetters.some((letter) => (letter.id === stateEditorLetter.id && letter.isPinned))) {
      pinnedLetterData(stateEditorLetter.id).then(xmlContent => {
        setLetterState({
          viewMode: stateEditorLetter.viewMode,
          xmlContent: xmlContent
        })
      })
    } else if (stateEditorLetter.id !== null) {
      fetchSingleLetterData(stateEditorLetter.id).then(xmlContent => {
        setLetterState({
          viewMode: stateEditorLetter.viewMode,
          xmlContent: xmlContent
        })
      })
    } else {
      setLetterState(
        {
          viewMode: null,
          xmlContent: null
        }
      )
    }
  }, [stateEditorLetter]);

  useEffect(() => {
    if (reloadLetterContent && stateEditorLetter?.id !== null) {
      pinnedLetterData(stateEditorLetter.id).then(xml => {
        setLetterState({
          viewMode: stateEditorLetter.viewMode,
          xmlContent: xml
        })
      })
      dispatch(setReloadLetterContent({ reloadLetterContent: false }))
    }
  }, [reloadLetterContent]);

  useEffect(() => {
    const contextMenuElement = xmlContentRef.current // xmlRef of letter container

    if (!contextMenuElement) return;

    const handleContextMenuTextIsMarked = (event: MouseEvent) => {
      const target = event?.target as HTMLElement;
      if (target && target.tagName.toLowerCase() === 'span' && target.classList.contains('marked')) {
        event.preventDefault(); // Prevent default context menu
        setAnchorPosition({ top: event.clientY, left: event.clientX });
      }
    }

    const handleContextMenuNodeClicked = (event: MouseEvent) => {
      event.preventDefault(); // Prevent default context menu
      setAnchorPosition({ top: event.clientY, left: event.clientX });
    }

    if (contentTextIsMarked) {
      contextMenuElement.addEventListener("contextmenu", handleContextMenuTextIsMarked);
    } else if (nodeClicked) {
      contextMenuElement.addEventListener("contextmenu", handleContextMenuNodeClicked);
    } else {
      if (xmlContentRef.current !== null) {
        removeMarkedSpans(xmlContentRef.current);
        setLetterState({
          viewMode: "WYSIWYG",
          xmlContent: xmlContentRef.current?.innerHTML ?? ""
        })
      }
      contextMenuElement.removeEventListener("contextmenu", handleContextMenuTextIsMarked);
      contextMenuElement.removeEventListener("contextmenu", handleContextMenuNodeClicked);
    }

    return () => {
      contextMenuElement.removeEventListener("contextmenu", handleContextMenuTextIsMarked);
      contextMenuElement.removeEventListener("contextmenu", handleContextMenuNodeClicked);
    }
  }, [contentTextIsMarked, nodeClicked]);


  const handleNoMarkupRightClick = (event: MouseEvent) => {
    if (event.button !== 2) return; // Only right-click

    EditorUtils.xmlCheck.isADeletableNode(
      event.target as Node,
      (node: Node) => {
        EditorUtils.textMarking.removeMarkedSpans(xmlContentRef.current);
        setSelectedNode(node)
        setDisplayMenuItems(menuItemsNoMarking);
        setLetterState({
          viewMode: "WYSIWYG",
          xmlContent: xmlContentRef.current?.innerHTML ?? ""
        })

        dispatch(setEditorNodeClickedAndContentLeftRightThunk({
          nodeClicked: true,
          textIsMarked: false,
          contentLeft: null,
          contentRight: null
        }));
      },
      (message: string) => {
        // enqueueSnackbar(message, { variant: "error" });
      }
    );
  };

  const handleMouseUpMarkedElements = (event: MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      EditorUtils.textMarking.isValidSelection(
        selection,
        xmlContentRef.current as HTMLElement,
        (selection: Selection) => {
          EditorUtils.textMarking.removeMarkedSpans(xmlContentRef.current);
          EditorUtils.textMarking.markValidSelection(selection, selection.getRangeAt(0));

          dispatch(setEditorMarkedAndContentLeftRightThunk({
            textIsMarked: true,
            contentLeft: null,
            contentRight: null
          }));

          setDisplayMenuItems(menuItems);
          setLetterState( {
            viewMode: "WYSIWYG",
            xmlContent: xmlContentRef.current?.innerHTML ?? ""
          }
          )
        },
        (message: string) => {
          EditorUtils.textMarking.removeMarkedSpans(xmlContentRef.current);
          setLetterState({
            viewMode: "WYSIWYG",
            xmlContent: xmlContentRef.current?.innerHTML ?? ""
          })

          dispatch(setEditorMarkedAndContentLeftRightThunk({
            textIsMarked: false,
            contentLeft: null,
            contentRight: null
          }));

          enqueueSnackbar(message, { variant: "error" });
        }
      );
    }
  };

  useEffect(() => {
    if (xmlContentRef.current && letterState.xmlContent && letterState.viewMode === 'WYSIWYG') {
      xmlContentRef.current.addEventListener("mouseup", handleMouseUpMarkedElements);
      xmlContentRef.current.addEventListener("mousedown", handleNoMarkupRightClick);
    }

    return () => {
      if (xmlContentRef.current && letterState.xmlContent && letterState.viewMode === 'WYSIWYG') {
        xmlContentRef.current.removeEventListener("mouseup", handleMouseUpMarkedElements);
        xmlContentRef.current.removeEventListener("mouseup", handleNoMarkupRightClick);
      }
    };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [letterState]);


  const handleMenuItemClick = (selectedItemLeft: string | null, selectedItemRight: string | null) => {
    setAnchorPosition(null)
    dispatch(setEditorSelectedItem({ selectedItem: { left: selectedItemLeft, right: selectedItemRight } }))
  }

  const handleMenuItemDialogClick = (dialogType: string ) => {
    setAnchorPosition(null)
    dispatch(setDialogType({ dialogType: dialogType } ));
  }

  return (
    <div className="letter-view-container">
      <div className="container-fmbc-letter">
        <div className="box-1">
          {letterState.xmlContent ? (
            <>
              { letterState.viewMode === "WYSIWYG" && (
                <div
                  className="letter-xml"
                  id="letterXml"
                  ref={containerRef}
                  style={{ fontSize: `${stateLetterFontSize}%` }}
                >
                  <div ref={xmlContentRef} id="letterXmlContent" style={{ padding: 20 }}>
                    { letterState.xmlContent && <XMLDisplayParser xmlString={letterState.xmlContent} /> }
                  </div>

                  <div ref={contextMenuRef} id="letterXmlContextMenu" style={{ padding: 20 }}>
                    <Menu
                      open={Boolean(anchorPosition)}
                      onClose={() => setAnchorPosition(null)}
                      anchorReference="anchorPosition"
                      anchorPosition={
                        anchorPosition
                          ? { top: anchorPosition.top, left: anchorPosition.left }
                          : undefined
                      }
                    >
                      {displayMenuItems.map((item, index) =>
                        item.type === 'divider' ? (
                          <Divider key={index} />
                        ) : (
                          <MenuItem key={index} onClick={() => {
                            if (selectedNode) {
                              item.action?.({ node: selectedNode });
                              setSelectedNode(null)
                              setAnchorPosition(null)
                            }  else {
                              item.action?.({})
                            }
                            }
                          }>
                            <Typography variant="body2">{item.label}</Typography>
                          </MenuItem>
                        )
                      )}
                    </Menu>
                  </div>
                </div>
              ) }
              { letterState.viewMode === "CODE" && letterState.xmlContent && (
                <LetterViewCode xmlString={letterState.xmlContent} />
              )}

            </>
          ) : (
            <p>
              <Alert severity="warning">
                Kein Brief zur Anzeige vorhanden, bitte wählen Sie einen Brief über die Suche aus.
              </Alert>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LetterViewContainer;
