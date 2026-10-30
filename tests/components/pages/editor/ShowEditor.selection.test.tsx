import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import '@src/i18n';
import theme from '@src/utils/theme/theme';
import ShowEditor from '@src/components/pages/editor/ShowEditor';
import editorLetterReducer, { setEditorLetter } from '@src/redux/slices/editor.letter.slice';
import { EditorConstants } from '@src/constants/editor';
import { letterExists } from '@src/services/editor/apiLetterRequest.service';

const mockNavigate = jest.fn();
let mockRouteParams: { letterId?: string; letterName?: string } = {};

// Regression test for a bug where the left-side toolbar buttons (e.g. "Neuer Brief",
// "Suche") never visually highlighted when selected, because their `selected` prop
// compared against `selectedItemRight` - a state variable that only the *right*-side
// toolbar ever wrote to. As a side effect, the right-side toggle-off case never reset
// `selectedItemRight` either, so a right button stayed highlighted after being
// deselected. Both sides now track their own state and reset it on deselect.

// ── Mocks for everything not relevant to toolbar selection state ───────────
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockRouteParams,
}));

jest.mock('@src/services/editor/apiLetterRequest.service', () => ({
  letterExists: jest.fn().mockResolvedValue(true),
}));

jest.mock('@src/services/editor/apiPinnedLettersRequest.service', () => ({
  fetchPinnedLetters: jest.fn().mockResolvedValue([]),
}));

jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

jest.mock('@src/components/editor/letter/Center/hooks/useNoteClickHandler', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@src/components/editor/letter/Center/LetterViewContainer', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@src/components/editor/letter/Left/Search/SearchContainer', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@src/components/editor/letter/Left/Favourites/FavouritesContainer', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@src/components/editor/letter/Right/Assigned/AssignedContainer', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@src/components/editor/letter/Right/EntityCreation/EntityCreationContainer', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@src/components/editor/letter/Right/EntityPlace/EntityPlaceContainer', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@src/components/editor/letter/Right/EntityLetter/EntityLetterContainer', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@src/components/editor/letter/Dialog/EditorFormDialog', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@src/components/editor/letter/Right/UserActionMenu', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@src/components/editor/letter/Center/EditorKeyHandle', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@src/components/editor/letter/Right/QuickContentFormatter', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@src/components/auto_anno/misc/LetterFontSizeHandle', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@src/components/editor/letter/Right/EntityProtagCreation/EntityProtagCreationContainer', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@src/components/editor/letter/Right/EntityPerson/EntityPersonContainer', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@src/components/editor/letter/Left/HelpShortcuts/HelpShortcutsContainer', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@src/components/editor/letter/Right/EntityNodeInfo', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@src/components/editor/letter/Left/OnlyReadEditorPanel', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@src/components/editor/letter/Center/LetterTabs', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@src/components/editor/letter/Util/ToolbarLetterNameDisplay', () => ({
  ToolbarLetterNameDisplay: () => null,
}));

const buildStore = () => configureStore({ reducer: { editorLetter: editorLetterReducer } });

// ShowEditor renders LetterViewContainer via React.lazy() with no local Suspense
// boundary (it relies on one further up the real route tree), so the toolbar buttons
// only appear once that lazy import resolves. Waiting for them here keeps the tests
// independent of module-level lazy-import caching across test runs.
const renderShowEditor = async (configure?: (store: ReturnType<typeof buildStore>) => void) => {
  const store = buildStore();
  configure?.(store);
  const view = render(
    <ThemeProvider theme={theme}>
      <Provider store={store}>
        <ShowEditor />
      </Provider>
    </ThemeProvider>,
  );
  const toolbarButtons = () => Array.from(view.container.querySelectorAll<HTMLElement>('.MuiListItemButton-root'));
  await waitFor(() => expect(toolbarButtons().length).toBeGreaterThan(0));
  return { ...view, toolbarButtons, store };
};

const isSelected = (button: HTMLElement) => button.classList.contains('Mui-selected');

