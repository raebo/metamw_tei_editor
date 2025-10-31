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

export const initApi = (): AxiosInstance => {
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
          await AuthService.refresh(); // calls /jwt/auth/refresh
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

export default { initApi, apiRequest };
