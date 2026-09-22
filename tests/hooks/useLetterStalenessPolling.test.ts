import { act, renderHook } from '@testing-library/react';
import { EditorUtils } from '@src/utils/editor';
import { PinnedLetterNotFoundError } from '@src/utils/editor/backendService';
import {
  LETTER_STALENESS_POLL_INTERVAL_MS,
  useLetterStalenessPolling,
} from '@src/components/editor/letter/hooks/useLetterStalenessPolling';

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('useLetterStalenessPolling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('polls immediately and waits for a running request before scheduling the next one', async () => {
    let resolveRequest: ((value: { stale: boolean; letterUpdatedAt: null }) => void) | undefined;
    const request = new Promise<{ stale: boolean; letterUpdatedAt: null }>((resolve) => {
      resolveRequest = resolve;
    });
    const fetchStaleness = jest
      .spyOn(EditorUtils.backendService, 'fetchLetterStaleness')
      .mockReturnValue(request);

    renderHook(() => useLetterStalenessPolling({ letterId: 7, onStale: jest.fn() }));
    expect(fetchStaleness).toHaveBeenCalledTimes(1);

    act(() => jest.advanceTimersByTime(LETTER_STALENESS_POLL_INTERVAL_MS * 2));
    expect(fetchStaleness).toHaveBeenCalledTimes(1);

    resolveRequest?.({ stale: false, letterUpdatedAt: null });
    await flushPromises();
    act(() => jest.advanceTimersByTime(LETTER_STALENESS_POLL_INTERVAL_MS));
    expect(fetchStaleness).toHaveBeenCalledTimes(2);
  });

  it('discards a late response after switching letters', async () => {
    let resolveOldRequest: ((value: { stale: boolean; letterUpdatedAt: null }) => void) | undefined;
    const oldRequest = new Promise<{ stale: boolean; letterUpdatedAt: null }>((resolve) => {
      resolveOldRequest = resolve;
    });
    const onStale = jest.fn();
    jest
      .spyOn(EditorUtils.backendService, 'fetchLetterStaleness')
      .mockImplementation((letterId) =>
        letterId === 7 ? oldRequest : Promise.resolve({ stale: false, letterUpdatedAt: null }),
      );

    const { rerender } = renderHook(
      ({ letterId }) => useLetterStalenessPolling({ letterId, onStale }),
      {
        initialProps: { letterId: 7 as number | null },
      },
    );
    rerender({ letterId: 8 });
    await flushPromises();

    resolveOldRequest?.({ stale: true, letterUpdatedAt: null });
    await flushPromises();
    expect(onStale).not.toHaveBeenCalled();
  });

  it('stops permanently for the active letter after a 404', async () => {
    const fetchStaleness = jest
      .spyOn(EditorUtils.backendService, 'fetchLetterStaleness')
      .mockRejectedValue(new PinnedLetterNotFoundError());

    renderHook(() => useLetterStalenessPolling({ letterId: 7, onStale: jest.fn() }));
    await flushPromises();
    act(() => jest.advanceTimersByTime(LETTER_STALENESS_POLL_INTERVAL_MS * 2));

    expect(fetchStaleness).toHaveBeenCalledTimes(1);
  });

  it('resumes with an immediate poll when the document becomes visible', async () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    const fetchStaleness = jest
      .spyOn(EditorUtils.backendService, 'fetchLetterStaleness')
      .mockResolvedValue({ stale: false, letterUpdatedAt: null });

    renderHook(() => useLetterStalenessPolling({ letterId: 7, onStale: jest.fn() }));
    expect(fetchStaleness).not.toHaveBeenCalled();

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(fetchStaleness).toHaveBeenCalledTimes(1);
    await flushPromises();
  });
});
