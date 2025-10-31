import { API_ENDPOINTS } from '@src/constants/url';
import axios from 'axios';
import { initApi } from '@src/services/apiRequest.service';

export const AuthService = {
  async getMe() {
    try {
      const response = await initApi().get(`${API_ENDPOINTS.AUTH}/me`, {
        withCredentials: true,
      });
      return response.data;
    } catch {
      return null;
    }
  },

  async login(email: string, password: string) {
    const response = await axios.post(
      `${API_ENDPOINTS.AUTH}/login`,
      { email, password },
      { withCredentials: true },
    );
    return response.data;
  },

  async logout(isAuthenticated: boolean) {
    if (!isAuthenticated) {
      return;
    }

    const response = await axios.delete(`${API_ENDPOINTS.AUTH}/logout`, {
      withCredentials: true,
    });

    return response.data;
  },

  async refresh(isAuthenticated: boolean) {
    if (!isAuthenticated) {
      return null;
    }

    try {
      const response = await axios.post(
        `${API_ENDPOINTS.AUTH}/refresh`,
        {},
        { withCredentials: true },
      );
      return response.data;
    } catch {
      return null;
    }
  },
};
