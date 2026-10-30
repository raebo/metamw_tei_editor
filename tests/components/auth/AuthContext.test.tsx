import React, { useContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthContext, AuthProvider } from '@src/components/auth/AuthContext';
import { AuthService } from '@src/services/authentication.service';

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@src/redux/hooks', () => ({
  useAppDispatch: () => mockDispatch,
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({ route: { currentPath: null }, auth: { isAuthenticated: true } }),
}));

jest.mock('@src/services/authentication.service', () => ({
  AuthService: {
    getMe: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refresh: jest.fn(),
  },
}));

jest.mock('@src/i18n', () => ({
  __esModule: true,
  default: { language: 'de', changeLanguage: jest.fn() },
}));

const mockGetMe = AuthService.getMe as jest.MockedFunction<typeof AuthService.getMe>;

const AuthProbe = () => {
  const context = useContext(AuthContext);
  if (!context) return null;

  return <div>{context.loading ? 'loading' : (context.user?.login ?? 'no-user')}</div>;
};

const renderProvider = () =>
  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );

describe('AuthProvider initial session lookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs out only when getMe reports the documented missing session', async () => {
    mockGetMe.mockResolvedValue(null);

    renderProvider();

    await screen.findByText('no-user');
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth/setLogoutState' }));
  });

  it('does not clear Redux authentication state on a technical getMe failure', async () => {
    mockGetMe.mockRejectedValue(new Error('network down'));

    renderProvider();

    await screen.findByText('no-user');
    expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'auth/setLogoutState' }));
  });

  it('normalizes nullable names and uses the canonical login field', async () => {
    mockGetMe.mockResolvedValue({
      user: {
        id: 10,
        login: 'editor.user',
        first_name: null,
        last_name: null,
        language: null,
      },
    });

    renderProvider();

    await screen.findByText('editor.user');
    await waitFor(() =>
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'auth/setLoginState',
        payload: {
          user: { id: 10, login: 'editor.user', firstName: '', lastName: '' },
        },
      }),
    );
  });
});
