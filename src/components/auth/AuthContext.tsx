import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useAppDispatch } from '@src/redux/hooks';
import { useNavigate } from 'react-router-dom';
import { setLoginState, setLogoutState } from '@src/redux/slices/authentication.slice';
import { AuthService } from '@src/services/authentication.service';
import type { AuthContextType, AuthUser } from '@src/services/mappings/authMappings';
import { clearPath } from '@src/redux/slices/route.slice';
import { useSelector } from 'react-redux';
import type { RootState } from '@src/redux/redux.store';
import i18n from '@src/i18n';
import { SESSION_EXPIRED_EVENT } from '@src/constants/auth';
import axios from 'axios';

export const AuthContext = createContext<AuthContextType | null>(null);

const authStateUser = (user: AuthUser) => ({
  id: user.id,
  login: user.login,
  firstName: user.first_name ?? '',
  lastName: user.last_name ?? '',
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // track fetch status

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentPath = useSelector((state: RootState) => state.route.currentPath);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setLoading(false);
      dispatch(setLogoutState());
      navigate('/login', { replace: true });
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [dispatch, navigate]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await AuthService.getMe();
        if (data === null) {
          setUser(null);
          dispatch(setLogoutState());
          return;
        }

        const { user } = data;
        setUser(user);
        dispatch(setLoginState({ user: authStateUser(user) }));
      } catch {
        // Keep the current authentication state on network and server failures. Only a
        // documented 401 is converted to null by AuthService.getMe().
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
      await i18n.changeLanguage(data.user.language ?? i18n.language);
      dispatch(setLoginState({ user: authStateUser(data.user) }));

      if (currentPath && currentPath !== '/login') {
        navigate(currentPath);
      } else {
        navigate('/');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout(isAuthenticated);
    } catch (error) {
      throw error;
    } finally {
      setUser(null);
      dispatch(setLogoutState());
      dispatch(clearPath());
      navigate('/login');
    }
  };

  const refreshUser = async () => {
    try {
      await AuthService.refresh(isAuthenticated);
      const data = await AuthService.getMe();
      if (data === null) {
        setUser(null);
        dispatch(setLogoutState());
        return;
      }

      setUser(data.user);
      dispatch(setLoginState({ user: authStateUser(data.user) }));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setUser(null);
        dispatch(setLogoutState());
      }
    } finally {
      setLoading(false);
    }
  };

  return <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
