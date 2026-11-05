import { createContextMenuItems } from '@src/components/editor/letter/Util/ContextMenuLetterItems';

describe('createContextMenuItems', () => {
  it('routes structural menu commands directly through the shared shortcut action', () => {
    const handleShortcut = jest.fn();
    const items = createContextMenuItems({
      handleMenuItemClick: jest.fn(),
      handleMenuItemDialogClick: jest.fn(),
      handleShortcut,
    });

    const structureCommands = items.find((item) => item.label === 'Auszeichnungen Struktur');
    const writingActCommands = items.find((item) => item.label === 'Schreibakt Anpassen');

    structureCommands?.subMenu?.[0].action?.({});
    structureCommands?.subMenu?.[1].action?.({});
    writingActCommands?.subMenu?.[0].action?.({});
    writingActCommands?.subMenu?.[1].action?.({});

    expect(handleShortcut.mock.calls.map(([shortcut]) => shortcut)).toEqual(['ctrl+shift+h', 'ctrl+shift+i', 'alt+v', 'alt+shift+v']);
  });
});
