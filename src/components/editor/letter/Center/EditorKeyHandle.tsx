import React, { useCallback, useEffect } from 'react';
import { useAppDispatch } from '@src/redux/hooks';
import { useSelector } from 'react-redux';
import { RootState, store } from '@src/redux/redux.store';
import {
  allTimesAvailableKeyHandleDefinitions,
  contentMarkedKeyHandleDefinitions,
  findKeyHandleDefinition,
  generateKeyHandleAction,
} from './lib/keyHandlerDefinitions';
import { EditorKeyHandleItem } from '@src/services/mappings/editorMappings';
import { enqueueSnackbar } from 'notistack';

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
  const stateLetterContent = useSelector((state: RootState) => state.editorLetter.content);

  const handleFunction = useCallback(
    async (event: KeyboardEvent, keyDefinitions: Record<string, EditorKeyHandleItem>) => {
      // ignore pure modifier presses
      if (['shift', 'alt', 'ctrl', 'meta'].includes(event.key.toLowerCase())) {
        return;
      }

      try {
        const getState = () => store.getState();
        const combo = normalizeKeyEvent(event);
        const keyHandleDefinition = findKeyHandleDefinition(combo, keyDefinitions);

        if (keyHandleDefinition) {
          event.preventDefault();
          event.stopPropagation();

          // console.log('keyHandleDefinition', keyHandleDefinition);

          const action = generateKeyHandleAction(keyHandleDefinition);

          if (!action) {
            enqueueSnackbar('Fehler bei der Tastenkombination: Aktion nicht gefunden', {
              variant: 'error',
            });
            return;
          }
          action(dispatch, getState);
        }
      } catch (error) {
        enqueueSnackbar('Fehler bei der Tastenkombination: ' + (error as Error).message, {
          variant: 'error',
        });
      }
    },
    [dispatch],
  );

  useEffect(() => {
    const globalKeyListener = async (event: KeyboardEvent) => {
      await handleFunction(event, allTimesAvailableKeyHandleDefinitions);
    };
    document.addEventListener('keydown', globalKeyListener, false);

    let markedKeyListener: (event: KeyboardEvent) => void;
    if (stateLetterContent.textIsMarked) {
      markedKeyListener = (event: KeyboardEvent) => {
        void handleFunction(event, contentMarkedKeyHandleDefinitions);
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
