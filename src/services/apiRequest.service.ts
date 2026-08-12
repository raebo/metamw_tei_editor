import { API_URL } from '../constants/url';
import axios, { AxiosInstance } from 'axios';
import { store } from '../redux/redux.store';
import { startLoading, stopLoading } from '../redux/slices/spinner.loading.slice';
import { AuthService } from '@src/services/authentication.service';

const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  params?: Record<string, string | number>,
) => {
  const baseURL = API_URL; // Read base URL from env

  const queryString = params
    ? '?' +
      Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    : '';

  const headers = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${baseURL}${endpoint}${queryString}`, {
    headers: { ...headers, ...options.headers },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// initApi() used to create a brand-new axios instance - with its own interceptors and its own
// isRefreshing/failedQueue closure - on every single call. Since every API function in this
// codebase calls initApi() itself, that meant every request effectively had its own private
// refresh lock: concurrent requests could never coordinate, so several parallel 401s each
// triggered their own independent refresh call instead of sharing one. Building the instance
// once and caching it here is what actually gives the refresh lock below something to
// coordinate across calls.
let sharedAxiosInstance: AxiosInstance | null = null;

const createAxiosInstance = (): AxiosInstance => {
  const _dispatch = store.dispatch;

  const _axios = axios.create({
    baseURL: API_URL,
    withCredentials: true,
  });

  // Track refresh calls to avoid multiple concurrent requests
  let isRefreshing = false;
  let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void }[] = [];

  const processQueue = (error: any, token: any = null) => {
    failedQueue.forEach((prom) => {
      if (error) prom.reject(error);
      else prom.resolve(token);
    });
    failedQueue = [];
  };

  // --- REQUEST INTERCEPTOR ---
  _axios.interceptors.request.use(
    (config) => {
      config.headers['Accept'] = 'application/json';
      if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
      }

      _dispatch(startLoading());
      return config;
    },
    (error) => {
      _dispatch(stopLoading());
      return Promise.reject(error);
    },
  );

  // --- RESPONSE INTERCEPTOR ---
  _axios.interceptors.response.use(
    (response) => {
      _dispatch(stopLoading());
      return response;
    },
    async (error) => {
      _dispatch(stopLoading());

      const originalRequest = error.config;

      // No request config (e.g. a network-level error with no associated request) - nothing to
      // retry, so bail out before touching originalRequest._retry below.
      if (!originalRequest) {
        return Promise.reject(error);
      }

      // Handle 401 Unauthorized
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // queue requests while refresh is running
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => _axios(originalRequest))
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // A 401 from a real request means the session needs refreshing regardless of what the
          // (possibly stale) Redux isAuthenticated flag currently says - unlike
          // AuthContext's own refreshUser(), this call site must not skip the request.
          await AuthService.refresh(true); // calls /jwt/auth/refresh
          processQueue(null);
          return _axios(originalRequest); // retry failed request
        } catch (refreshError) {
          processQueue(refreshError, null);

          // Optionally dispatch logout or redirect to login here
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );

  return _axios;
};

export const initApi = (): AxiosInstance => {
  if (!sharedAxiosInstance) {
    sharedAxiosInstance = createAxiosInstance();
  }
  return sharedAxiosInstance;
};

export default { initApi, apiRequest };
