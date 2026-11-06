import { EditorConstants } from '@src/constants/editor';
import { getMenuItemsNoMarking } from '@src/constants/menuItems';

describe('getMenuItemsNoMarking', () => {
  it('marks generic node removal as a destructive menu action', () => {
    const items = getMenuItemsNoMarking(jest.fn(), { id: 7 }, { current: null });
    const removeItem = items.find((item) => item.identifier === EditorConstants.menuItemTypes.DELETE_NODE);

    expect(removeItem).toMatchObject({
      danger: true,
    });
  });
});
