import { startLoading, stopLoading } from '@src/redux/slices/spinner.loading.slice';
import apiRequestModule from '@src/services/apiRequest.service';

// ── Mocks ──────────────────────────────────────────────────────────────────
// Captures the interceptor handlers axios.create()'s instance was configured with, and exposes
// a callable/spy-able fake instance, without hitting any real network/axios internals.
jest.mock('axios', () => {
  const requestHandlers: { success?: any; error?: any } = {};
  const responseHandlers: { success?: any; error?: any } = {};

  const instance: any = jest.fn((config: any) => Promise.resolve({ data: 'retried', config }));
  instance.interceptors = {
    request: {
      use: (success: any, error: any) => {
        requestHandlers.success = success;
        requestHandlers.error = error;
      },
    },
    response: {
      use: (success: any, error: any) => {
        responseHandlers.success = success;
        responseHandlers.error = error;
      },
    },
  };

  return {
    __esModule: true,
    default: { create: jest.fn(() => instance) },
    __requestHandlers: requestHandlers,
    __responseHandlers: responseHandlers,
    __instance: instance,
  };
});

const mockDispatch = jest.fn();
jest.mock('@src/redux/redux.store', () => ({
  store: { dispatch: (...args: unknown[]) => mockDispatch(...args) },
}));

jest.mock('@src/services/authentication.service', () => ({
  AuthService: { refresh: jest.fn() },
}));

const axiosMock = jest.requireMock('axios') as any;
const { AuthService } = jest.requireMock('@src/services/authentication.service') as any;
const mockRefresh = AuthService.refresh as jest.Mock;

