import type { PinnedLetter } from '@src/services/mappings/editorMappings';
import type { AppDispatch } from '@src/redux/redux.store';
import { EditorUtils } from '@src/utils/editor/index';
import { setEditorTabAndPinnedLettersThunk } from '@src/redux/thunks/editor.letter.thunk';

// if currentIndex is equals to index of  pinnedLetter in statePinnedLetters, it means we are closing the active tab
// so we need to set the new active tab to the left one (newTabNumber)
// if currentIndex is different, it means we are closing a non-active tab, so we can keep the current active tab
function calculateNewActiveTab(
  originalPinnedLetters: PinnedLetter[],
  updatedPinnedLetters: PinnedLetter[],
  pinnedLetter: PinnedLetter,
  currentIndex: number | null,
): number | null {
  const closingTabIndex = originalPinnedLetters.findIndex((letter) => letter.id === pinnedLetter.id);
  const isValidCurrentIndex = currentIndex !== null && currentIndex >= 0 && currentIndex < originalPinnedLetters.length;

  // No valid active tab or no tabs left
  if (!isValidCurrentIndex || updatedPinnedLetters.length === 0) {
    return null;
  }

  // Closing the active tab
  if (closingTabIndex === currentIndex) {
    return EditorUtils.letterTabs.newTabNumber(currentIndex);
  }

  // Closing a tab to the left of active tab
  if (closingTabIndex < currentIndex) {
    return currentIndex - 1;
  }

  // Closing a tab to the right of active tab - keep current index
  return currentIndex;
}

export const letterTabs = {
  removePinnedLetter: (pinnedLetters: PinnedLetter[], letterId: number): PinnedLetter[] => {
    return pinnedLetters.filter((letter) => letter.id !== letterId);
  },
  newTabNumber: (tabNumber: number): number => {
    return tabNumber === 0 ? 0 : tabNumber - 1;
  },
  hasUnsavedChanges: (pinnedLetter: PinnedLetter): boolean => {
    return pinnedLetter.contentChanged;
  },
  tabIndex: (pinnedLetters: PinnedLetter[], letterId: number): number => {
    return pinnedLetters.findIndex((letter) => letter.id === letterId);
  },
  removeStateTab: (dispatch: AppDispatch, statePinnedLetters: PinnedLetter[], pinnedLetter: PinnedLetter, currentIndex: number): void => {
    const updatedPinnedLetters = EditorUtils.letterTabs.removePinnedLetter(statePinnedLetters, pinnedLetter.id);

    const newActiveTab = calculateNewActiveTab(statePinnedLetters, updatedPinnedLetters, pinnedLetter, currentIndex);

    dispatch(
      setEditorTabAndPinnedLettersThunk({
        pinnedLetters: updatedPinnedLetters,
        tabNumber: newActiveTab === null ? -1 : newActiveTab,
      }),
    );
  },
  updatePinnedLetterStatus: (pinnedLetters: PinnedLetter[], letterId: number, isPinned: boolean): PinnedLetter[] => {
    return pinnedLetters.map((letter) => (letter.id === letterId ? { ...letter, isPinned: isPinned } : letter));
  },
};
