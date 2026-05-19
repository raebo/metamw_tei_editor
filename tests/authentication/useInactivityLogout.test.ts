import { renderHook, act } from '@testing-library/react';
import { useInactivityLogout } from '@src/hooks/useInactivityLogout';

// Redux und Router mocken
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('@src/redux/slices/authentication.slice', () => ({
  setLogoutState: jest.fn(() => ({ type: 'auth/setLogoutState' })),
}));

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();

describe('useInactivityLogout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockDispatch.mockClear();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sollte keinen Timer starten wenn nicht authentifiziert', () => {
    const { result } = renderHook(() => useInactivityLogout(false));

    act(() => {
      jest.advanceTimersByTime(31 * 60 * 1000);
    });

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(result.current.showWarning).toBe(false);
  });

  it('sollte Warning anzeigen kurz vor Timeout', () => {
    const { result } = renderHook(() => useInactivityLogout(true));

    act(() => {
      jest.advanceTimersByTime(29 * 60 * 1000); // 29 Minuten
    });

    expect(result.current.showWarning).toBe(true);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('sollte automatisch ausloggen nach Timeout', () => {
    renderHook(() => useInactivityLogout(true));

    act(() => {
      jest.advanceTimersByTime(30 * 60 * 1000); // 30 Minuten
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/setLogoutState' });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('sollte Timer zurücksetzen bei Benutzeraktivität', () => {
    const { result } = renderHook(() => useInactivityLogout(true));

    act(() => {
      jest.advanceTimersByTime(29 * 60 * 1000); // kurz vor Warning
    });

    expect(result.current.showWarning).toBe(true);

    // Benutzer klickt "Eingeloggt bleiben"
    act(() => {
      result.current.stayLoggedIn();
    });

    expect(result.current.showWarning).toBe(false);

    // Nochmal 29 Minuten warten — immer noch kein Logout
    act(() => {
      jest.advanceTimersByTime(29 * 60 * 1000);
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('sollte sofort ausloggen bei handleLogout', () => {
    const { result } = renderHook(() => useInactivityLogout(true));

    act(() => {
      result.current.handleLogout();
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/setLogoutState' });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('sollte Timer bei Maus-Aktivität zurücksetzen', () => {
    renderHook(() => useInactivityLogout(true));

    // 25 Minuten warten
    act(() => {
      jest.advanceTimersByTime(25 * 60 * 1000);
    });

    // Mausbewegung simulieren
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove'));
    });

    // Nochmal 29 Minuten — kein Logout da Timer resettet
    act(() => {
      jest.advanceTimersByTime(29 * 60 * 1000);
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
