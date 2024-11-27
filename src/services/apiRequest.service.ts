import { getToken } from "./authentication.service";
import { API_URL } from "../constants/url";
import axios, { AxiosInstance } from "axios";

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

  // const response = await fetch(`${baseURL}${endpoint}${queryString}`, {
  //   ...options,
  //   headers: {
  //     ...headers,
  //     ...options.headers,
  //   },
  // });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

const initApi = (): AxiosInstance =>{
  const _axios = axios.create({
    baseURL: API_URL,
  });

  _axios.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  })

  return _axios;
}

// initApi().interceptors.request.use((config) => {
//   const token = getToken();
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

export default { initApi, apiRequest };