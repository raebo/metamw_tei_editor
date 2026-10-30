import type { AuthUserApi } from '@src/schemas/auth';

export type AuthUser = AuthUserApi;

export interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
  logout: () => Promise<void>;
}
