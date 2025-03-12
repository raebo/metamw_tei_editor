import React, { createContext, useContext, useEffect } from 'react';
import {  useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { refreshUserData } from "./authActions";
import { AuthContextType } from "../../services/mappings/authMappings";
import { loginState } from "../../redux/slices/authentication.slice";
import { useAppDispatch } from "../../redux/hooks";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch()
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);

  // Function to refresh the user data (dispatch the async thunk)
  const refreshUser = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const refreshData = refreshUserData();

      dispatch(loginState({ user: { ...refreshData }, isAuthenticated: true, token: token } ) );
      dispatch(refreshData)
        .catch((error) => {
          console.error('Failed to refresh user data:', error);
        });
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      refreshUser();  // Dispatch the refreshUserData async thunk if a token is found
    }
  }, [dispatch]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, refreshUser }}>
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
