import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchLetterData } from '@src/services/editor/apiLettersRequest.service';
import XMLDisplayParser from './LetterViewContainer/XmlDisplayParser';
import { useSelector, useStore } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { Alert } from '@mui/material';
import { useAppDispatch } from '@src/redux/hooks';
import { EditorConstants, LetterState } from '@src/constants/editor';
import { fetchPinnedLetterData } from '@src/services/editor/apiPinnedLettersRequest.service';
import LetterViewCode from './LetterViewCode';
import { setReloadXmlContentLetterThunk } from '@src/redux/thunks/editor.letter.thunk';
import StateInfo from './StateInfo';
import RightClickActionMenu from './LetterViewContainer/RightClickActionMenu';
import { enqueueSnackbar } from 'notistack';
import { MiscUtils } from '@src/utils/misc';
import type { EditorLetterData } from '@src/services/mappings/editorMappings';
import LeftClickAnnotationAction from '@src/components/editor/letter/Center/LetterViewContainer/LeftClickAnnotationAction';
import { useTranslation } from 'react-i18next';
import { runXmlAction } from './lib/keyHandlerDefinitions';
import { updatePlainParagraphText } from '@src/utils/editor/paragraphStructure';
import { setEditorLetter, setEditorPinnedLetterLifecycle } from '@src/redux/slices/editor.letter.slice';

