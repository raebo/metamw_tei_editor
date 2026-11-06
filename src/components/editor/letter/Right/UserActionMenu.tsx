import { Menu, MenuList, Paper, Popper } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { enqueueSnackbar } from 'notistack';
import { EditorConstants } from '@src/constants/editor';
import { useAppDispatch } from '@src/redux/hooks';
import { setEditorSelectedItem } from '@src/redux/slices/editor.letter.slice';
import store, { RootState } from '@src/redux/redux.store';
import { EditorKeyHandleItem } from '@src/services/mappings/editorMappings';
import { MiscUtils } from '@src/utils/misc';
import EditorCommandMenuItem, { editorCommandMenuPaperSx } from '@src/components/editor/letter/Util/EditorCommandMenuItem';
import {
  allTimesAvailableKeyHandleDefinitions,
  contentMarkedKeyHandleDefinitions,
  filterForKeyHandleDefinitions,
  generateKeyHandleAction,
} from '../Center/lib/keyHandlerDefinitions';

interface UserActionMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  handleClose: () => void;
}

type ActionRequirement = 'always' | 'letter' | 'selection' | 'unavailable';

type MenuItem = {
  id: string;
  label: string;
  keyHandleItem: EditorKeyHandleItem | null;
  active: boolean;
  disabledReason?: string;
  action?: () => void;
  subMenu?: MenuItem[];
};

const filterKeyCombination = (key: string): EditorKeyHandleItem | null => {
  try {
    return filterForKeyHandleDefinitions({ ...allTimesAvailableKeyHandleDefinitions, ...contentMarkedKeyHandleDefinitions }, key);
  } catch (error) {
    enqueueSnackbar(`Error while filtering key combination "${key}": ${MiscUtils.misc.getErrorMessage(error)}`, { variant: 'error' });
  }

  return null;
};

