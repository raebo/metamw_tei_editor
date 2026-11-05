import { EditorConstants } from '@src/constants/editor';

type NodeActionCallback = (args: { node?: Node }) => void;

export type MenuItemType = {
  identifier?: string;
  label?: string;
  keyShortcut?: string;
  action?: NodeActionCallback;
  type?: 'divider' | 'inactive' | 'header' | null;
  hasSubMenu?: boolean;
  subMenu?: MenuItemType[];
  disabled?: boolean;
  disabledReason?: string;
  danger?: boolean;
  group?: 'entities' | 'references' | 'structure';
};

type MenuHandlers = {
  handleMenuItemClick: (arg1: any, arg2: string) => void;
  handleMenuItemDialogClick: (dialogType: string) => void;
  handleShortcut: (shortcut: string) => void;
};

export function createContextMenuItems({ handleMenuItemClick, handleMenuItemDialogClick, handleShortcut }: MenuHandlers): MenuItemType[] {
  return [
    {
      label: 'Person Auszeichnen',
      action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_PERSON),
      hasSubMenu: false,
      keyShortcut: 'STRG+ALT+P',
      group: 'entities',
    },
    {
      label: 'Ort Auszeichnen',
      action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_PLACE),
      keyShortcut: 'STRG+ALT+O',
      group: 'entities',
    },
    {
      label: 'Werk Auszeichnen',
      action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_CREATION),
      keyShortcut: 'STRG+ALT+W',
      group: 'entities',
    },
    {
      label: 'FMBC Werk Auszeichnen',
      action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_FMBC_CREATION),
      keyShortcut: 'STRG+SHIFT+M',
      group: 'entities',
    },
    {
      label: 'Verweis FMB-Brief Auszeichnen',
      action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.ADD_LETTER_FROM_PROTAG),
      keyShortcut: 'STRG+ALT+B',
      group: 'entities',
    },
    {
      label: 'Verweis GB-Brief Auszeichnen',
      action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.ADD_LETTER_TO_PROTAG),
      keyShortcut: 'STRG+ALT+V',
      group: 'entities',
    },
    { type: 'divider' },
    {
      label: 'Kommentar Auszeichnen',
      action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.ADD_NOTE),
      keyShortcut: 'STRG+ALT+K',
      group: 'references',
    },
    {
      label: 'Auszeichnungen Datum',
      hasSubMenu: true,
      group: 'references',
      subMenu: [
        {
          label: 'Datum-When',
          action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.DATE_WHEN_ADD),
          keyShortcut: 'Alt+SHIFT+1',
        },
        {
          label: 'Datum-When-CUSTOM',
          action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.DATE_WHEN_CUSTOM_ADD),
          keyShortcut: 'Alt+SHIFT+2',
        },
        {
          label: 'Datum-Not-After',
          action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.DATE_NOT_AFTER_ADD),
          keyShortcut: 'Alt+SHIFT+3',
        },
        {
          label: 'Datum-Not-Before',
          action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.DATE_NOT_AFTER_ADD),
          keyShortcut: 'Alt+SHIFT+4',
        },
        {
          label: 'Datum-From-To',
          action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.DATE_FROM_TO_ADD),
          keyShortcut: 'Alt+SHIFT+5',
        },
        {
          label: 'Datum-NotBefore-NotAfter',
          action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.DATE_NOT_BEFORE_AFTER_ADD),
          keyShortcut: 'Alt+SHIFT+6',
        },
      ],
    },
    {
      label: 'Auszeichnungen Struktur',
      hasSubMenu: true,
      group: 'structure',
      subMenu: [
        {
          label: 'Seitenumbruch',
          action: () => handleShortcut('ctrl+shift+h'),
          keyShortcut: 'CTRL+SHIFT+H',
        },
        {
          label: 'Spaltenumbruch',
          action: () => handleShortcut('ctrl+shift+i'),
          keyShortcut: 'CTRL+SHIFT+I',
        },
      ],
    },
    {
      label: 'Schreibakt Anpassen',
      hasSubMenu: true,
      group: 'structure',
      subMenu: [
        {
          label: 'Bewegen ▲',
          action: () => handleShortcut('alt+v'),
          keyShortcut: 'ALT+V',
        },
        {
          label: 'Bewegen ▼',
          action: () => handleShortcut('alt+shift+v'),
          keyShortcut: 'SHIFT+ALT+V',
        },
      ],
    },
  ];
}
