import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import OnlyReadEditorPanel from '@src/components/editor/letter/Left/OnlyReadEditorPanel';
import {
  fetchLetterXmlContent,
  fetchSearchLetters,
} from '@src/services/editor/apiLettersRequest.service';
import editorLetterReducer from '@src/redux/slices/editor.letter.slice';
import authReducer from '@src/redux/slices/authentication.slice';
import type { EditorLetter } from '@src/services/mappings/editorMappings';

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock('@src/services/editor/apiLettersRequest.service');
jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));
jest.mock('@src/components/editor/letter/Center/LetterViewContainer/XmlDisplayParser', () => ({
  __esModule: true,
  default: ({ xmlString }: { xmlString: string }) => (
    <div data-testid="xml-parser">{xmlString}</div>
  ),
}));

const mockFetchSearchLetters = fetchSearchLetters as jest.MockedFunction<typeof fetchSearchLetters>;
const mockFetchLetterXmlContent = fetchLetterXmlContent as jest.MockedFunction<
  typeof fetchLetterXmlContent
>;

// ── Helpers ────────────────────────────────────────────────────────────────
const buildLetter = (id: number, name: string): EditorLetter => ({
  id,
  name,
  title: name,
  lastUpdatedByName: 'Tester',
  lastUpdatedById: 1,
  updatedAt: new Date('2024-01-01'),
  xmlContent: undefined,
});

const MOCK_LETTERS: EditorLetter[] = [buildLetter(1, 'Brief A'), buildLetter(2, 'Brief B')];

const XML_CONTENT = '<root><letter>Test</letter></root>';

const buildStore = (
  onlyReadableLetter: {
    id: number | null;
    name: string | null;
    xmlContent: string | null;
  } = { id: null, name: null, xmlContent: null },
) => {
  // Start from the reducer's own default state instead of duplicating its shape here, so this
  // test doesn't need to change every time the slice gains/loses a field.
  const defaultState = editorLetterReducer(undefined, { type: '@@INIT' });

  return configureStore({
    reducer: { editorLetter: editorLetterReducer, auth: authReducer },
    preloadedState: {
      editorLetter: {
        ...defaultState,
        onlyReadableLetter,
      },
    },
  });
};

const renderComponent = (store = buildStore()) =>
  render(
    <Provider store={store}>
      <OnlyReadEditorPanel />
    </Provider>,
  );

// HighlightedText (see the XSS fix) renders the matched substring in its own <span>, splitting
// e.g. "Brief A" into a <span>Br</span> + "ief A" text sibling. Neither getByText's default
// single-node matching nor getByRole's accessible-name computation reliably reconstructs that
// split text in jsdom, so match directly against the option element's full textContent instead.
const getOptionByName = (name: string) =>
  screen.getByText(
    (_, element) => element?.getAttribute('role') === 'option' && element.textContent === name,
  );

