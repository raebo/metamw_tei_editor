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
  const [letterXmlContent, setLetterXmlContent] = useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const xmlContentRef = useRef<HTMLDivElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters)
  const reloadLetterContent = useSelector((state: RootState) => state.editorLetter.reloadLetterContent);
  const [anchorPosition, setAnchorPosition] = useState<null | { top: number; left: number }>(null);

  const [displayMenuItems, setDisplayMenuItems] = useState<MenuItemType[]>([]);
  const menuItems : MenuItemType[] = [
    { label: 'Person Hinzufügen', action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_PERSON) },
    { label: 'Ort Hinzufügen', action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_PLACE) },
    { label: 'Werk Hinzufügen', action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_CREATION) },
    { label: 'FMBC Werk Hinzufügen', action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_FMBC_CREATION) },
    { label: 'Brief Hinzufügen', action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_LETTER) },
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

  const returnLetterData = (letterId: number) => {
    fetchLetterData(letterId)
      .then((result) => {
        if (result) {
          setLetterXmlContent(result.xmlContent);
        }
      })
      .catch(() => {
        setLetterXmlContent("ERROR: Failed to fetch letter content");
      });
  }
  const returnPinnedLetterData = (letterId: number) => {
    fetchPinnedLetterData(letterId)
      .then((result) => {
        if (result) {
          setLetterXmlContent(result.xmlContent);
        }
      })
      .catch(() => {
        setLetterXmlContent("ERROR: Failed to fetch letter content");
      });
  }
  
  useEffect(() => {
    if (stateEditorLetter.id && statePinnedLetters.some((letter) => (letter.id === stateEditorLetter.id && letter.isPinned))) {
      returnPinnedLetterData(stateEditorLetter.id)
    } else if (stateEditorLetter.id !== null) {
      returnLetterData(stateEditorLetter.id)
    } else if (stateEditorLetter.id === null) {
      setLetterXmlContent(null)
    }
  }, [stateEditorLetter]);

  useEffect(() => {
    if (reloadLetterContent && stateEditorLetter?.id !== null) {
      returnPinnedLetterData(stateEditorLetter.id);
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
        EditorUtils.textMarking.removeMarkedSpans();
        setSelectedNode(node)
        setDisplayMenuItems(menuItemsNoMarking);

        setLetterXmlContent(xmlContentRef.current?.innerHTML ?? "");

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
          EditorUtils.textMarking.removeMarkedSpans();
          EditorUtils.textMarking.markValidSelection(selection, selection.getRangeAt(0));

          dispatch(setEditorMarkedAndContentLeftRightThunk({
            textIsMarked: true,
            contentLeft: null,
            contentRight: null
          }));

          setDisplayMenuItems(menuItems);
          setLetterXmlContent(xmlContentRef.current?.innerHTML ?? "");
        },
        (message: string) => {
          EditorUtils.textMarking.removeMarkedSpans();
          setLetterXmlContent(xmlContentRef.current?.innerHTML ?? "");

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
    if (xmlContentRef.current && letterXmlContent) {
      xmlContentRef.current.addEventListener("mouseup", handleMouseUpMarkedElements);
      xmlContentRef.current.addEventListener("mousedown", handleNoMarkupRightClick);
    }

    return () => {
      if (xmlContentRef.current && letterXmlContent) {
        xmlContentRef.current.removeEventListener("mouseup", handleMouseUpMarkedElements);
        xmlContentRef.current.removeEventListener("mouseup", handleNoMarkupRightClick);
      }
    };

 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [letterXmlContent]);


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
          {letterXmlContent ? (
            <>
              <div
                className="letter-xml"
                id="letterXml"
                ref={containerRef}
                style={{ fontSize: `${stateLetterFontSize}%` }}
              >
                <div ref={xmlContentRef} id="letterXmlContent" style={{ padding: 20 }}>
                  {letterXmlContent && <XMLDisplayParser xmlString={letterXmlContent} />}
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
