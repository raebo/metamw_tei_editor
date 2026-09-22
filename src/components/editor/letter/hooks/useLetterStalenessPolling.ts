import { useEffect } from 'react';
import { EditorUtils } from '@src/utils/editor';
import { PinnedLetterNotFoundError } from '@src/utils/editor/backendService';

export const LETTER_STALENESS_POLL_INTERVAL_MS = 25_000;

interface UseLetterStalenessPollingOptions {
  letterId: number | null;
  onStale: () => void;
}

export const useLetterStalenessPolling = ({
  letterId,
  onStale,
}: UseLetterStalenessPollingOptions): void => {
  useEffect(() => {
    if (letterId === null) return;

    let active = true;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    const scheduleNextPoll = () => {
      if (!active || stopped) return;
      timer = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          void poll();
        }
      }, LETTER_STALENESS_POLL_INTERVAL_MS);
    };

    const poll = async () => {
      if (!active || stopped || controller || document.visibilityState !== 'visible') return;

      controller = new AbortController();
      try {
        const staleness = await EditorUtils.backendService.fetchLetterStaleness(
          letterId,
          controller.signal,
        );
        if (active && staleness.stale) onStale();
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        if (error instanceof PinnedLetterNotFoundError) {
          stopped = true;
          return;
        }
        console.error('Could not check whether the active letter is stale.', error);
      } finally {
        controller = undefined;
        scheduleNextPoll();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || stopped) return;
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
      void poll();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (document.visibilityState === 'visible') void poll();

    return () => {
      active = false;
      if (timer !== undefined) clearTimeout(timer);
      controller?.abort();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [letterId, onStale]);
};
