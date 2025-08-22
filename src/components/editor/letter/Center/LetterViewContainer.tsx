import React, {useEffect, useMemo, useRef, useState} from "react";
import { fetchLetterData } from "../../../../services/editor/apiLettersRequest.service";
import XMLDisplayParser from "./LetterViewContainer/XmlDisplayParser";
import { useSelector } from "react-redux";
import { RootState } from "../../../../redux/redux.store";
import { Alert } from "@mui/material";
import { useAppDispatch } from "../../../../redux/hooks";
import {
  setReloadLetterContent
} from "../../../../redux/slices/editor.letter.slice";
import { LetterState } from "../../../../constants/editor";
import { fetchPinnedLetterData } from "../../../../services/editor/apiPinnedLettersRequest.service";
import LetterViewCode from './LetterViewCode';
import RightClickActionMenu from "./LetterViewContainer/RightClickActionMenu";

const LetterViewContainer = () => {
  const dispatch = useAppDispatch();
  const stateLetterFontSize = useSelector((state: RootState) => state.auth.settings?.letterFontSize)
  const containerRef = React.useRef<HTMLDivElement>(null);
  const xmlContentRef = useRef<HTMLDivElement | null>(null);
	const [anchorPosition, setAnchorPosition] = useState<null | { top: number; left: number }>(null);

  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters)

  const [letterState, setLetterState] = useState<LetterState>({
    viewMode: null,
    xmlContent: null,
  });

  const reloadLetterContent = useSelector((state: RootState) => state.editorLetter.reloadLetterContent);

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

	// 👇 memoize XMLDisplayParser so it only re-renders if xmlContent changes
	const parserXmlMemo = useMemo(() => {
		if (letterState && letterState.xmlContent !== null) {
			return (
				<XMLDisplayParser
					xmlContentRef={xmlContentRef}
					xmlString={letterState.xmlContent}
					onRightClickMarked={(pos) => setAnchorPosition(pos)}
				/>
			);
		} else {
			return <></>
		}
	}, [letterState.xmlContent]);



  return (
    <div className="letter-view-container">
      <div className="container-fmbc-letter">
        <div className="box-1">
          { letterState.xmlContent ? (
            <>
              { letterState.viewMode === "WYSIWYG" && (
                <div
                  className="letter-xml"
                  id="letterXml"
                  ref={containerRef}
                  style={{ fontSize: `${stateLetterFontSize}%` }}
                >
                  <div ref={xmlContentRef} id="letterXmlContent" style={{ padding: 20 }}>
                    { letterState.xmlContent &&
											parserXmlMemo
										}
                  </div>
									<RightClickActionMenu
										xmlContentRef={xmlContentRef}
										setLetterState={ (letterState: LetterState) => {
											setLetterState( letterState );
										}}
										anchorPosition={anchorPosition}
										setAnchorPosition={(pos) => setAnchorPosition(pos)}
									/>
                </div>
              ) }
              { letterState.viewMode === "CODE" && letterState.xmlContent && (
                <LetterViewCode xmlString={letterState.xmlContent} />
              ) }

            </>
          ) : (
            <p>
              <Alert severity="warning">
                Kein Brief zur Anzeige vorhanden, bitte wählen Sie einen Brief über die Suche aus.
              </Alert>
            </p>
          ) }
        </div>
      </div>
    </div>
  );
}

export default LetterViewContainer;
