import { EditorConstants } from '../../../../constants/editor';

type NodeActionCallback = (args: { node?: Node }) => void;

export type MenuItemType = {
  identifier?: string;
  label?: string;
  keyShortcut?: string;
  action?: NodeActionCallback;
  type?: 'divider' | 'inactive' | null;
  hasSubMenu?: boolean;
  subMenu?: {
    label: string;
    action?: NodeActionCallback;
    keyShortcut?: string;
  }[];
};

type MenuHandlers = {
  handleMenuItemClick: (arg1: any, arg2: string) => void;
  handleMenuItemDialogClick: (dialogType: string) => void;
};

export function createContextMenuItems({ handleMenuItemClick, handleMenuItemDialogClick }: MenuHandlers): MenuItemType[] {
  return [
    {
      label: 'Person Auszeichnen',
      action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_PERSON),
      hasSubMenu: false,
      keyShortcut: 'STRG+ALT+P',
    },
    {
      label: 'Ort Auszeichnen',
      action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_PLACE),
      keyShortcut: 'STRG+ALT+O',
    },
    {
      label: 'Werk Auszeichnen',
      action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_CREATION),
      keyShortcut: 'STRG+ALT+W',
    },
    {
      label: 'FMBC Werk Auszeichnen',
      action: () => handleMenuItemClick(null, EditorConstants.compMappingRight.ENT_FMBC_CREATION),
      keyShortcut: 'STRG+SHIFT+M',
    },
    {
      label: 'Verweis FMB-Brief Auszeichnen',
      action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.ADD_LETTER_FROM_PROTAG),
      keyShortcut: 'STRG+ALT+B',
    },
    {
      label: 'Verweis GB-Brief Auszeichnen',
      action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.ADD_LETTER_TO_PROTAG),
      keyShortcut: 'STRG+ALT+V',
    },
    { type: 'divider' },
    {
      label: 'Kommentar Auszeichnen',
      action: () => handleMenuItemDialogClick(EditorConstants.dialogTypes.ADD_NOTE),
      keyShortcut: 'STRG+ALT+K',
    },
    {
      label: 'Auszeichnungen Datum',
      hasSubMenu: true,
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
      subMenu: [
        {
          label: 'Seitenumbruch',
          action: (_node) => {
            const event = new KeyboardEvent('keydown', {
              key: 'v',
              code: 'KeyV',
              ctrlKey: true,
              shiftKey: true,
              altKey: false,
            });
            document.dispatchEvent(event);
          },
          keyShortcut: 'CTRL+SHIFT+V',
        },
      ],
    },
    {
      label: 'Schreibakt Anpassen',
      hasSubMenu: true,
      subMenu: [
        {
          label: 'Bewegen ▲',
          action: (_node) => {
            const event = new KeyboardEvent('keydown', {
              key: 'v',
              code: 'KeyV',
              ctrlKey: false,
              shiftKey: false,
              altKey: true,
              bubbles: true,
            });
            document.dispatchEvent(event);
          },
          keyShortcut: 'ALT+V',
        },
        {
          label: 'Bewegen ▼',
          action: (_node) => {
            const event = new KeyboardEvent('keydown', {
              key: 'v',
              code: 'KeyV',
              shiftKey: true,
              altKey: true,
              bubbles: true,
            });

            document.dispatchEvent(event);
          },
          keyShortcut: 'SHIFT+ALT+V',
        },
      ],
    },
  ];
}
