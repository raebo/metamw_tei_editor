import { AuthService } from '@src/services/authentication.service';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockDelete = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    isAxiosError: (error: unknown) => typeof error === 'object' && error !== null && 'isAxiosError' in error,
  },
}));

const authResponse = {
  user: {
    id: 10,
    login: 'editor.user',
    first_name: null,
    last_name: null,
    language: null,
  },
};

describe('authentication.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates and returns the canonical user response', async () => {
    mockGet.mockResolvedValue({ data: authResponse });

    await expect(AuthService.getMe()).resolves.toEqual(authResponse);
  });

  it('returns null only for the documented getMe 401 response', async () => {
    mockGet.mockRejectedValue({ isAxiosError: true, response: { status: 401 } });

    await expect(AuthService.getMe()).resolves.toBeNull();
  });

  it.each([{ isAxiosError: true, response: { status: 500 } }, new Error('network down')])(
    'propagates technical getMe failures',
    async (error) => {
      mockGet.mockRejectedValue(error);

      await expect(AuthService.getMe()).rejects.toBe(error);
    },
  );

  it('rejects malformed successful user responses', async () => {
    mockGet.mockResolvedValue({ data: { user: { id: 10, email: 'legacy@example.org' } } });

    await expect(AuthService.getMe()).rejects.toThrow();
  });

  it('propagates refresh 401, server and network failures', async () => {
    const errors = [
      { isAxiosError: true, response: { status: 401 } },
      { isAxiosError: true, response: { status: 500 } },
      new Error('network down'),
    ];

    for (const error of errors) {
      mockPost.mockRejectedValueOnce(error);
      await expect(AuthService.refresh(true)).rejects.toBe(error);
    }
  });

  it('does not call refresh when no authenticated session exists', async () => {
    await expect(AuthService.refresh(false)).resolves.toBeNull();
    expect(mockPost).not.toHaveBeenCalled();
  });
});
