import { useEffect, useState } from "react";
import { AUTH_TOKEN_NAME } from "../utils/auth";

export const getToken = () => localStorage.getItem(AUTH_TOKEN_NAME);

export const setToken = (token: string) => {
  localStorage.setItem(AUTH_TOKEN_NAME, token);
}

export const removeToken = () => {
  localStorage.removeItem(AUTH_TOKEN_NAME);
}

export const useAuthToken = () => {
  const [isTokenAvailable, setIsTokenAvailable] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_NAME);
    if (token) {
      setIsTokenAvailable(true);

    } else {
      setIsTokenAvailable(false);
    }
  }, [setIsTokenAvailable]); // Run this only once when the component mounts

  return isTokenAvailable;
};
