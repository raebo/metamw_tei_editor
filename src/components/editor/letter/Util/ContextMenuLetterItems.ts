import {EditorConstants} from "../../../../constants/editor";

type NodeActionCallback = (args: {
  node?: Node;
}) => void;

export type MenuItemType = {
	identifier?: string;
  label?: string;
  action?: NodeActionCallback;
  type?: 'divider' | null;
  hasSubMenu?: boolean;
  subMenu?: {
    label: string;
    action?: NodeActionCallback;
  }[]
}

type MenuHandlers = {
  handleMenuItemClick: (arg1: any, arg2: string) => void;
  handleMenuItemDialogClick: (dialogType: string) => void;
};

export function createContextMenuItems({
  handleMenuItemClick,
  handleMenuItemDialogClick,
}: MenuHandlers): MenuItemType[] {
  return [
    {
      label: 'Person Hinzufügen',
      action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_PERSON),
      hasSubMenu: false,
    },
    {
      label: 'Ort Hinzufügen',
      action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_PLACE),
    },
    {
      label: 'Werk Hinzufügen',
      action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_CREATION),
    },
    {
      label: 'FMBC Werk Hinzufügen',
      action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_FMBC_CREATION),
    },
    {
      label: 'Verweis FMB-Brief Hinzufügen',
      action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.ADD_LETTER_FROM_PROTAG),
    },
    {
      label: 'Verweis GB-Brief Hinzufügen',
      action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.ADD_LETTER_TO_PROTAG),
    },
    { type: 'divider' },
    {
      label: 'Kommentar Hinzufügen',
      action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.ADD_NOTE),
    },
    {
      label: 'Auszeichnungen Datum',
      hasSubMenu: true,
      subMenu: [
        { label: 'Datum-When', action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.DATE_WHEN_ADD) },
        { label: 'Datum-When-CUSTOM', action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.DATE_WHEN_CUSTOM_ADD) },
        { label: 'Datum-Not-After', action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.DATE_NOT_AFTER_ADD) },
        { label: 'Datum-Not-Before', action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.DATE_NOT_AFTER_ADD) },
        { label: 'Datum-From-To', action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.DATE_FROM_TO_ADD) },
        { label: 'Datum-NotBefore-NotAfter', action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.DATE_NOT_BEFORE_AFTER_ADD) },
      ]
    }
    ]
}
