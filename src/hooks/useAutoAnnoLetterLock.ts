import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@src/redux/hooks';
import {
  fetchAutoAnnoLetter,
  patchAutoAnnoLetterLockingUser,
} from '@src/services/auto_anno/apiAutoAnno.service';
import { setAutoAnnoLetter, setStateMessage } from '@src/redux/slices/auto.letter.snippet.slice';
import { API_URL } from '@src/constants/url';

interface UseAutoAnnoLetterLockParams {
  autoAnnoLetterId: number;
  autoAnnoJobId: number;
  userId: number | null | undefined;
}

/**
 * Acquires the server-side edit lock for an auto-anno letter on mount and releases it again
 * whenever this view stops showing that letter - via SPA unmount (route change, explicit
 * "leave") and, best-effort, via a keepalive request on tab close/reload. Without this, the
 * lock only ever got cleared by the explicit "Stand speichern" button, so navigating away any
 * other way left the letter locked to this user until someone cleared it server-side.
 */
export const useAutoAnnoLetterLock = ({
  autoAnnoLetterId,
  autoAnnoJobId,
  userId,
}: UseAutoAnnoLetterLockParams) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const hasChecked = useRef(false);
  const weHaveLockRef = useRef(false);

  useEffect(() => {
    const checkAndLockLetter = async () => {
      if (!autoAnnoLetterId || !userId || hasChecked.current) return;

      hasChecked.current = true;
      const autoAnnoLetter = await fetchAutoAnnoLetter(autoAnnoLetterId);

      if (autoAnnoLetter?.locking_user?.id && autoAnnoLetter.locking_user.id !== userId) {
        throw new Error(
          `Der Brief wird von einem anderen Benutzer (${autoAnnoLetter.locking_user.login}) bearbeitet`,
        );
      }

      await patchAutoAnnoLetterLockingUser(autoAnnoLetterId, userId);
      weHaveLockRef.current = true;

      dispatch(setAutoAnnoLetter({ letter: { id: autoAnnoLetterId, reloadStatus: true } }));
    };

    checkAndLockLetter().catch((error) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten';

      dispatch(setStateMessage({ stateMessage: { message: errorMessage, variant: 'error' } }));
      navigate(`/automatic_annotations/${autoAnnoJobId}`);
    });
  }, [dispatch, autoAnnoLetterId, userId, navigate, autoAnnoJobId]);

  useEffect(() => {
    const releaseLockOnPageHide = () => {
      if (!weHaveLockRef.current || !autoAnnoLetterId) return;

      // A regular axios PATCH is not guaranteed to complete before the tab actually
      // unloads; a keepalive fetch is the documented way to still get a request out.
      fetch(`${API_URL}/jwt/automatic_annotation_letters/${autoAnnoLetterId}/set_locking_user`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        keepalive: true,
        body: JSON.stringify({ userId: null }),
      }).catch(() => {});
    };

    window.addEventListener('beforeunload', releaseLockOnPageHide);

    return () => {
      window.removeEventListener('beforeunload', releaseLockOnPageHide);

      if (weHaveLockRef.current) {
        weHaveLockRef.current = false;
        patchAutoAnnoLetterLockingUser(autoAnnoLetterId, null).catch(() => {});
      }
    };
  }, [autoAnnoLetterId]);
};
