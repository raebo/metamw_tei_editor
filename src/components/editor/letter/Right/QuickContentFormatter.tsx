import React from 'react';
import { ListItemButton, ListItemIcon } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState, store } from '@src/redux/redux.store';
import { contentMarkedKeyHandleDefinitions, generateKeyHandleAction } from '../Center/lib/keyHandlerDefinitions';
import { enqueueSnackbar } from 'notistack';
import { useAppDispatch } from '@src/redux/hooks';

const QuickContentFormatter = () => {
  const dispatch = useAppDispatch();
  const [iconsAreActive, setIconsAreActive] = useState<boolean>(false);
  const contentTextIsMarked = useSelector((state: RootState) => state.editorLetter.content.textIsMarked);

  useEffect(() => {
    setIconsAreActive(!!contentTextIsMarked);
  }, [contentTextIsMarked]);

  const onClickButton = (keyCombination: string) => {
    const editorKeyHandleItem = Object.values(contentMarkedKeyHandleDefinitions).filter((item) => item.key === keyCombination)[0];

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
      <ListItemButton onClick={() => onClickButton('ctrl+b')}>
        <ListItemIcon>
          <FormatBoldIcon color={iconsAreActive ? 'primary' : 'disabled'} />
        </ListItemIcon>
      </ListItemButton>
      <ListItemButton onClick={() => onClickButton('ctrl+i')}>
        <ListItemIcon>
          <FormatItalicIcon color={iconsAreActive ? 'primary' : 'disabled'} />
        </ListItemIcon>
      </ListItemButton>
      <ListItemButton onClick={() => onClickButton('ctrl+u')}>
        <ListItemIcon>
          <FormatUnderlinedIcon color={iconsAreActive ? 'primary' : 'disabled'} />
        </ListItemIcon>
      </ListItemButton>
    </>
  );
};

export default QuickContentFormatter;
