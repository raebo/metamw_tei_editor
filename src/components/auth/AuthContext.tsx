import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useAppDispatch } from '@src/redux/hooks';
import { useNavigate } from 'react-router-dom';
import { setLoginState, setLogoutState } from '@src/redux/slices/authentication.slice';
import { AuthService } from '@src/services/authentication.service';
import type { AuthContextType, AuthUser } from '@src/services/mappings/authMappings';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // track fetch status

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { user } = await AuthService.getMe();
        setUser(user);
        dispatch(setLoginState({ user }));
        navigate('/');
      } catch (_err) {
        // 401 means not logged in, so clear state
        setUser(null);
        dispatch(setLogoutState());
      } finally {
        setLoading(false);
      }
    };
    void fetchUser();
  }, [dispatch]);

  const login = async (email: string, password: string) => {
    try {
      const data = await AuthService.login(email, password);

      setUser(data.user);
      dispatch(
        setLoginState({
          user: {
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.first_name,
            lastName: data.user.last_name,
          },
        }),
      );
      navigate('/');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      throw error;
    } finally {
      setUser(null);
      dispatch(setLogoutState());
      navigate('/login');
    }
  };

  const refreshUser = async () => {
    try {
      await AuthService.refresh();
      const data = await AuthService.getMe();
      setUser(data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
