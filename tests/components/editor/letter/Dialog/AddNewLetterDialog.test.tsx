import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@src/i18n';
import i18n from '@src/i18n';
import AddNewLetterDialog from '@src/components/editor/letter/Dialog/Components/AddNewLetterDialog';
import { createNewLetter } from '@src/services/editor/apiLettersRequest.service';
import { fetchMetamwLetterData } from '@src/services/auto_anno/apiMetaMw.service';
import editorLetterReducer from '@src/redux/slices/editor.letter.slice';

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock('@src/services/editor/apiLettersRequest.service');
jest.mock('@src/services/auto_anno/apiMetaMw.service');
jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

const mockCreateNewLetter = createNewLetter as jest.MockedFunction<typeof createNewLetter>;
const mockFetchMetamwLetterData = fetchMetamwLetterData as jest.MockedFunction<
  typeof fetchMetamwLetterData
>;

// ── Helpers ────────────────────────────────────────────────────────────────
const VALID_LETTER_NAME = 'FMB-2024-01-01-01';

const buildStore = () => configureStore({ reducer: { editorLetter: editorLetterReducer } });

const renderComponent = (onClose = jest.fn(), store = buildStore()) => {
  render(
    <Provider store={store}>
      <AddNewLetterDialog
        xmlDoc={document.implementation.createDocument(null, 'root')}
        onSave={jest.fn()}
        onClose={onClose}
      />
    </Provider>,
  );

  return { store, onClose };
};

const enterValidLetterName = async () => {
  const nameInput = screen.getByLabelText('Name des Briefes');
  await userEvent.type(nameInput, VALID_LETTER_NAME);
  await userEvent.tab(); // blur triggers name validation/availability check
};

const getSaveButton = () => screen.getByRole('button', { name: 'Brief Erstellen' });

// ── Tests ──────────────────────────────────────────────────────────────────
describe('AddNewLetterDialog', () => {
  beforeAll(() => {
    i18n.changeLanguage('de');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Backend response for the "is this letter name already taken" lookup (the exact-match
    // /by_name endpoint) is mocked here; null means no letter with that name exists yet.
    mockFetchMetamwLetterData.mockResolvedValue(null);
  });

  it('disables the save button as long as no letter name has been entered', () => {
    renderComponent();

    expect(getSaveButton()).toBeDisabled();
  });

  it('enables the save button once a valid, available letter name has been entered, with every other field left empty', async () => {
    renderComponent();

    await enterValidLetterName();

    await waitFor(() => expect(getSaveButton()).toBeEnabled());
    expect(mockFetchMetamwLetterData).toHaveBeenCalledWith(VALID_LETTER_NAME.toLowerCase());
  });

  it('rejects the name and keeps the save button disabled when the backend reports the letter already exists', async () => {
    mockFetchMetamwLetterData.mockResolvedValue({ id: '1', name: VALID_LETTER_NAME });

    renderComponent();

    await enterValidLetterName();

    await waitFor(() => expect(screen.getByText('Letter name already exists')).toBeInTheDocument());
    expect(getSaveButton()).toBeDisabled();
    expect(mockCreateNewLetter).not.toHaveBeenCalled();
  });

  it('rejects the name and surfaces the failure when the availability check itself fails', async () => {
    mockFetchMetamwLetterData.mockRejectedValue(new Error('network down'));

    renderComponent();

    await enterValidLetterName();

    await waitFor(() =>
      expect(
        screen.getByText('Error checking letter name availability: network down'),
      ).toBeInTheDocument(),
    );
    expect(getSaveButton()).toBeDisabled();
  });

  it('saves the letter with only the name set, leaving all other fields at their optional defaults', async () => {
    mockCreateNewLetter.mockResolvedValue({
      newLetterId: 42,
      newLetterName: VALID_LETTER_NAME,
      responseMessage: 'ok',
    });

    const { onClose } = renderComponent();

    await enterValidLetterName();
    await waitFor(() => expect(getSaveButton()).toBeEnabled());
    await userEvent.click(getSaveButton());

    await waitFor(() => expect(mockCreateNewLetter).toHaveBeenCalledTimes(1));

    const submittedState = mockCreateNewLetter.mock.calls[0][0];
    expect(submittedState.letterName).toBe(VALID_LETTER_NAME);
    expect(submittedState.letterNameComplete).toBe(true);
    // Everything besides the name must remain untouched/optional.
    expect(submittedState.writerEntity).toBeNull();
    expect(submittedState.writingPlace).toBeNull();
    expect(submittedState.receivingPlace).toBeNull();
    expect(submittedState.receivers).toEqual([]);
    expect(submittedState.prevLetter).toBeNull();
    expect(submittedState.nextLetter).toBeNull();
    expect(submittedState.letterLanguage).toEqual([]);
    expect(submittedState.editorValue).toBeNull();
    expect(submittedState.transkriptorValue).toBeNull();

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('shows an error and keeps the dialog open when the backend save call fails', async () => {
    const { enqueueSnackbar } = jest.requireMock('notistack');
    mockCreateNewLetter.mockRejectedValue(new Error('Network error'));

    const { onClose } = renderComponent();

    await enterValidLetterName();
    await waitFor(() => expect(getSaveButton()).toBeEnabled());
    await userEvent.click(getSaveButton());

    await waitFor(() => {
      expect(enqueueSnackbar).toHaveBeenCalledWith(expect.stringContaining('Network error'), {
        variant: 'error',
      });
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
