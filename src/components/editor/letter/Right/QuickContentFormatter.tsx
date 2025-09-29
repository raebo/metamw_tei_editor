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
  contentMarkedKeyHandleDefinitions,
  generateKeyHandleAction,
} from '../Center/lib/keyHandlerDefinitions';
import { enqueueSnackbar } from 'notistack';
import { useAppDispatch } from '@src/redux/hooks';
import { ToolbarButton } from '@src/components/editor/letter/Util/ToolbarButton';

const QuickContentFormatter = () => {
  const dispatch = useAppDispatch();
  const [iconsAreActive, setIconsAreActive] = useState<boolean>(false);
  const contentTextIsMarked = useSelector(
    (state: RootState) => state.editorLetter.content.textIsMarked,
  );

  const [undeActive, setUndoActive] = useState<boolean>(false);
  const [redoActive, setRedoActive] = useState<boolean>(false);
  // const undoStackLength = useSelector((state: RootState) => state.editorLetter.content.undoStack.length);
  // const redoStackLength = useSelector((state: RootState) => state.editorLetter.content.redoStack.length);

  useEffect(() => {
    setIconsAreActive(!!contentTextIsMarked);
  }, [contentTextIsMarked]);

  const getToolbarButtonStyle = (active: boolean) => ({
    bgcolor: active ? 'primary.light' : 'toolbarButton.inactiveBg',
    border: '1px solid',
    borderColor: active ? 'primary.main' : 'grey.400',
    borderRadius: 1,
    '&:hover': {
      bgcolor: active ? 'primary.main' : 'grey.100',
    },
  });

  const onClickButton = (keyCombination: string) => {
    const editorKeyHandleItem = Object.values(contentMarkedKeyHandleDefinitions).filter(
      (item) => item.key === keyCombination,
    )[0];

    if (!editorKeyHandleItem) {
      enqueueSnackbar(`Keybinding '${keyCombination}' not found`, { variant: 'error' });
      return;
    }

    const getState = () => store.getState();
    const action = generateKeyHandleAction(editorKeyHandleItem);
    action?.(dispatch, getState);
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
          <ToolbarButton
            title="Bold (Ctrl+B)"
            active={iconsAreActive}
            onClick={() => onClickButton('ctrl+b')}
          >
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
        <ToolbarButton
          title="Italic (Ctrl+I)"
          active={iconsAreActive}
          onClick={() => onClickButton('ctrl+i')}
        >
          <FormatItalicIcon />
        </ToolbarButton>
      </ListItemButton>
      <ListItemButton
        onClick={() => onClickButton('ctrl+u')}
        sx={{
          ...getToolbarButtonStyle(iconsAreActive),
        }}
      >
        <ToolbarButton
          title="Underline (Ctrl+U)"
          active={iconsAreActive}
          onClick={() => onClickButton('ctrl+u')}
        >
          <FormatUnderlinedIcon />
        </ToolbarButton>
      </ListItemButton>
      <ListItemButton
        onClick={() => onClickButton('ctrl+z')}
        sx={{
          ...getToolbarButtonStyle(undeActive),
        }}
      >
        <ToolbarButton
          title="Undo (Ctrl+Z)"
          onClick={() => onClickButton('ctrl+z')}
          active={undeActive}
        >
          <UndoIcon />
        </ToolbarButton>
      </ListItemButton>
      <ListItemButton
        onClick={() => onClickButton('ctrl+shift+z')}
        sx={{
          ...getToolbarButtonStyle(redoActive),
        }}
      >
        <ListItemIcon>
          <ToolbarButton
            title="Redo (Ctrl+SHIFT+Z)"
            onClick={() => onClickButton('ctrl+shift+z')}
            active={redoActive}
          >
            <RedoIcon color={'action'} />
          </ToolbarButton>
        </ListItemIcon>
      </ListItemButton>
    </>
  );
};

export default QuickContentFormatter;
