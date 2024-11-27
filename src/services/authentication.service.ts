import axios from 'axios';
import { authenticatedVar } from "../constants/authenticated";
import { useEffect, useState } from "react";
import useReactiveVar from "../utils/makeReactiveVar";

const API_URL = 'https://your-api-url.com'; // Replace with your API endpoint

export const getToken = () => localStorage.getItem('authToken');

export const setToken = (token: string) => {
  localStorage.setItem('authToken', token);
}

export const removeToken = () => {
  localStorage.removeItem('authToken');
}

export const useAuthToken = () => {
  const [isTokenAvailable, setIsTokenAvailable] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsTokenAvailable(true);

    } else {
      setIsTokenAvailable(false);
    }
  }, [setIsTokenAvailable]); // Run this only once when the component mounts

  return isTokenAvailable;
};

// Axios instance with Authorization header


// export const login = async (username: string, password: string) => {
//   const response = await api.post('/auth/login', { username, password });
//   setToken(response.data.token);
//   return response.data;
// };

// export const logout = () => {
//   authenticatedVar.set(false);
// };

// export default api;
