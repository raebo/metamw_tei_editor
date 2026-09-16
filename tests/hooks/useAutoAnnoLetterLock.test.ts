import { renderHook, waitFor } from '@testing-library/react';
import { useAutoAnnoLetterLock } from '@src/hooks/useAutoAnnoLetterLock';
import {
  fetchAutoAnnoLetter,
  patchAutoAnnoLetterLockingUser,
} from '@src/services/auto_anno/apiAutoAnno.service';

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('@src/redux/hooks', () => ({
  useAppDispatch: () => mockDispatch,
}));

jest.mock('@src/redux/slices/auto.letter.snippet.slice', () => ({
  setAutoAnnoLetter: jest.fn((payload) => ({
    type: 'autoLetterSnippet/setAutoAnnoLetter',
    payload,
  })),
  setStateMessage: jest.fn((payload) => ({ type: 'autoLetterSnippet/setStateMessage', payload })),
}));

jest.mock('@src/services/auto_anno/apiAutoAnno.service', () => ({
  fetchAutoAnnoLetter: jest.fn(),
  patchAutoAnnoLetterLockingUser: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockDispatch = jest.fn();

const mockedFetchAutoAnnoLetter = fetchAutoAnnoLetter as jest.Mock;
const mockedPatchAutoAnnoLetterLockingUser = patchAutoAnnoLetterLockingUser as jest.Mock;

describe('useAutoAnnoLetterLock', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockDispatch.mockClear();
    mockedFetchAutoAnnoLetter.mockReset();
    mockedPatchAutoAnnoLetterLockingUser.mockReset();
    mockedPatchAutoAnnoLetterLockingUser.mockResolvedValue(true);
    global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sperrt den Brief fuer den aktuellen Benutzer, wenn niemand anderes ihn haelt', async () => {
    mockedFetchAutoAnnoLetter.mockResolvedValue({ locking_user: null });

    renderHook(() => useAutoAnnoLetterLock({ autoAnnoLetterId: 42, autoAnnoJobId: 7, userId: 1 }));

    await waitFor(() => {
      expect(mockedPatchAutoAnnoLetterLockingUser).toHaveBeenCalledWith(42, 1);
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'autoLetterSnippet/setAutoAnnoLetter',
        payload: { letter: { id: 42, reloadStatus: true } },
      }),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('sperrt nicht und navigiert weg, wenn ein anderer Benutzer den Brief bereits haelt', async () => {
    mockedFetchAutoAnnoLetter.mockResolvedValue({
      locking_user: { id: 2, login: 'andere.person' },
    });

    renderHook(() => useAutoAnnoLetterLock({ autoAnnoLetterId: 42, autoAnnoJobId: 7, userId: 1 }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/automatic_annotations/7');
    });
    expect(mockedPatchAutoAnnoLetterLockingUser).not.toHaveBeenCalled();
  });

  it('gibt die Sperre beim Unmount frei, wenn sie zuvor erworben wurde', async () => {
    mockedFetchAutoAnnoLetter.mockResolvedValue({ locking_user: null });

    const { unmount } = renderHook(() =>
      useAutoAnnoLetterLock({ autoAnnoLetterId: 42, autoAnnoJobId: 7, userId: 1 }),
    );

    await waitFor(() => {
      expect(mockedPatchAutoAnnoLetterLockingUser).toHaveBeenCalledWith(42, 1);
    });
    mockedPatchAutoAnnoLetterLockingUser.mockClear();

    unmount();

    expect(mockedPatchAutoAnnoLetterLockingUser).toHaveBeenCalledWith(42, null);
  });

  it('ruft beim Unmount keine Freigabe auf, wenn die Sperre nie erworben wurde', async () => {
    mockedFetchAutoAnnoLetter.mockResolvedValue({
      locking_user: { id: 2, login: 'andere.person' },
    });

    const { unmount } = renderHook(() =>
      useAutoAnnoLetterLock({ autoAnnoLetterId: 42, autoAnnoJobId: 7, userId: 1 }),
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });

    unmount();

    expect(mockedPatchAutoAnnoLetterLockingUser).not.toHaveBeenCalled();
  });

  it('sendet beim beforeunload-Event eine Keepalive-Anfrage zur Freigabe der Sperre', async () => {
    mockedFetchAutoAnnoLetter.mockResolvedValue({ locking_user: null });

    renderHook(() => useAutoAnnoLetterLock({ autoAnnoLetterId: 42, autoAnnoJobId: 7, userId: 1 }));

    await waitFor(() => {
      expect(mockedPatchAutoAnnoLetterLockingUser).toHaveBeenCalledWith(42, 1);
    });

    window.dispatchEvent(new Event('beforeunload'));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/jwt/automatic_annotation_letters/42/set_locking_user'),
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
        keepalive: true,
        body: JSON.stringify({ userId: null }),
      }),
    );
  });
});
