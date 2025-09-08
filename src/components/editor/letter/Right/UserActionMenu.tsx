import { Box, Menu, MenuItem } from '@mui/material';
import React, { useState } from 'react';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { allTimesAvailableKeyHandleDefinitions, filterForKeyHandleDefinitions } from '../Center/lib/keyHandlerDefinitions';
import { EditorKeyHandleItem } from '../../../../services/mappings/editorMappings';
import { enqueueSnackbar } from 'notistack';
import { EditorUtils } from '../../../../utils/editor';
import { setReloadLetterContent } from '../../../../redux/slices/editor.letter.slice';
import { useAppDispatch } from '../../../../redux/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/redux.store';

interface UserActionMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  handleClose: () => void;
}

type MenuItem = {
  label: string;
  keyHandleItem: EditorKeyHandleItem | null;
  active: boolean;
  hasSubMenu?: boolean;
  subMenu?: {
    label: string;
    keyHandleItem: EditorKeyHandleItem | null;
    active: boolean;
  }[];
};

const filterKeyCombination = (key: string): EditorKeyHandleItem | null => {
  try {
    return filterForKeyHandleDefinitions(allTimesAvailableKeyHandleDefinitions, key);
  } catch (error) {
    enqueueSnackbar('Error while filtering key combination: ' + key, { variant: 'error' });
  }

  return null;
};

const menuItems: MenuItem[] = [
  {
    label: 'Brief Header Erstellung',
    keyHandleItem: null,
    active: true,
    hasSubMenu: true,
    subMenu: [
      { label: 'Brief Header Erstellen', keyHandleItem: filterKeyCombination('alt+c'), active: true },
      { label: 'Brief Erstellen', keyHandleItem: filterKeyCombination('alt+n'), active: true },
    ],
  },
  {
    label: 'Brief Header Bearbeitung',
    keyHandleItem: null,
    active: true,
    hasSubMenu: true,
    subMenu: [
			{ label: 'Brief Header Bearbeiten', keyHandleItem: filterKeyCombination('alt+c'), active: true },
			{ label: 'Beilage Hinzufügen', keyHandleItem: filterKeyCombination('ctrl+alt+6'), active: true }
		],
  },
  { label: 'Brief Text Erstellung', keyHandleItem: null, active: false },
  {
    label: 'Text Kritik',
    active: true,
    hasSubMenu: true,
    keyHandleItem: null,
    subMenu: [
      { label: 'Schreibakt Erstellen', keyHandleItem: filterKeyCombination('ctrl+shift+s'), active: true },
			{ label: 'Adresse Empfänger', keyHandleItem: filterKeyCombination('ctrl+shift+a'), active: true },
			{ label: 'Adresse Sender', keyHandleItem: filterKeyCombination('ctrl+shift+b'), active: true },
      { label: 'Vermerk Hinzufügen', keyHandleItem: null, active: false },
    ],
  },
];

const UserActionMenu = (props: UserActionMenuProps) => {
  const dispatch = useAppDispatch();
  const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter);

  const [subMenuAnchorEl, setSubMenuAnchorEl] = useState<{ [key: string]: HTMLElement | null }>({});

  const handleSubMenuOpen = (event: React.MouseEvent<HTMLElement>, menuKey: string) => {
    setSubMenuAnchorEl((prev) => ({ ...prev, [menuKey]: event.currentTarget }));
  };

  const handleSubMenuClick = (menuKey: string, editorKeyHandleItem: EditorKeyHandleItem | null) => {
    if (!editorKeyHandleItem) {
      //enqueueSnackbar("No key handle item found", { variant: "error" });
      setSubMenuAnchorEl((prev) => ({ ...prev, [menuKey]: null }));
      return;
    }

    if (editorKeyHandleItem.action) {
      editorKeyHandleItem
        .action()
        .then((xmlContent) => {
          if (xmlContent) {
            EditorUtils.backendService.patchContent(xmlContent, stateEditorLetter.id, 'CONTENT_FORMAT_CHANGED', null).then(() => {
              dispatch(setReloadLetterContent({ reloadLetterContent: true }));
            });
          }
        })
        .catch((error) => {
          enqueueSnackbar(`Error during calling keybinding: '${editorKeyHandleItem.description} ${error.toString()}'`, {
            variant: 'error',
          });
        });
    } else if (editorKeyHandleItem.openDialogAction) {
      editorKeyHandleItem.openDialogAction(dispatch);
    }

    props.handleClose();
    setSubMenuAnchorEl({});
    // setSubMenuAnchorEl((prev) => ({ ...prev, [menuKey]: null }));
  };

  const getMenuItemStyles = (active: boolean) => ({
    fontSize: '0.775rem',
    padding: '4px 12px',
    minHeight: '32px',
    color: active ? 'black' : 'gray',
    cursor: 'pointer',
  });
  const getSndMenuItemStyles = (active: boolean) => ({
    fontSize: '0.675rem',
    padding: '2px 12px',
    minHeight: '15px',
    color: active ? 'black' : 'grey',
    cursor: 'pointer',
  });

  const SndMenuItemStylesSpan = {
    fontSize: '0.475rem',
    padding: '0px 12px',
    minHeight: '15px',
    color: 'grey',
    cursor: 'pointer',
  };

  return (
    <>
      <Menu
        anchorEl={props.anchorEl}
        open={props.open}
        onClose={() => {
          props.handleClose();
          setSubMenuAnchorEl({});
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        {menuItems.map((item, index) =>
          item.hasSubMenu ? (
            <MenuItem
              key={index}
              component="div"
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => item.hasSubMenu && handleSubMenuOpen(e, item.label)}
              onClick={(e: React.MouseEvent<HTMLElement>) => handleSubMenuOpen(e, item.label)}
              sx={getMenuItemStyles(item.active)}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>{item.label}</span>
                {item.keyHandleItem && 'key' in item.keyHandleItem ? (
                  <span style={SndMenuItemStylesSpan}>{item.keyHandleItem.key}</span>
                ) : null}
              </Box>
              <ArrowRightIcon fontSize="small" />
            </MenuItem>
          ) : (
            <MenuItem key={index} onClick={props.handleClose} className="custom-tool-menu-item" sx={getMenuItemStyles(item.active)}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>{item.label}</span>
                {item.keyHandleItem && 'key' in item.keyHandleItem ? (
                  <span style={SndMenuItemStylesSpan}>{item.keyHandleItem.key}</span>
                ) : null}
              </Box>
            </MenuItem>
          ),
        )}
      </Menu>

      {menuItems
        .filter((item) => item.hasSubMenu) // Only consider items with submenus
        .map((item) => (
          <Menu
            key={item.label}
            anchorEl={subMenuAnchorEl[item.label]} // Use the correct anchor element for this submenu
            open={Boolean(subMenuAnchorEl[item.label])} // Only open if the anchor element is set
            onClose={() => handleSubMenuClick(item.label, null)} // Close this specific submenu
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {item.subMenu?.map((subItem, subIndex) => (
              <MenuItem
                key={subIndex}
                onClick={() => handleSubMenuClick(item.label, subItem.keyHandleItem)} // Close the submenu when an item is clicked
                className="custom-tool-menu-item"
                sx={getSndMenuItemStyles(subItem.active)}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>{subItem.label}</span>
                  {subItem.keyHandleItem && 'key' in subItem.keyHandleItem ? (
                    <span style={SndMenuItemStylesSpan}>{subItem.keyHandleItem.key}</span>
                  ) : null}
                </Box>
              </MenuItem>
            ))}
          </Menu>
        ))}
    </>
  );
};

export default UserActionMenu;
