import { getToken } from "./authentication.service";
import { API_URL } from "../constants/url";
import axios, { AxiosInstance } from "axios";
import { store } from "../redux/redux.store";
import { startLoading, stopLoading } from "../redux/slices/spinner.loading.slice";

const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  params?: Record<string, string | number>
) => {
  const baseURL = API_URL; // Read base URL from env
  const token = getToken()

  const queryString = params
    ? '?' +
    Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')
    : '';

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `BearerId ${token}` }),
  };


  const response = await fetch(`${baseURL}${endpoint}${queryString}`, { headers: { ...headers, ...options.headers } });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const initApi = (): AxiosInstance => {
  const _dispatch = store.dispatch
  const _axios = axios.create({
    baseURL: API_URL,
  });

  _axios.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (
      !config.headers['Content-Type'] &&
      !(config.data instanceof FormData)
    ) {
      config.headers['Content-Type'] = 'application/json';
    }

    if (config.method?.toLowerCase() === 'post') {
      config.headers['Accept'] = 'application/json';
    }

    return config;
  })

  _axios.interceptors.request.use(
    (config) => {
      _dispatch(startLoading());
      return config;
    },
    (error) => {
      _dispatch(stopLoading());
      return Promise.reject(error);
    }
  );

  _axios.interceptors.response.use(
    (response) => {
      _dispatch(stopLoading());
      return response;
    },
    (error) => {
      _dispatch(stopLoading());
      return Promise.reject(error);
    }
  );

  return _axios;
}

export default { initApi, apiRequest };
