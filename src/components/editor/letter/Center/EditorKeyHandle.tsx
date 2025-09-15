import React, { useCallback, useEffect } from 'react';
import { useAppDispatch } from '../../../../redux/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/redux.store';
import {
  allTimesAvailableKeyHandleDefinitions,
  contentMarkedKeyHandleDefinitions,
  findKeyHandleDefinition,
} from './lib/keyHandlerDefinitions';
import { setReloadLetterContent } from '../../../../redux/slices/editor.letter.slice';
import { enqueueSnackbar } from 'notistack';
import { EditorUtils } from '../../../../utils/editor';
import { EditorKeyHandleItem } from '../../../../services/mappings/editorMappings';

function normalizeKeyEvent(event: KeyboardEvent): string {
  const keys: string[] = [];

  if (event.ctrlKey) keys.push('ctrl');
  if (event.metaKey) keys.push('meta');
  if (event.altKey) keys.push('alt');
  if (event.shiftKey) keys.push('shift');

  keys.push(event.key.toLowerCase());

  return keys.join('+');
}

const EditorKeyHandle = () => {
  const dispatch = useAppDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);
  const stateLetterContent = useSelector((state: RootState) => state.editorLetter.content);

  const handleFunction = useCallback(
    (event: KeyboardEvent, keyDefinitions: Record<string, EditorKeyHandleItem>) => {
      // ignore pure modifier presses
      if (['shift', 'alt', 'ctrl', 'meta'].includes(event.key.toLowerCase())) {
        return;
      }

      const combo = normalizeKeyEvent(event);
      const definition = findKeyHandleDefinition(combo, keyDefinitions);

      if (definition) {
        event.preventDefault();
        event.stopPropagation();

        if (definition.action) {
          definition
            .action()
            .then((xmlContent) => {
              if (xmlContent) {
                EditorUtils.backendService
                  .patchContent(xmlContent, stateEditorLetter.id, 'CONTENT_FORMAT_CHANGED', null)
                  .then(() => {
                    dispatch(setReloadLetterContent({ reloadLetterContent: true }));
                  });
              }
            })
            .catch((error) => {
              enqueueSnackbar(
                `An error occurred during: '${definition.description} ${error.toString()}'`,
                { variant: 'error' },
              );
            });
        } else if (definition.openDialogAction) {
          definition.openDialogAction(dispatch);
        }
      }
    },
    [stateEditorLetter],
  );

  useEffect(() => {
    const globalKeyListener = (event: KeyboardEvent) => {
      handleFunction(event, allTimesAvailableKeyHandleDefinitions);
    };
    document.addEventListener('keydown', globalKeyListener, false);

    let markedKeyListener: (event: KeyboardEvent) => void;
    if (stateLetterContent.textIsMarked) {
      markedKeyListener = (event: KeyboardEvent) => {
        handleFunction(event, contentMarkedKeyHandleDefinitions);
      };
      document.addEventListener('keydown', markedKeyListener, false);
    }

    return () => {
      document.removeEventListener('keydown', globalKeyListener, false);
      if (stateLetterContent.textIsMarked && markedKeyListener) {
        document.removeEventListener('keydown', markedKeyListener, false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateLetterContent]);

  return <></>;
};

export default EditorKeyHandle;
