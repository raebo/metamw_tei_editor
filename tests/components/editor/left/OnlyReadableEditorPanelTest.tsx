import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import OnlyReadEditorPanel from './OnlyReadEditorPanel';
import { fetchLetterXmlContent, fetchSearchLetters } from '@src/services/editor/apiLettersRequest.service';
import editorLetterReducer from '@src/redux/slices/editor.letter.slice';

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock('@src/services/editor/apiLettersRequest.service');
jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));
jest.mock('@src/components/editor/letter/Center/LetterViewContainer/XmlDisplayParser', () => ({
  __esModule: true,
  default: ({ xmlString }: { xmlString: string }) => <div data-testid="xml-parser">{xmlString}</div>,
}));

const mockFetchSearchLetters = fetchSearchLetters as jest.MockedFunction<typeof fetchSearchLetters>;
const mockFetchLetterXmlContent = fetchLetterXmlContent as jest.MockedFunction<typeof fetchLetterXmlContent>;

// ── Hilfsfunktionen ────────────────────────────────────────────────────────
const MOCK_LETTERS = [
  { id: 1, name: 'Brief A', entityDisplayName: 'Brief A' },
  { id: 2, name: 'Brief B', entityDisplayName: 'Brief B' },
];

const XML_CONTENT = '<root><letter>Test</letter></root>';

const buildStore = (onlyReadableLetter = null) =>
  configureStore({
    reducer: { editorLetter: editorLetterReducer },
    preloadedState: {
      editorLetter: {
        onlyReadableLetter,
      },
    },
  });

const renderComponent = (store = buildStore()) =>
  render(
    <Provider store={store}>
      <OnlyReadEditorPanel />
    </Provider>
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
        expect(screen.getByText('Brief A')).toBeInTheDocument();
        expect(screen.getByText('Brief B')).toBeInTheDocument();
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

      await waitFor(() => screen.getByText('Brief A'));
      await userEvent.click(screen.getByText('Brief A'));

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
      await waitFor(() => screen.getByText('Brief A'));
      await userEvent.click(screen.getByText('Brief A'));

      await waitFor(() => {
        const state = store.getState().editorLetter.onlyReadableLetter;
        expect(state?.id).toBe(1);
        expect(state?.name).toBe('Brief A');
        expect(state?.xmlContent).toBe(XML_CONTENT);
      });
    });

    it('zeigt Fehlermeldung wenn kein XML-Inhalt gefunden', async () => {
      const { enqueueSnackbar } = require('notistack');
      mockFetchSearchLetters.mockResolvedValue(MOCK_LETTERS);
      mockFetchLetterXmlContent.mockResolvedValue(null);
      renderComponent();

      const input = screen.getByLabelText('Briefname oder -titel eingeben');
      await userEvent.type(input, 'Br');
      await waitFor(() => screen.getByText('Brief A'));
      await userEvent.click(screen.getByText('Brief A'));

      await waitFor(() => {
        expect(enqueueSnackbar).toHaveBeenCalledWith(
          'Fehler: Kein XML-Inhalt gefunden',
          { variant: 'error' }
        );
      });
    });

    it('zeigt Fehlermeldung bei API-Fehler', async () => {
      const { enqueueSnackbar } = require('notistack');
      mockFetchSearchLetters.mockResolvedValue(MOCK_LETTERS);
      mockFetchLetterXmlContent.mockRejectedValue(new Error('Netzwerkfehler'));
      renderComponent();

      const input = screen.getByLabelText('Briefname oder -titel eingeben');
      await userEvent.type(input, 'Br');
      await waitFor(() => screen.getByText('Brief A'));
      await userEvent.click(screen.getByText('Brief A'));

      await waitFor(() => {
        expect(enqueueSnackbar).toHaveBeenCalledWith('Netzwerkfehler', { variant: 'error' });
      });
    });
  });

});
