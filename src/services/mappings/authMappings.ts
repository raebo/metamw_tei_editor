export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
  logout: () => Promise<void>;
}
