import React, { createContext, useContext, useEffect } from 'react';
import {  useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { AuthContextType } from "../../services/mappings/authMappings";
import { loginState, logoutState } from "../../redux/slices/authentication.slice";
import { useAppDispatch } from "../../redux/hooks";
import { getMe } from "../../services/user.service";
import { AUTH_TOKEN_NAME } from "../../utils/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch()
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);
  const authToken = localStorage.getItem(AUTH_TOKEN_NAME);

  const refreshUser = () => {
    getMe().then((userData) => {
      dispatch(loginState( { user: userData, isAuthenticated: true, token: authToken} ))

    }).catch(() => {
      dispatch(logoutState());
      window.location.href = "/login";
    })
  };

  useEffect(() => {
    if (!authToken) {
      dispatch(logoutState());
      return;
    }

    refreshUser();
  }, [dispatch]);

  return (
    <AuthContext.Provider value={ { isAuthenticated, user, refreshUser } }>
      <>
        {children}
      </>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
