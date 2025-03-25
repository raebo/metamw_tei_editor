export interface AuthUser {
  id: number
  login: string
  first_name: string
  last_name: string
}

export type AuthContextType = {
  isAuthenticated: boolean;
  user: AuthUser | null;  // or whatever type you use for the user
  refreshUser: () => void;
};