// A deferred promise lets a test control exactly when AuthService.refresh resolves/rejects, so
// concurrent 401s can be fired while a refresh is still in flight.
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('apiRequest.service / initApi', () => {
  // initApi() is a singleton (see the fix this test suite covers): calling it here once is
  // enough to register the interceptors that every other test in this file exercises.
  beforeAll(() => {
    apiRequestModule.initApi();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    axiosMock.__instance.mockImplementation((config: any) =>
      Promise.resolve({ data: 'retried', config }),
    );
  });

  it('creates the axios instance only once (single shared instance across all callers)', async () => {
    // This specific assertion needs a *fresh* module (its own unset sharedAxiosInstance cache),
    // independent from the one beforeAll() above already initialized for the rest of this file.
    jest.resetModules();
    const freshAxiosMock = jest.requireMock('axios') as any;
    const freshApiRequestModule = (await import('@src/services/apiRequest.service')).default;

    freshApiRequestModule.initApi();
    freshApiRequestModule.initApi();
    freshApiRequestModule.initApi();

    expect(freshAxiosMock.default.create).toHaveBeenCalledTimes(1);
  });

  describe('request interceptor', () => {
    it('adds JSON headers and dispatches startLoading for a GET-style request', () => {
      const config = { headers: {} as Record<string, string> };
      const result = axiosMock.__requestHandlers.success(config);

      expect(result.headers['Accept']).toBe('application/json');
      expect(result.headers['Content-Type']).toBe('application/json');
      expect(mockDispatch).toHaveBeenCalledWith(startLoading());
    });

    it('does not overwrite an already-set Content-Type header (mutation with custom content type)', () => {
      const config = { headers: { 'Content-Type': 'application/merge-patch+json' } };
      const result = axiosMock.__requestHandlers.success(config);

      expect(result.headers['Content-Type']).toBe('application/merge-patch+json');
    });

    it('does not force a JSON Content-Type for FormData payloads (e.g. file upload mutations)', () => {
      const config = { headers: {} as Record<string, string>, data: new FormData() };
      const result = axiosMock.__requestHandlers.success(config);

      expect(result.headers['Content-Type']).toBeUndefined();
    });
  });

  describe('response interceptor', () => {
    it('dispatches stopLoading and passes successful responses through unchanged', () => {
      const response = { data: { ok: true } };
      const result = axiosMock.__responseHandlers.success(response);

      expect(result).toBe(response);
      expect(mockDispatch).toHaveBeenCalledWith(stopLoading());
    });

    it('rejects gracefully when the error has no request config (e.g. a network-level error)', async () => {
      await expect(
        axiosMock.__responseHandlers.error({ response: { status: 401 } }),
      ).rejects.toEqual({ response: { status: 401 } });
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('refreshes once and retries the original request on a 401 (refresh success)', async () => {
      mockRefresh.mockResolvedValue({ ok: true });
      const originalRequest = { url: '/jwt/editor/letters/1', headers: {} };

      const result = await axiosMock.__responseHandlers.error({
        response: { status: 401 },
        config: originalRequest,
      });

      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(mockRefresh).toHaveBeenCalledWith(true);
      expect(axiosMock.__instance).toHaveBeenCalledWith(originalRequest);
      expect(result).toEqual({ data: 'retried', config: originalRequest });
    });

    it('rejects the original request when the refresh call itself fails', async () => {
      const refreshError = new Error('refresh failed');
      mockRefresh.mockRejectedValue(refreshError);
      const originalRequest = { url: '/jwt/editor/letters/1', headers: {} };

      await expect(
        axiosMock.__responseHandlers.error({
          response: { status: 401 },
          config: originalRequest,
        }),
      ).rejects.toBe(refreshError);
      expect(axiosMock.__instance).not.toHaveBeenCalled();
    });

    it('does not attempt a second refresh once a request has already been retried', async () => {
      mockRefresh.mockResolvedValue({ ok: true });
      const originalRequest = { url: '/jwt/editor/letters/1', headers: {}, _retry: true };

      await expect(
        axiosMock.__responseHandlers.error({
          response: { status: 401 },
          config: originalRequest,
        }),
      ).rejects.toEqual({ response: { status: 401 }, config: originalRequest });
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('coordinates concurrent 401s from different requests through a single refresh call, then retries every waiting request', async () => {
      const refreshDeferred = deferred<unknown>();
      mockRefresh.mockReturnValue(refreshDeferred.promise);

      const requestA = { url: '/a', headers: {} };
      const requestB = { url: '/b', headers: {} };
      const requestC = { url: '/c', headers: {} };

      // All three "requests" hit a 401 before the (still in-flight) refresh resolves.
      const resultA = axiosMock.__responseHandlers.error({
        response: { status: 401 },
        config: requestA,
      });
      const resultB = axiosMock.__responseHandlers.error({
        response: { status: 401 },
        config: requestB,
      });
      const resultC = axiosMock.__responseHandlers.error({
        response: { status: 401 },
        config: requestC,
      });

      // Give the queued (B, C) handlers a chance to register themselves before refresh resolves.
      await Promise.resolve();
      await Promise.resolve();

      expect(mockRefresh).toHaveBeenCalledTimes(1);

      refreshDeferred.resolve({ ok: true });

      await expect(resultA).resolves.toEqual({ data: 'retried', config: requestA });
      await expect(resultB).resolves.toEqual({ data: 'retried', config: requestB });
      await expect(resultC).resolves.toEqual({ data: 'retried', config: requestC });

      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(axiosMock.__instance).toHaveBeenCalledWith(requestA);
      expect(axiosMock.__instance).toHaveBeenCalledWith(requestB);
      expect(axiosMock.__instance).toHaveBeenCalledWith(requestC);
    });

    it('rejects every queued request once a coordinated refresh fails', async () => {
      const refreshDeferred = deferred<unknown>();
      mockRefresh.mockReturnValue(refreshDeferred.promise);

      const requestA = { url: '/a', headers: {} };
      const requestB = { url: '/b', headers: {} };

      const resultA = axiosMock.__responseHandlers.error({
        response: { status: 401 },
        config: requestA,
      });
      const resultB = axiosMock.__responseHandlers.error({
        response: { status: 401 },
        config: requestB,
      });

      await Promise.resolve();
      await Promise.resolve();

      const refreshError = new Error('refresh failed');
      refreshDeferred.reject(refreshError);

      await expect(resultA).rejects.toBe(refreshError);
      await expect(resultB).rejects.toBe(refreshError);
      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(axiosMock.__instance).not.toHaveBeenCalled();
    });
  });
});
