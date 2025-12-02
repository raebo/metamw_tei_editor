import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchLetterData } from '@src/services/editor/apiLettersRequest.service';
import XMLDisplayParser from './LetterViewContainer/XmlDisplayParser';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { Alert } from '@mui/material';
import { useAppDispatch } from '@src/redux/hooks';
import { LetterState } from '@src/constants/editor';
import { fetchPinnedLetterData } from '@src/services/editor/apiPinnedLettersRequest.service';
import LetterViewCode from './LetterViewCode';
import { setReloadXmlContentLetterThunk } from '@src/redux/thunks/editor.letter.thunk';
import StateInfo from './StateInfo';
import RightClickActionMenu from './LetterViewContainer/RightClickActionMenu';
import { enqueueSnackbar } from 'notistack';
import { MiscUtils } from '@src/utils/misc';
import type { EditorLetterData } from '@src/services/mappings/editorMappings';
import LeftClickAnnotationAction from '@src/components/editor/letter/Center/LetterViewContainer/LeftClickAnnotationAction';

const LetterViewContainer = () => {
  const dispatch = useAppDispatch();
  const stateLetterFontSize = useSelector(
    (state: RootState) => state.auth.settings?.letterFontSize,
  );
  const containerRef = React.useRef<HTMLDivElement>(null);
  const xmlContentRef = useRef<HTMLDivElement | null>(null);
  const [anchorPosition, setAnchorPosition] = useState<null | { top: number; left: number }>(null);

  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters);

  const [letterState, setLetterState] = useState<LetterState>({
    viewMode: null,
    xmlContent: null,
    undoAvailable: false,
    redoAvailable: false,
  });

  const reloadLetterContent = useSelector(
    (state: RootState) => state.editorLetter.reloadLetterContent,
  );
  const isDebugMode = process.env.REACT_DEBUG_MODE === 'true';

  useEffect(() => {
    const loadLetterData = async () => {
      const letterId = stateEditorLetter.id;
      if (letterId === null) {
        setLetterState({
          viewMode: null,
          xmlContent: null,
          undoAvailable: false,
          redoAvailable: false,
        });
        return;
      }
      const hasPinnedLetters = statePinnedLetters.some(
        (letter) => letter.id === stateEditorLetter.id && letter.isPinned == true,
      );

      let letterData: EditorLetterData | null;

      //TODO optimize: if letter is pinned, fetch from pinned endpoint, else from normal endpoint
      if (hasPinnedLetters) {
        letterData = await fetchPinnedLetterData(letterId);
      } else {
        letterData = await fetchLetterData(letterId);
      }

      setLetterState({
        viewMode: stateEditorLetter.viewMode,
        xmlContent: letterData.xmlContent,
        undoAvailable: letterData.undoAvailable,
        redoAvailable: letterData.redoAvailable,
      });
    };

    loadLetterData().catch((error) => {
      enqueueSnackbar(
        'Fehler beim Laden des Briefinhalts: ' + MiscUtils.misc.getErrorMessage(error),
        { variant: 'error' },
      );
    });
  }, [stateEditorLetter.id, stateEditorLetter.viewMode, statePinnedLetters]);

  useEffect(() => {
    const reloadNewData = async () => {
      let letterData: EditorLetterData | null = null;
      if (stateEditorLetter.id === null) return;

      const hasPinnedLetters = statePinnedLetters.some(
        (letter) => letter.id === stateEditorLetter.id && letter.isPinned == true,
      );

      if (hasPinnedLetters) {
        letterData = await fetchPinnedLetterData(stateEditorLetter.id);
      } else {
        letterData = await fetchLetterData(stateEditorLetter.id);
      }

      setLetterState({
        viewMode: stateEditorLetter.viewMode,
        xmlContent: letterData.xmlContent,
        undoAvailable: letterData.undoAvailable,
        redoAvailable: letterData.redoAvailable,
      });

      dispatch(
        setReloadXmlContentLetterThunk({
          reloadLetterContent: false,
          xmlContent: letterData.xmlContent,
          undoAvailable: letterData.undoAvailable,
          redoAvailable: letterData.redoAvailable,
        }),
      );
    };

    if (reloadLetterContent && stateEditorLetter?.id !== null) {
      void reloadNewData().catch((error) => {
        enqueueSnackbar(
          'Fehler beim Neuladen des Briefinhalts: ' + MiscUtils.misc.getErrorMessage(error),
          { variant: 'error' },
        );
      });
    }
  }, [dispatch, reloadLetterContent, stateEditorLetter]);

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
      return <></>;
    }
  }, [letterState]);

  return (
    <div className="letter-view-container">
      <div className="container-fmbc-letter">
        <div className="box-1">
          {letterState.xmlContent ? (
            <>
              {letterState.viewMode === 'WYSIWYG' && (
                <div
                  className="letter-xml"
                  id="letterXml"
                  ref={containerRef}
                  style={{ fontSize: `${stateLetterFontSize}%` }}
                >
                  <div ref={xmlContentRef} id="letterXmlContent" style={{ padding: 20 }}>
                    {letterState.xmlContent && parserXmlMemo}
                  </div>
                  <RightClickActionMenu
                    xmlContentRef={xmlContentRef}
                    setLetterState={(letterState: LetterState) => {
                      setLetterState(letterState);
                    }}
                    anchorPosition={anchorPosition}
                    setAnchorPosition={(pos) => setAnchorPosition(pos)}
                  />
                  <LeftClickAnnotationAction
                    xmlContentRef={xmlContentRef}
                    setLetterState={(letterState: LetterState) => {
                      setLetterState(letterState);
                    }}
                  />
                </div>
              )}
              {letterState.viewMode === 'CODE' && letterState.xmlContent && (
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
      {isDebugMode ? <StateInfo /> : <></>}
    </div>
  );
};

export default LetterViewContainer;
