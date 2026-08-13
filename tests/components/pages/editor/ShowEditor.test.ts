import { valueForSide } from '@src/components/pages/editor/ShowEditor';
import { ComponentMappingItem } from '@src/services/mappings/editorMappings';

// Regression test for a bug where clicking a toolbar button that only fires an
// action (e.g. opening the "add new letter" dialog, showContainer: false) required
// two clicks to work again after the dialog had been closed. Root cause: the first
// click after closing was misinterpreted as a "deselect" toggle (returning null)
// instead of re-triggering the action, because the previous selection was never
// cleared by the dialog's close handler.
describe('valueForSide', () => {
  const actionOnlyComponent: ComponentMappingItem = {
    name: 'ADD_NEW_LETTER',
    showContainer: false,
    action: () => true,
  };

  const containerComponent: ComponentMappingItem = {
    name: 'SEARCH',
    showContainer: true,
    action: () => true,
  };

  it('returns null when the new value is null', () => {
    expect(valueForSide(null, actionOnlyComponent)).toBeNull();
  });

  it('returns the new value when nothing was previously selected', () => {
    expect(valueForSide('ADD_NEW_LETTER', null)).toBe('ADD_NEW_LETTER');
  });

  it('always re-fires action-only items (showContainer: false) on repeat clicks', () => {
    // Simulates: click "new letter" button, close the resulting dialog (which does not
    // reset the selection), then click the same button again - it must re-select the
    // same value instead of toggling to null, so the dialog reopens on every click.
    expect(valueForSide('ADD_NEW_LETTER', actionOnlyComponent)).toBe('ADD_NEW_LETTER');
  });

  it('toggles off a persistent container item (showContainer: true) on repeat clicks', () => {
    expect(valueForSide('SEARCH', containerComponent)).toBeNull();
  });

  it('switches to a different persistent container item without toggling off', () => {
    expect(valueForSide('FAVOURITES', containerComponent)).toBe('FAVOURITES');
  });
});