const LetterViewContainer = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const reduxStore = useStore();
  const stateLetterFontSize = useSelector((state: RootState) => state.auth.settings?.letterFontSize);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const xmlContentRef = useRef<HTMLDivElement | null>(null);
  const pendingParagraphEdits = useRef(new Map<string, string>());
  const [anchorPosition, setAnchorPosition] = useState<null | { top: number; left: number }>(null);

  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);
  const focusedFigureXmlId = useSelector((state: RootState) => state.editorLetter.focusedFigureXmlId);
  const statePinnedLetters = useSelector((state: RootState) => state.editorLetter.pinnedLetters);

  const [letterState, setLetterState] = useState<LetterState>({
    viewMode: null,
    xmlContent: null,
    undoAvailable: false,
    redoAvailable: false,
  });

  const reloadLetterContent = useSelector((state: RootState) => state.editorLetter.reloadLetterContent);
  const activeLetterIsPinned = statePinnedLetters.some((letter) => letter.id === stateEditorLetter.id && letter.isPinned === true);
  const isDebugMode = process.env.REACT_DEBUG_MODE === 'true';

  const editableParagraphForTarget = useCallback((target: EventTarget | null): HTMLElement | null => {
    const targetElement = target instanceof Element ? target : null;
    const paragraph = targetElement?.closest<HTMLElement>('p[data-editor-plain-paragraph="true"]') ?? null;
    return paragraph && xmlContentRef.current?.contains(paragraph) ? paragraph : null;
  }, []);

  const preventDirectEdit = (event: React.SyntheticEvent) => {
    const paragraph = editableParagraphForTarget(event.target);
    const inputType = 'inputType' in event.nativeEvent ? String(event.nativeEvent.inputType) : '';
    if (paragraph && inputType !== 'insertParagraph' && inputType !== 'insertLineBreak') return;
    event.preventDefault();
  };
  const preventMutationKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (editableParagraphForTarget(event.target)) {
      if (event.key === 'Enter') event.preventDefault();
      return;
    }
    const mutatesContent =
      event.key === 'Backspace' ||
      event.key === 'Delete' ||
      event.key === 'Enter' ||
      (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey);
    if (mutatesContent) event.preventDefault();
  };

  const rememberParagraphEdit = useCallback((paragraph: HTMLElement) => {
    const sourcePath = paragraph.dataset.editorXmlPath;
    if (sourcePath === undefined) return;
    pendingParagraphEdits.current.set(sourcePath, paragraph.textContent ?? '');
  }, []);

  const handleParagraphInput = (event: React.FormEvent<HTMLDivElement>) => {
    const paragraph = editableParagraphForTarget(event.target);
    if (paragraph) rememberParagraphEdit(paragraph);
  };

  const handleParagraphPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const paragraph = editableParagraphForTarget(event.target);
    if (!paragraph) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount !== 1) return;
    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    if (commonAncestor !== paragraph && !paragraph.contains(commonAncestor)) return;

    range.deleteContents();
    const insertedText = document.createTextNode(event.clipboardData.getData('text/plain').replace(/\r\n?/g, '\n'));
    range.insertNode(insertedText);
    range.setStartAfter(insertedText);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    paragraph.normalize();
    rememberParagraphEdit(paragraph);
  };

  const saveParagraphEdit = useCallback(
    async (paragraph: HTMLElement) => {
      const sourcePath = paragraph.dataset.editorXmlPath;
      if (sourcePath === undefined) return;
      const text = pendingParagraphEdits.current.get(sourcePath);
      if (text === undefined) return;
      pendingParagraphEdits.current.delete(sourcePath);

      const result = await runXmlAction(
        dispatch,
        () => reduxStore.getState() as RootState,
        (xmlDoc) => {
          updatePlainParagraphText(xmlDoc, sourcePath, text);
        },
        EditorConstants.changeTypes.MANUAL_CODE_CHANGE,
        t('editor:dialog.paragraphStructure.paragraphTextSaved'),
      );
      if (result === null) pendingParagraphEdits.current.set(sourcePath, text);
    },
    [dispatch, reduxStore, t],
  );

  const handleParagraphBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const paragraph = editableParagraphForTarget(event.target);
    if (paragraph) void saveParagraphEdit(paragraph);
  };

  useEffect(() => {
    if (!focusedFigureXmlId || !stateEditorLetter.xmlContent) return;
    setLetterState({
      viewMode: stateEditorLetter.viewMode,
      xmlContent: stateEditorLetter.xmlContent,
      undoAvailable: stateEditorLetter.undoAvailable,
      redoAvailable: stateEditorLetter.redoAvailable,
    });
  }, [focusedFigureXmlId, stateEditorLetter]);

  useEffect(() => {
    if (!focusedFigureXmlId || !xmlContentRef.current) return;
    const figure = Array.from(xmlContentRef.current.querySelectorAll('figure')).find(
      (element) => element.getAttribute('xml:id') === focusedFigureXmlId,
    );
    if (figure instanceof HTMLElement) {
      figure.focus();
      figure.scrollIntoView?.({ block: 'center' });
    }
  }, [focusedFigureXmlId, letterState.xmlContent]);

  useEffect(() => {
    let cancelled = false;

    const loadLetterData = async () => {
      const letterId = stateEditorLetter.id;
      if (letterId === null) {
        if (!cancelled) {
          setLetterState({
            viewMode: null,
            xmlContent: null,
            undoAvailable: false,
            redoAvailable: false,
          });
        }
        return;
      }

      if (stateEditorLetter.xmlContent !== null) {
        setLetterState({
          viewMode: stateEditorLetter.viewMode,
          xmlContent: stateEditorLetter.xmlContent,
          undoAvailable: stateEditorLetter.undoAvailable,
          redoAvailable: stateEditorLetter.redoAvailable,
        });
        return;
      }

      let letterData: EditorLetterData | null;

      //TODO optimize: if letter is pinned, fetch from pinned endpoint, else from normal endpoint
      if (activeLetterIsPinned) {
        letterData = await fetchPinnedLetterData(letterId);
      } else {
        letterData = await fetchLetterData(letterId);
      }

      if (cancelled) return;
      setLetterState({
        viewMode: stateEditorLetter.viewMode,
        xmlContent: letterData.xmlContent,
        undoAvailable: letterData.undoAvailable,
        redoAvailable: letterData.redoAvailable,
      });
      dispatch(
        setEditorLetter({
          letter: {
            name: letterData.name,
            capabilities: letterData.capabilities,
            version: letterData.version,
          },
        }),
      );
      dispatch(
        setEditorPinnedLetterLifecycle({
          id: letterData.id,
          name: letterData.name,
          capabilities: letterData.capabilities,
          version: letterData.version,
        }),
      );
    };

    loadLetterData().catch((error) => {
      if (cancelled) return;
      enqueueSnackbar('Fehler beim Laden des Briefinhalts: ' + MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
    });

    return () => {
      cancelled = true;
    };
  }, [
    activeLetterIsPinned,
    dispatch,
    stateEditorLetter.id,
    stateEditorLetter.redoAvailable,
    stateEditorLetter.undoAvailable,
    stateEditorLetter.viewMode,
    stateEditorLetter.xmlContent,
  ]);

  useEffect(() => {
    let cancelled = false;

    const reloadNewData = async () => {
      let letterData: EditorLetterData | null = null;
      if (stateEditorLetter.id === null) return;

      if (activeLetterIsPinned) {
        letterData = await fetchPinnedLetterData(stateEditorLetter.id);
      } else {
        letterData = await fetchLetterData(stateEditorLetter.id);
      }

      if (cancelled) return;
      setLetterState({
        viewMode: stateEditorLetter.viewMode,
        xmlContent: letterData.xmlContent,
        undoAvailable: letterData.undoAvailable,
        redoAvailable: letterData.redoAvailable,
      });

      dispatch(
        setEditorLetter({
          letter: {
            name: letterData.name,
            capabilities: letterData.capabilities,
            version: letterData.version,
          },
        }),
      );
      dispatch(
        setEditorPinnedLetterLifecycle({
          id: letterData.id,
          name: letterData.name,
          capabilities: letterData.capabilities,
          version: letterData.version,
        }),
      );

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
        if (cancelled) return;
        enqueueSnackbar('Fehler beim Neuladen des Briefinhalts: ' + MiscUtils.misc.getErrorMessage(error), { variant: 'error' });
      });
    }

    return () => {
      cancelled = true;
    };
  }, [activeLetterIsPinned, dispatch, reloadLetterContent, stateEditorLetter.id, stateEditorLetter.viewMode]);

  // 👇 memoize XMLDisplayParser so it only re-renders if xmlContent changes
  const parserXmlMemo = useMemo(() => {
    if (letterState && letterState.xmlContent !== null) {
      return (
        <XMLDisplayParser
          xmlContentRef={xmlContentRef}
          xmlString={letterState.xmlContent}
          letterId={stateEditorLetter.id}
          focusedFigureXmlId={focusedFigureXmlId}
          onRightClickMarked={(pos) => setAnchorPosition(pos)}
        />
      );
    } else {
      return <></>;
    }
  }, [focusedFigureXmlId, letterState, stateEditorLetter.id]);

  return (
    <div className="letter-view-container">
      <div className="container-fmbc-letter">
        <div className="box-1">
          {letterState.xmlContent ? (
            <>
              {reloadLetterContent ? (
                <Alert severity="warning">{t('editor:common.letterViewContainer.reloadRequired')}</Alert>
              ) : letterState.viewMode === 'WYSIWYG' ? (
                <div className="letter-xml" id="letterXml" ref={containerRef} style={{ fontSize: `${stateLetterFontSize}%` }}>
                  <div
                    ref={xmlContentRef}
                    id="letterXmlContent"
                    style={{ padding: 20 }}
                    contentEditable
                    suppressContentEditableWarning
                    spellCheck={false}
                    aria-readonly="false"
                    onBeforeInput={preventDirectEdit}
                    onCut={preventDirectEdit}
                    onPaste={handleParagraphPaste}
                    onDrop={preventDirectEdit}
                    onKeyDownCapture={preventMutationKey}
                    onInput={handleParagraphInput}
                    onBlurCapture={handleParagraphBlur}
                  >
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
              ) : (
                letterState.viewMode === 'CODE' && letterState.xmlContent && <LetterViewCode xmlString={letterState.xmlContent} />
              )}
            </>
          ) : (
            <p>
              <Alert severity="warning">{t('editor:common.letterViewContainer.noLetter')}</Alert>
            </p>
          )}
        </div>
      </div>
      {isDebugMode ? <StateInfo /> : <></>}
    </div>
  );
};

export default LetterViewContainer;
