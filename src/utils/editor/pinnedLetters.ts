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

    if (statePinnedLetters.length == 0) {
      return [newEntry];
    }

    const [firstLetter, ...rest] = statePinnedLetters;

    if (firstLetter.isPinned) {
      return [newEntry, ...statePinnedLetters];
    }

    return [newEntry, ...rest];
  },
};
