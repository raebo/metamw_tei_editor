import { PinnedLetter } from '@src/services/mappings/editorMappings';
import type { LetterCapabilities } from '@src/schemas/editorLetterLifecycle';

export const pinnedLetters = {
  computeNewPinnedLetters: (
    statePinnedLetters: PinnedLetter[],
    newLetter: {
      id: number;
      name: string;
      isPinned: boolean | null;
      viewMode: 'CODE' | 'WYSIWYG' | null;
      capabilities?: LetterCapabilities | null;
      version?: string | null;
    },
  ): PinnedLetter[] => {
    const setIsPinned = newLetter.isPinned === null ? false : newLetter.isPinned;

    const newEntry: PinnedLetter = {
      ...newLetter,
      isPinned: setIsPinned,
      contentChanged: false,
      capabilities: newLetter.capabilities ?? null,
      version: newLetter.version ?? null,
    };
    const existingPinnedEntry = statePinnedLetters.find((letter) => letter.id === newLetter.id && letter.isPinned);
    const activeEntry: PinnedLetter = existingPinnedEntry
      ? {
          ...existingPinnedEntry,
          name: newEntry.name,
          viewMode: newEntry.viewMode,
          capabilities: newEntry.capabilities ?? existingPinnedEntry.capabilities,
          version: newEntry.version ?? existingPinnedEntry.version,
        }
      : newEntry;
    const seenIds = new Set<number>([activeEntry.id]);
    const remainingPinnedLetters = statePinnedLetters.filter((letter) => {
      if (!letter.isPinned || seenIds.has(letter.id)) return false;
      seenIds.add(letter.id);
      return true;
    });

    return [activeEntry, ...remainingPinnedLetters];
  },
};