describe('ShowEditor toolbar selection highlighting', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockRouteParams = {};
    (letterExists as jest.MockedFunction<typeof letterExists>).mockResolvedValue(true);
  });

  it('navigates to not found when the exists endpoint returns false', async () => {
    mockRouteParams = { letterId: '17420', letterName: 'fmb-1840-06-06-01' };
    (letterExists as jest.MockedFunction<typeof letterExists>).mockResolvedValueOnce(false);

    await renderShowEditor();

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/not-found', {
        state: { messageKey: 'invalidLetterId' },
      }),
    );
  });

  it('reports a technical exists-check failure without treating the letter as missing', async () => {
    const { enqueueSnackbar } = jest.requireMock('notistack');
    mockRouteParams = { letterId: '17420', letterName: 'fmb-1840-06-06-01' };
    (letterExists as jest.MockedFunction<typeof letterExists>).mockRejectedValueOnce(new Error('Network error'));

    await renderShowEditor();

    await waitFor(() =>
      expect(enqueueSnackbar).toHaveBeenCalledWith(
        'The letter could not be checked because of a technical error. Please try again later.',
        { variant: 'error' },
      ),
    );
    expect(mockNavigate).not.toHaveBeenCalledWith('/not-found', expect.anything());
  });

  it('shows favourites as disabled coming-soon placeholders', async () => {
    await renderShowEditor();

    expect(screen.getByRole('button', { name: 'Favourites overview' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Add letter to favourites' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows rename and discard actions while backend capabilities are unavailable', async () => {
    await renderShowEditor();

    expect(screen.getByRole('button', { name: 'Rename letter' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Discard letter' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('enables lifecycle actions from backend capabilities and opens the selected dialog', async () => {
    const { store } = await renderShowEditor((configuredStore) => {
      configuredStore.dispatch(
        setEditorLetter({
          letter: {
            id: 17420,
            name: 'fmb-1840-06-06-01',
            capabilities: {
              rename: { allowed: true, reasonCode: null },
              discard: { allowed: false, reasonCode: 'letter_already_published' },
            },
            version: 'a'.repeat(64),
          },
        }),
      );
    });

    const renameButton = screen.getByRole('button', { name: 'Rename letter' });
    const discardButton = screen.getByRole('button', { name: 'Discard letter' });
    expect(renameButton).toHaveAttribute('aria-disabled', 'false');
    expect(discardButton).toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(renameButton);
    expect(store.getState().editorLetter.dialogType).toBe(EditorConstants.dialogTypes.RENAME_LETTER);
  });

  it('highlights a left-side action button (Neuer Brief) after it is clicked', async () => {
    const { toolbarButtons } = await renderShowEditor();

    const newLetterButton = toolbarButtons()[0];
    expect(isSelected(newLetterButton)).toBe(false);

    await userEvent.click(newLetterButton);

    expect(isSelected(toolbarButtons()[0])).toBe(true);
  });

  it('toggles a left-side container button (Suche) off again on a second click', async () => {
    const { toolbarButtons } = await renderShowEditor();

    const searchButton = toolbarButtons()[1];
    await userEvent.click(searchButton);
    expect(isSelected(toolbarButtons()[1])).toBe(true);

    await userEvent.click(toolbarButtons()[1]);
    expect(isSelected(toolbarButtons()[1])).toBe(false);
  });

  it('does not cross-highlight left buttons based on right-side selection', async () => {
    const { toolbarButtons } = await renderShowEditor();

    // "Zugewiesen" (ASSIGNED) is the second right-side button, after USER_ACTIONS.
    const assignedButton = toolbarButtons()[6];
    await userEvent.click(assignedButton);

    expect(isSelected(toolbarButtons()[6])).toBe(true);
    // None of the left-side buttons must react to a right-side selection.
    toolbarButtons()
      .slice(0, 5)
      .forEach((button) => expect(isSelected(button)).toBe(false));
  });

  it('clears the right-side highlight again once a right container button is deselected', async () => {
    const { toolbarButtons } = await renderShowEditor();

    const assignedButton = toolbarButtons()[6];
    await userEvent.click(assignedButton);
    expect(isSelected(toolbarButtons()[6])).toBe(true);

    await userEvent.click(toolbarButtons()[6]);
    expect(isSelected(toolbarButtons()[6])).toBe(false);
  });
});
