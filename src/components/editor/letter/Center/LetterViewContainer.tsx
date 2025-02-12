import React, { useEffect, useState } from "react";
import { fetchLetterData } from "../../../../services/editor/apiLettersRequest.service";
import XMLDisplayParser from "../../../support/XmlDisplayParser";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/redux.store";
import { Menu, MenuItem } from "@mui/material";
import { EditorUtils } from "../../../../utils/editor";
import { enqueueSnackbar } from "notistack";
import { useAppDispatch } from "../../../../redux/hooks";
import { setEditorSelectedItem } from "../../../../redux/slices/editor.letter.slice";
import { EditorConstants } from "../../../../constants/editor";
import { setEditorMarkedAndContentLeftRightThunk } from "../../../../redux/thunks/editor.letter.thunk";

const LetterViewContainer = () => {

  const dispatch = useAppDispatch();
  const contentTextIsMarked = useSelector((state: RootState) => state.editorLetter.content.textIsMarked);
  const [letterXmlContent, setLetterXmlContent] = useState<string>("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)
  const [anchorPosition, setAnchorPosition] = useState<null | { top: number; left: number }>(null);

  useEffect(() => {
    const returnLetterData = (letterId: number) => {
      fetchLetterData(letterId)
        .then((result) => {
          if (result) {
            setLetterXmlContent(result.xmlContent);
          } else {
            setLetterXmlContent("ERROR: Letter content not found");
          }
        })
        .catch(() => {
          setLetterXmlContent("ERROR: Failed to fetch letter content");
        });
    }

    if (stateEditorLetter.id) {
      returnLetterData(stateEditorLetter.id)
    }

  }, [stateEditorLetter]);


  useEffect(() => {
    const contextMenuHandling = () => {
      const contextMenuElement = document.getElementById("letterXmlContextMenu"); // Use getElementById for more type safety

      if (contextMenuElement) {
        const handleContextMenu = (event: MouseEvent) => { // Type the event as MouseEvent
          event.preventDefault(); // Prevent default context menu

          const markedElement = EditorUtils.textMarking.markedSpanEntry();
          if (markedElement) {
            setAnchorPosition({top: event.clientY, left: event.clientX});
          }
        };

        contextMenuElement.addEventListener("contextmenu", handleContextMenu);

        // Cleanup listener when component unmounts or selection changes (important!)
        return () => {
          contextMenuElement.removeEventListener("contextmenu", handleContextMenu);
        };
      }
    }
    contextMenuHandling()
  }, [contentTextIsMarked]);

  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {

      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        const selectedText = selection.toString();

        EditorUtils.textMarking.isValidSelection(
          selection,
          document.getElementById("letterXmlContextMenu") as HTMLElement,
          (selection: Selection, range: Range) => {
              EditorUtils.textMarking.removeMarkedSpans()
              EditorUtils.textMarking.markValidSelection(selection, selection.getRangeAt(0));

              setLetterXmlContent(document.getElementById("letterXmlContextMenu")?.innerHTML ?? "");
              dispatch(setEditorMarkedAndContentLeftRightThunk({
                  textIsMarked: true,
                  contentLeft: null,
                  contentRight: null
                } ))
          },
          (selection: Selection | null, message: string) => {

            EditorUtils.textMarking.removeMarkedSpans()
            setLetterXmlContent(document.getElementById("letterXmlContextMenu")?.innerHTML ?? "");

            dispatch(setEditorMarkedAndContentLeftRightThunk({
              textIsMarked: true,
              contentLeft: null,
              contentRight: null
            }))
            enqueueSnackbar(message, { variant: "error" });
          }
        )
      } else {
        setAnchorPosition(null); // Close context menu if no selection
      }
    };

    if (containerRef.current && letterXmlContent) { // Check if ref is set and content exists
      containerRef.current.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mouseup', handleMouseUp);
      }
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterXmlContent]); // Crucial: Add letterXmlContent to dependency array

  const handleMenuItemClick = (selectedItemLeft: string | null, selectedItemRight: string | null) => {
    setAnchorPosition(null)
    dispatch(setEditorSelectedItem({ selectedItem: { left: selectedItemLeft, right: selectedItemRight } }))
  }

  return (
    <div className="letter-view-container">
      <div className="container-fmbc-letter">
        <div className="box-1">
          {letterXmlContent ? (
            <div className="letter-xml" id="letterXml" ref={containerRef}>
              <div id="letterXmlContextMenu" style={{ padding: 20 }}>

                {letterXmlContent && <XMLDisplayParser xmlString={letterXmlContent} />} {/* Conditionally render */}
                <Menu
                  open={Boolean(anchorPosition)}
                  onClose={() => setAnchorPosition(null)}
                  anchorReference="anchorPosition"
                  anchorPosition={anchorPosition ? { top: anchorPosition.top, left: anchorPosition.left } : undefined}
                >
                  <MenuItem onClick={() => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_PERSON) }>Person Hinzufügen</MenuItem>
                </Menu>
              </div>
            </div>
          ) : (
            <p>
              No data available
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LetterViewContainer;
