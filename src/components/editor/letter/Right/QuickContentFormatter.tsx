import React from 'react';
import { IconButton, ListItemButton, ListItemIcon } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState, store } from '@src/redux/redux.store';
import {
  allTimesAvailableKeyHandleDefinitions,
  contentMarkedKeyHandleDefinitions,
  generateKeyHandleAction,
} from '../Center/lib/keyHandlerDefinitions';
import { enqueueSnackbar } from 'notistack';
import { useAppDispatch } from '@src/redux/hooks';
import { ToolbarButton } from '@src/components/editor/letter/Util/ToolbarButton';
import type { EditorKeyHandleItem } from '@src/services/mappings/editorMappings';
import { runOncePerAction } from '@src/utils/misc/stateHandling';

const QuickContentFormatter = () => {
  const dispatch = useAppDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);
  const contentTextIsMarked = useSelector((state: RootState) => state.editorLetter.content.textIsMarked);

  const [undoActive, setUndoActive] = useState<boolean>(stateEditorLetter.undoAvailable);
  const [redoActive, setRedoActive] = useState<boolean>(stateEditorLetter.redoAvailable);
  const [iconsAreActive, setIconsAreActive] = useState<boolean>(false);

  useEffect(() => {
    setIconsAreActive(!!contentTextIsMarked);
  }, [contentTextIsMarked]);

  useEffect(() => {
    setUndoActive(!!stateEditorLetter.undoAvailable);
    setRedoActive(!!stateEditorLetter.redoAvailable);
  }, [stateEditorLetter.undoAvailable, stateEditorLetter.redoAvailable]);

  const getToolbarButtonStyle = (active: boolean) => ({
    bgcolor: active ? 'primary.light' : 'toolbarButton.inactiveBg',
    border: '1px solid',
    borderColor: active ? 'primary.main' : 'grey.400',
    borderRadius: 1,
    '&:hover': {
      bgcolor: active ? 'primary.main' : 'grey.100',
    },
  });

  const handleEditorKeyHandle = (keyCombination: string, editorKeyHandleItems: Record<string, EditorKeyHandleItem>) => {
    const editorKeyHandleItem = Object.values(editorKeyHandleItems).filter((item) => item.key === keyCombination)[0];

    if (!editorKeyHandleItem) {
      enqueueSnackbar(`Keybinding '${keyCombination}' not found`, { variant: 'error' });
      return;
    }

    const getState = () => store.getState();
    const action = generateKeyHandleAction(editorKeyHandleItem);

    runOncePerAction(editorKeyHandleItem.key, async () => {
      action?.(dispatch, getState);
    });
  };

  const onClickButton = (keyCombination: string) => {
    handleEditorKeyHandle(keyCombination, contentMarkedKeyHandleDefinitions);
  };

  const onClickNoMarkedButton = (keyCombination: string) => {
    handleEditorKeyHandle(keyCombination, allTimesAvailableKeyHandleDefinitions);
  };

  return (
    <>
      <ListItemButton
        onClick={() => onClickButton('ctrl+b')}
        sx={{
          ...getToolbarButtonStyle(iconsAreActive),
        }}
      >
        <ListItemIcon>
          <ToolbarButton title="Bold (Ctrl+B)" active={iconsAreActive} onClick={() => onClickButton('ctrl+b')}>
            <FormatBoldIcon />
          </ToolbarButton>
        </ListItemIcon>
      </ListItemButton>
      <ListItemButton
        onClick={() => onClickButton('ctrl+i')}
        sx={{
          ...getToolbarButtonStyle(iconsAreActive),
        }}
      >
        <ToolbarButton title="Italic (Ctrl+I)" active={iconsAreActive} onClick={() => onClickButton('ctrl+i')}>
          <FormatItalicIcon />
        </ToolbarButton>
      </ListItemButton>
      <ListItemButton
        onClick={() => onClickButton('ctrl+u')}
        sx={{
          ...getToolbarButtonStyle(iconsAreActive),
        }}
      >
        <ToolbarButton title="Underline (Ctrl+U)" active={iconsAreActive} onClick={() => onClickButton('ctrl+u')}>
          <FormatUnderlinedIcon />
        </ToolbarButton>
      </ListItemButton>
      <ListItemButton
        onClick={() => onClickNoMarkedButton('ctrl+z')}
        sx={{
          ...getToolbarButtonStyle(undoActive),
        }}
      >
        <ToolbarButton title="Undo (Ctrl+Z)" onClick={() => onClickNoMarkedButton('ctrl+z')} active={undoActive}>
          {undoActive}
          <UndoIcon />
        </ToolbarButton>
      </ListItemButton>
      <ListItemButton
        onClick={() => onClickNoMarkedButton('ctrl+shift+z')}
        sx={{
          ...getToolbarButtonStyle(redoActive),
        }}
      >
        <ListItemIcon>
          <ToolbarButton title="Redo (Ctrl+SHIFT+Z)" onClick={() => onClickNoMarkedButton('ctrl+shift+z')} active={redoActive}>
            {redoActive}
            <RedoIcon color={'action'} />
          </ToolbarButton>
        </ListItemIcon>
      </ListItemButton>
    </>
  );
};

export default QuickContentFormatter;
