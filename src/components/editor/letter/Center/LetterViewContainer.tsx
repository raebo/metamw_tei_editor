import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchLetterData } from '../../../../services/editor/apiLettersRequest.service';
import XMLDisplayParser from './LetterViewContainer/XmlDisplayParser';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/redux.store';
import { Alert } from '@mui/material';
import { useAppDispatch } from '../../../../redux/hooks';
import { LetterState } from '../../../../constants/editor';
import { fetchPinnedLetterData } from '../../../../services/editor/apiPinnedLettersRequest.service';
import LetterViewCode from './LetterViewCode';
import { setReloadXmlContentLetterThunk } from '../../../../redux/thunks/editor.letter.thunk';
import StateInfo from './StateInfo';
import RightClickActionMenu from './LetterViewContainer/RightClickActionMenu';
import { enqueueSnackbar } from 'notistack';
import { MiscUtils } from '../../../../utils/misc';

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
  });

  const reloadLetterContent = useSelector(
    (state: RootState) => state.editorLetter.reloadLetterContent,
  );
  const isDebugMode = process.env.REACT_DEBUG_MODE === 'true';

  const fetchSingleLetterData = async (letterId: number): Promise<string> => {
    const result = await fetchLetterData(letterId);

    return result?.xmlContent ?? 'ERROR: Empty result';
  };

  const pinnedLetterData = async (letterId: number): Promise<string> => {
    const result = await fetchPinnedLetterData(letterId);
    return result?.xmlContent ?? 'ERROR: Empty result';
  };

  useEffect(() => {
    const loadLetterData = async () => {
      const letterId = stateEditorLetter.id; // capture in a local variable
      if (letterId === null) {
        setLetterState({ viewMode: null, xmlContent: null });
        return;
      }
      const hasPinnedLetters = statePinnedLetters.some(
        (letter) => letter.id === stateEditorLetter.id && letter.isPinned,
      );

      let xmlContent;

      if (hasPinnedLetters) {
        xmlContent = await pinnedLetterData(letterId);
      } else {
        xmlContent = await fetchSingleLetterData(letterId);
      }

      if (xmlContent) {
        setLetterState({
          viewMode: stateEditorLetter.viewMode,
          xmlContent: xmlContent,
        });
      } else {
        setLetterState({
          viewMode: null,
          xmlContent: null,
        });
      }
    };

    try {
      void loadLetterData();
    } catch (error) {
      enqueueSnackbar(
        'Fehler beim Laden des Briefinhalts: ' + MiscUtils.misc.getErrorMessage(error),
        { variant: 'error' },
      );
    }
  }, [stateEditorLetter.id, stateEditorLetter.viewMode, statePinnedLetters]);

  useEffect(() => {
    const reloadNewData = async () => {
      if (stateEditorLetter.id === null) return;

      const xml = await pinnedLetterData(stateEditorLetter.id);

      setLetterState({
        viewMode: stateEditorLetter.viewMode,
        xmlContent: xml,
      });

      dispatch(
        setReloadXmlContentLetterThunk({
          reloadLetterContent: false,
          xmlContent: xml,
        }),
      );
    };

    if (reloadLetterContent && stateEditorLetter?.id !== null) {
      void reloadNewData();
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
