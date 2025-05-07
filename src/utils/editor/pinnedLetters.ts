import { PinnedLetter } from '../../services/mappings/editorMappings';

export const pinnedLetters = {
  computeNewPinnedLetters: (
    statePinnedLetters: PinnedLetter[],
    newLetter: { id: number, name: string, isPinned: boolean | null, viewMode: "CODE" | "WYSIWYG" | null }
  ): PinnedLetter[] => {

    const setIsPinned = newLetter.isPinned === null ? false : newLetter.isPinned;

    const newEntry = { ...newLetter, isPinned: setIsPinned, contentChanged: false };

    if (statePinnedLetters.length == 0 ) {
      return [newEntry];
    }

  const [firstLetter, ...rest] = statePinnedLetters;

  if (firstLetter.isPinned) {
    return [newEntry, ...statePinnedLetters];
  }

  return [newEntry, ...rest];
  }
}