const UserActionMenu = ({ anchorEl, open, handleClose }: UserActionMenuProps) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const letterLoaded = useSelector((state: RootState) => state.editorLetter.letter.id !== null);
  const selectionActive = useSelector((state: RootState) => state.editorLetter.content.textIsMarked);
  const [openSubMenu, setOpenSubMenu] = useState<{ id: string; anchorEl: HTMLElement } | null>(null);

  const menuItems = useMemo<MenuItem[]>(() => {
    const disabledReason = (requirement: ActionRequirement): string | undefined => {
      if (requirement === 'letter' && !letterLoaded) {
        return t('editor:common.userActionMenu.disabledReasons.noLetter');
      }
      if (requirement === 'selection') {
        if (!letterLoaded) {
          return t('editor:common.userActionMenu.disabledReasons.noLetter');
        }
        if (!selectionActive) {
          return t('editor:common.userActionMenu.disabledReasons.selectionRequired');
        }
      }
      if (requirement === 'unavailable') {
        return t('editor:common.userActionMenu.disabledReasons.unavailable');
      }
      return undefined;
    };

    const actionItem = (id: string, label: string, key: string | null, requirement: ActionRequirement, action?: () => void): MenuItem => {
      const reason = disabledReason(requirement);
      return {
        id,
        label,
        keyHandleItem: key ? filterKeyCombination(key) : null,
        active: reason === undefined,
        disabledReason: reason,
        action,
      };
    };

    const group = (id: string, label: string, subMenu: MenuItem[]): MenuItem => {
      const firstActiveItem = subMenu.find((item) => item.active);
      return {
        id,
        label,
        keyHandleItem: null,
        active: Boolean(firstActiveItem),
        disabledReason: firstActiveItem ? undefined : subMenu[0]?.disabledReason,
        subMenu,
      };
    };

    const openRightPanel = (panel: string) => () => {
      dispatch(setEditorSelectedItem({ selectedItem: { left: null, right: panel } }));
    };

    return [
      group('header-create', t('editor:common.userActionMenu.groups.headerCreate'), [
        actionItem('create-header', t('editor:common.userActionMenu.actions.createHeader'), 'alt+c', 'letter'),
        actionItem('create-letter', t('editor:common.userActionMenu.actions.createLetter'), 'alt+n', 'always'),
      ]),
      group('header-edit', t('editor:common.userActionMenu.groups.headerEdit'), [
        actionItem('edit-header', t('editor:common.userActionMenu.actions.editHeader'), 'alt+c', 'letter'),
        actionItem('edit-receiver', t('editor:common.userActionMenu.actions.editReceiver'), 'alt+d', 'letter'),
        actionItem('add-attachment', t('editor:common.userActionMenu.actions.addAttachment'), 'ctrl+alt+6', 'letter'),
        actionItem('add-manuscript-annotation', t('editor:dialog.manuscriptAnnotation.contextAction'), 'ctrl+shift+d', 'letter'),
        actionItem('add-rism', t('editor:common.userActionMenu.actions.addRism'), 'ctrl+m', 'letter'),
        actionItem('add-provenance', t('editor:common.userActionMenu.actions.addProvenance'), 'ctrl+shift+n', 'letter'),
      ]),
      group('entities', t('editor:dialog.commandGroups.entities'), [
        actionItem(
          'entity-person',
          t('editor:common.userActionMenu.actions.person'),
          'ctrl+alt+p',
          'selection',
          openRightPanel(EditorConstants.compMappingRight.ENT_PERSON),
        ),
        actionItem(
          'entity-place',
          t('editor:common.userActionMenu.actions.place'),
          'ctrl+alt+o',
          'selection',
          openRightPanel(EditorConstants.compMappingRight.ENT_PLACE),
        ),
        actionItem(
          'entity-creation',
          t('editor:common.userActionMenu.actions.creation'),
          'ctrl+alt+w',
          'selection',
          openRightPanel(EditorConstants.compMappingRight.ENT_CREATION),
        ),
        actionItem(
          'entity-protag-creation',
          t('editor:common.userActionMenu.actions.protagCreation'),
          null,
          'selection',
          openRightPanel(EditorConstants.compMappingRight.ENT_FMBC_CREATION),
        ),
        actionItem('entity-fmb-letter', t('editor:common.userActionMenu.actions.fmbLetter'), 'ctrl+alt+b', 'selection'),
        actionItem('entity-gb-letter', t('editor:common.userActionMenu.actions.gbLetter'), 'ctrl+alt+v', 'selection'),
      ]),
      actionItem('text-create', t('editor:common.userActionMenu.groups.textCreate'), null, 'unavailable'),
      group('text-criticism', t('editor:common.userActionMenu.groups.textCriticism'), [
        actionItem('create-writing-act', t('editor:common.userActionMenu.actions.createWritingAct'), 'ctrl+shift+s', 'letter'),
        actionItem('receiver-address', t('editor:common.userActionMenu.actions.receiverAddress'), 'ctrl+shift+a', 'letter'),
        actionItem('sender-address', t('editor:common.userActionMenu.actions.senderAddress'), 'ctrl+shift+b', 'letter'),
        actionItem('author-footnote', t('editor:dialog.authorFootnote.contextAction'), 'alt+ctrl+f', 'letter'),
        actionItem('add-remark', t('editor:common.userActionMenu.actions.addRemark'), null, 'unavailable'),
      ]),
      group('formatting', t('editor:dialog.foreignText.formattingMenu'), [
        actionItem('abbreviation', t('editor:dialog.abbreviation.contextAction'), 'ctrl+1', 'selection'),
        actionItem('foreign-text', t('editor:dialog.foreignText.contextAction'), 'ctrl+alt+x', 'selection'),
        actionItem('superscript', t('editor:dialog.inlineFormatting.superscript.applyAction'), 'ctrl+5', 'selection'),
        actionItem('subscript', t('editor:dialog.inlineFormatting.subscript.applyAction'), 'ctrl+6', 'selection'),
        actionItem('groundline', t('editor:dialog.inlineFormatting.groundline.applyAction'), 'ctrl+7', 'selection'),
        actionItem('latintype', t('editor:dialog.inlineFormatting.latintype.applyAction'), 'ctrl+8', 'selection'),
        actionItem('antiqua', t('editor:dialog.inlineFormatting.antiqua.applyAction'), 'ctrl+alt+g', 'selection'),
        actionItem('gothic', t('editor:dialog.inlineFormatting.gothic.applyAction'), 'ctrl+alt+h', 'selection'),
        actionItem('horizontal-fraction', t('editor:dialog.horizontalFraction.horizontalAction'), 'ctrl+2', 'letter'),
        actionItem('vertical-slash-fraction', t('editor:dialog.horizontalFraction.verticalSlashAction'), 'ctrl+3', 'letter'),
        actionItem('vertical-fraction', t('editor:dialog.horizontalFraction.verticalNoSlashAction'), 'ctrl+4', 'letter'),
      ]),
      group('cross-references', t('editor:dialog.crossReference.contextAction'), [
        actionItem('cross-reference-register', t('editor:dialog.crossReference.kinds.register'), 'ctrl+alt+r', 'letter'),
        actionItem(
          'cross-reference-letter-annotation',
          t('editor:dialog.crossReference.kinds.letter-annotation'),
          'ctrl+shift+r',
          'letter',
        ),
        actionItem('cross-reference-external', t('editor:dialog.crossReference.kinds.external-url'), 'ctrl+alt+u', 'letter'),
        actionItem('cross-reference-internal', t('editor:dialog.crossReference.kinds.internal-url'), 'ctrl+shift+u', 'letter'),
        actionItem('cross-reference-target', t('editor:dialog.crossReference.kinds.generic-target'), 'ctrl+alt+z', 'letter'),
        actionItem('cross-reference-start', t('editor:dialog.crossReference.kinds.generic-start'), 'ctrl+shift+z', 'letter'),
      ]),
      group('structure', t('editor:dialog.commandGroups.structure'), [
        actionItem('page-break', t('editor:common.userActionMenu.actions.pageBreak'), 'ctrl+shift+h', 'selection'),
        actionItem('column-break', t('editor:common.userActionMenu.actions.columnBreak'), 'ctrl+shift+i', 'selection'),
      ]),
    ];
  }, [dispatch, letterLoaded, selectionActive, t]);

  const closeAllMenus = () => {
    setOpenSubMenu(null);
    handleClose();
  };

  const executeItem = (item: MenuItem) => {
    if (!item.active) return;

    if (item.action) {
      item.action();
    } else if (item.keyHandleItem) {
      const action = generateKeyHandleAction(item.keyHandleItem);
      action?.(dispatch, () => store.getState());
    }

    closeAllMenus();
  };

  const selectedGroup = menuItems.find((item) => item.id === openSubMenu?.id);

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={closeAllMenus}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: editorCommandMenuPaperSx } }}
      >
        {menuItems.map((item) => (
          <EditorCommandMenuItem
            key={item.id}
            onMouseEnter={(event) => item.subMenu && setOpenSubMenu({ id: item.id, anchorEl: event.currentTarget })}
            onClick={(event) => {
              if (item.subMenu) {
                setOpenSubMenu({ id: item.id, anchorEl: event.currentTarget });
              } else {
                executeItem(item);
              }
            }}
            label={item.label}
            shortcut={item.keyHandleItem?.key}
            hasSubMenu={Boolean(item.subMenu)}
            disabled={!item.active}
            disabledReason={item.disabledReason}
          />
        ))}
      </Menu>

      {selectedGroup?.subMenu && (
        <Popper
          anchorEl={openSubMenu?.anchorEl ?? null}
          open={Boolean(openSubMenu)}
          placement="right-start"
          sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
        >
          <Paper elevation={8} sx={editorCommandMenuPaperSx}>
            <MenuList>
              {selectedGroup.subMenu.map((item) => (
                <EditorCommandMenuItem
                  key={item.id}
                  onClick={() => executeItem(item)}
                  label={item.label}
                  shortcut={item.keyHandleItem?.key}
                  disabled={!item.active}
                  disabledReason={item.disabledReason}
                />
              ))}
            </MenuList>
          </Paper>
        </Popper>
      )}
    </>
  );
};

export default UserActionMenu;