// ── Tests ──────────────────────────────────────────────────────────────────
describe('OnlyReadEditorPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -- Mount ----------------------------------------------------------------
  describe('beim Mounten', () => {
    it('rendert die Suchmaske', () => {
      renderComponent();
      expect(screen.getByText('Brief für Leseansicht auswählen')).toBeInTheDocument();
      expect(screen.getByLabelText('Briefname oder -titel eingeben')).toBeInTheDocument();
    });

    it('setzt den Fokus auf das Autocomplete-Feld', () => {
      renderComponent();
      const input = screen.getByLabelText('Briefname oder -titel eingeben');
      expect(document.activeElement).toBe(input);
    });

    it('stellt gespeicherten Redux-State wieder her', () => {
      const store = buildStore({
        id: 1,
        name: 'Brief A',
        xmlContent: XML_CONTENT,
      });
      renderComponent(store);

      expect(screen.getByDisplayValue('Brief A')).toBeInTheDocument();
      expect(screen.getByTestId('xml-parser')).toBeInTheDocument();
    });

    it('zeigt keine XML-Ansicht wenn kein State vorhanden', () => {
      renderComponent();
      expect(screen.queryByTestId('xml-parser')).not.toBeInTheDocument();
    });
  });

  // -- Suche ----------------------------------------------------------------
  describe('Suche', () => {
    it('sucht erst ab 2 Zeichen', async () => {
      renderComponent();
      const input = screen.getByLabelText('Briefname oder -titel eingeben');

      await userEvent.type(input, 'B');
      expect(mockFetchSearchLetters).not.toHaveBeenCalled();

      await userEvent.type(input, 'r');
      expect(mockFetchSearchLetters).toHaveBeenCalledWith('Br');
    });

    it('zeigt Suchergebnisse in der Dropdown-Liste', async () => {
      mockFetchSearchLetters.mockResolvedValue(MOCK_LETTERS);
      renderComponent();

      const input = screen.getByLabelText('Briefname oder -titel eingeben');
      await userEvent.type(input, 'Br');

      await waitFor(() => {
        expect(getOptionByName('Brief A')).toBeInTheDocument();
        expect(getOptionByName('Brief B')).toBeInTheDocument();
      });
    });

    it('leert die Optionen bei weniger als 2 Zeichen', async () => {
      mockFetchSearchLetters.mockResolvedValue(MOCK_LETTERS);
      renderComponent();

      const input = screen.getByLabelText('Briefname oder -titel eingeben');
      await userEvent.type(input, 'Br');
      await waitFor(() => expect(mockFetchSearchLetters).toHaveBeenCalled());

      await userEvent.clear(input);
      await userEvent.type(input, 'B');

      expect(mockFetchSearchLetters).toHaveBeenCalledTimes(1); // kein zweiter Call
    });
  });

  // -- Auswahl --------------------------------------------------------------
  describe('Briefauswahl', () => {
    it('lädt XML-Inhalt und zeigt ihn an', async () => {
      mockFetchSearchLetters.mockResolvedValue(MOCK_LETTERS);
      mockFetchLetterXmlContent.mockResolvedValue(XML_CONTENT);
      renderComponent();

      const input = screen.getByLabelText('Briefname oder -titel eingeben');
      await userEvent.type(input, 'Br');

      await waitFor(() => getOptionByName('Brief A'));
      await userEvent.click(getOptionByName('Brief A'));

      await waitFor(() => {
        expect(mockFetchLetterXmlContent).toHaveBeenCalledWith(1);
        expect(screen.getByTestId('xml-parser')).toBeInTheDocument();
      });
    });

    it('speichert den Brief im Redux Store', async () => {
      mockFetchSearchLetters.mockResolvedValue(MOCK_LETTERS);
      mockFetchLetterXmlContent.mockResolvedValue(XML_CONTENT);

      const store = buildStore();
      renderComponent(store);

      const input = screen.getByLabelText('Briefname oder -titel eingeben');
      await userEvent.type(input, 'Br');
      await waitFor(() => getOptionByName('Brief A'));
      await userEvent.click(getOptionByName('Brief A'));

      await waitFor(() => {
        const state = store.getState().editorLetter.onlyReadableLetter;
        expect(state?.id).toBe(1);
        expect(state?.name).toBe('Brief A');
        expect(state?.xmlContent).toBe(XML_CONTENT);
      });
    });

    it('zeigt Fehlermeldung wenn kein XML-Inhalt gefunden', async () => {
      const { enqueueSnackbar } = jest.requireMock('notistack');
      mockFetchSearchLetters.mockResolvedValue(MOCK_LETTERS);
      // fetchLetterXmlContent always resolves to a string; an empty one is the "nothing found"
      // case the component treats as falsy (`if (xml)`).
      mockFetchLetterXmlContent.mockResolvedValue('');
      renderComponent();

      const input = screen.getByLabelText('Briefname oder -titel eingeben');
      await userEvent.type(input, 'Br');
      await waitFor(() => getOptionByName('Brief A'));
      await userEvent.click(getOptionByName('Brief A'));

      await waitFor(() => {
        expect(enqueueSnackbar).toHaveBeenCalledWith('Fehler: Kein XML-Inhalt gefunden', {
          variant: 'error',
        });
      });
    });

    it('zeigt Fehlermeldung bei API-Fehler', async () => {
      const { enqueueSnackbar } = jest.requireMock('notistack');
      mockFetchSearchLetters.mockResolvedValue(MOCK_LETTERS);
      mockFetchLetterXmlContent.mockRejectedValue(new Error('Netzwerkfehler'));
      renderComponent();

      const input = screen.getByLabelText('Briefname oder -titel eingeben');
      await userEvent.type(input, 'Br');
      await waitFor(() => getOptionByName('Brief A'));
      await userEvent.click(getOptionByName('Brief A'));

      await waitFor(() => {
        expect(enqueueSnackbar).toHaveBeenCalledWith('Netzwerkfehler', { variant: 'error' });
      });
    });
  });
});
