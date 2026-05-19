import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setLogoutState } from '@src/redux/slices/authentication.slice';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
const WARNING_BEFORE = 60 * 1000; // 1 Minute vorher warnen

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

export const useInactivityLogout = (isAuthenticated: boolean) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigateRef = useRef(navigate);
  const dispatchRef = useRef(dispatch);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    navigateRef.current = navigate;
    dispatchRef.current = dispatch;
  });

  const handleLogout = useCallback(() => {
    setShowWarning(false);
    dispatchRef.current(setLogoutState());
    navigateRef.current('/login');
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setShowWarning(false);

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE);

    timerRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
  }, [handleLogout]);

  // Benutzer bleibt eingeloggt — Timer neu starten
  const stayLoggedIn = useCallback(() => {
    setShowWarning(false);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!isAuthenticated) return;

    resetTimer();
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true }),
    );

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated, resetTimer]);

  return { showWarning, stayLoggedIn, handleLogout };
};
