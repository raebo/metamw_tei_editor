import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ShowButtons from '@src/components/auto_anno/snippet_form/ShowButtons';
import autoLetterSnippetReducer, {
  setAutoAnnoSnippet,
} from '@src/redux/slices/auto.letter.snippet.slice';
import {
  fetchAutoAnnoSnippetEntityData,
  setAnnoSnippetEntity,
  setAutoAnnoSnippetStatus,
  updateAnnoLetterContent,
} from '@src/services/auto_anno/apiAutoAnno.service';

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock('@src/services/auto_anno/apiAutoAnno.service');
jest.mock('@src/utils/auto_anno/domHandling', () => ({
  autoAnnoReplaceDomNodeContent: jest.fn(),
  removeMarkedSpans: jest.fn((el: Element) => el),
  removeSnippetEntityFromDom: jest.fn(),
  transformLetterXmlForExport: jest.fn(() => '<xml/>'),
}));
jest.mock('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}));

const mockSetAutoAnnoSnippetStatus = setAutoAnnoSnippetStatus as jest.MockedFunction<
  typeof setAutoAnnoSnippetStatus
>;
const mockUpdateAnnoLetterContent = updateAnnoLetterContent as jest.MockedFunction<
  typeof updateAnnoLetterContent
>;
const mockSetAnnoSnippetEntity = setAnnoSnippetEntity as jest.MockedFunction<
  typeof setAnnoSnippetEntity
>;
const mockFetchAutoAnnoSnippetEntityData = fetchAutoAnnoSnippetEntityData as jest.MockedFunction<
  typeof fetchAutoAnnoSnippetEntityData
>;

// ── Helpers ────────────────────────────────────────────────────────────────
const buildStore = () => {
  const store = configureStore({ reducer: { autoLetterSnippet: autoLetterSnippetReducer } });
  store.dispatch(
    setAutoAnnoSnippet({
      snippet: {
        id: 1,
        xmlId: 'snippet-1',
        referenceName: 'Name',
        referenceKey: 'key-1',
        referenceType: 'person',
        referenceNameChanged: 'Name',
        referenceKeyChanged: 'key-1', // truthy -> "Übernehmen" button is enabled
        referenceTypeChanged: 'person',
      },
    }),
  );
  return store;
};

const renderComponent = () => {
  // handleRejectSnippet/handleAcceptSnippet query `#letterXml` from the real document.
  document.body.innerHTML = '<div id="letterXml"></div>';
  render(
    <Provider store={buildStore()}>
      <ShowButtons autoJobLetterId={42} />
    </Provider>,
  );
};

// ── Tests ──────────────────────────────────────────────────────────────────
describe('ShowButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchAutoAnnoSnippetEntityData.mockResolvedValue({} as never);
  });

  // Regression test for a bug found while auditing dead code: handleOpenDialog (the only
  // place that ever called setDialogOpen(true)) was never invoked by either action button,
  // so SnippetFormDialog could never open and "Verwerfen"/"Übernehmen" fired immediately
  // instead of asking for confirmation first.
  it('asks for confirmation before rejecting a snippet, instead of rejecting immediately', async () => {
    renderComponent();

    await userEvent.click(screen.getByRole('button', { name: 'Verwerfen' }));

    expect(screen.getByText('Auszeichnung Löschen')).toBeInTheDocument();
    expect(mockSetAutoAnnoSnippetStatus).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }));

    // SnippetFormDialog fires handleClickSubmit without awaiting it, so the async chain in
    // handleRejectSnippet keeps running after the click event itself has settled.
    await waitFor(() => expect(mockUpdateAnnoLetterContent).toHaveBeenCalledTimes(1));
    expect(mockSetAutoAnnoSnippetStatus).toHaveBeenCalledWith(42, 1, 'REJECTED');
  });

  it('asks for confirmation before accepting a snippet, instead of accepting immediately', async () => {
    renderComponent();

    await userEvent.click(screen.getByRole('button', { name: 'Übernehmen' }));

    expect(screen.getByText('Auszeichnung Übernehmen')).toBeInTheDocument();
    expect(mockSetAnnoSnippetEntity).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(mockSetAnnoSnippetEntity).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(mockSetAutoAnnoSnippetStatus).toHaveBeenCalledWith(42, 1, 'ACCEPTED'),
    );
  });

  it('does not reject or accept when the confirmation dialog is cancelled', async () => {
    renderComponent();

    await userEvent.click(screen.getByRole('button', { name: 'Verwerfen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));

    await waitFor(() => expect(screen.queryByText('Auszeichnung Löschen')).not.toBeInTheDocument());
    expect(mockSetAutoAnnoSnippetStatus).not.toHaveBeenCalled();
    expect(mockUpdateAnnoLetterContent).not.toHaveBeenCalled();
  });
});
