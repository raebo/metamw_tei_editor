import { EditorUtils } from '@src/utils/editor';

describe('pinnedLetters', () => {
  it('reuses an existing pinned entry instead of adding an unpinned duplicate', () => {
    const result = EditorUtils.pinnedLetters.computeNewPinnedLetters(
      [
        {
          id: 7,
          name: 'gb-1842-02-01-01',
          contentChanged: true,
          isPinned: true,
          viewMode: 'CODE',
          capabilities: null,
          version: 'a'.repeat(64),
        },
      ],
      {
        id: 7,
        name: 'gb-1842-02-01-01',
        isPinned: null,
        viewMode: 'WYSIWYG',
      },
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 7,
        isPinned: true,
        contentChanged: true,
        viewMode: 'WYSIWYG',
      }),
    );
  });

  it('removes stale previews and duplicate pinned entries when opening a letter', () => {
    const result = EditorUtils.pinnedLetters.computeNewPinnedLetters(
      [
        {
          id: 7,
          name: 'gb-1842-02-01-01',
          contentChanged: false,
          isPinned: false,
          viewMode: 'WYSIWYG',
          capabilities: null,
          version: null,
        },
        {
          id: 7,
          name: 'gb-1842-02-01-01',
          contentChanged: false,
          isPinned: true,
          viewMode: 'WYSIWYG',
          capabilities: null,
          version: null,
        },
        {
          id: 7,
          name: 'gb-1842-02-01-01',
          contentChanged: false,
          isPinned: true,
          viewMode: 'WYSIWYG',
          capabilities: null,
          version: null,
        },
        {
          id: 8,
          name: 'fmb-1801-06-06-01',
          contentChanged: false,
          isPinned: true,
          viewMode: 'WYSIWYG',
          capabilities: null,
          version: null,
        },
      ],
      {
        id: 9,
        name: 'gb-1801-06-06-06',
        isPinned: true,
        viewMode: 'WYSIWYG',
      },
    );

    expect(result.map((letter) => letter.id)).toEqual([9, 7, 8]);
    expect(new Set(result.map((letter) => letter.id)).size).toBe(result.length);
  });
});
