import { API_ENDPOINTS } from '@src/constants/url';
import axios from 'axios';
import { AuthMessage, AuthMessageSchema, AuthResponse, AuthResponseSchema } from '@src/schemas/auth';

export const AuthService = {
  async getMe(): Promise<AuthResponse | null> {
    try {
      const response = await axios.get(`${API_ENDPOINTS.AUTH}/me`, {
        withCredentials: true,
      });
      return AuthResponseSchema.parse(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) return null;
      throw error;
    }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await axios.post(`${API_ENDPOINTS.AUTH}/login`, { email, password }, { withCredentials: true });

    return AuthResponseSchema.parse(response.data);
  },

  async logout(isAuthenticated: boolean): Promise<AuthMessage | undefined> {
    if (!isAuthenticated) {
      return;
    }

    const response = await axios.delete(`${API_ENDPOINTS.AUTH}/logout`, {
      withCredentials: true,
    });

    return AuthMessageSchema.parse(response.data);
  },

  async refresh(isAuthenticated: boolean): Promise<AuthMessage | null> {
    if (!isAuthenticated) {
      return null;
    }

    const response = await axios.post(`${API_ENDPOINTS.AUTH}/refresh`, {}, { withCredentials: true });
    return AuthMessageSchema.parse(response.data);
  },
};
