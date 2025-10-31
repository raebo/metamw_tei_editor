import { API_ENDPOINTS } from '@src/constants/url';
import axios from 'axios';
import { initApi } from '@src/services/apiRequest.service';

export const AuthService = {
  async getMe() {
    const response = await initApi().get(`${API_ENDPOINTS.AUTH}/me`, {
      withCredentials: true,
    });
    return response.data;
  },

  async login(email: string, password: string) {
    const response = await axios.post(
      `${API_ENDPOINTS.AUTH}/login`,
      { email, password },
      { withCredentials: true },
    );
    return response.data;
  },

  async logout() {
    const response = await axios.delete(`${API_ENDPOINTS.AUTH}/logout`, {
      withCredentials: true,
    });

    return response.data;
  },

  async refresh() {
    const response = await axios.post(
      `${API_ENDPOINTS.AUTH}/refresh`,
      {},
      { withCredentials: true },
    );
    return response.data;
  },
};
