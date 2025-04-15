import React from 'react';
import excludedRoutes from "../../constants/excluded-routes";
import { useAuth } from "./AuthContext";
import { AUTH_TOKEN_NAME } from "../../utils/auth";
import { loginState, logoutState } from "../../redux/slices/authentication.slice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import { getMe } from "../../services/user.service";
import { useEffect } from "react";

interface GuardProps {
  children: React.ReactNode
}

export const Guard: React.FC<GuardProps> = ({ children } : GuardProps) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const user = useSelector((state: RootState) => state.auth.user);
  const token = localStorage.getItem(AUTH_TOKEN_NAME);

  useEffect(() => {
    if (!token) {
      dispatch(logoutState());
      return;
    }

    if (user === null) {
      getMe()
        .then((result) => {
          if (result) {
            dispatch(loginState({ user: result, isAuthenticated: true, token }));
          }
        })
        .catch((error) => {
          console.log("Guard getMe() error:", error);
          dispatch(logoutState());
        });
    }
  }, [dispatch, token, user]);

  if (!excludedRoutes.includes(window.location.pathname) && (!isAuthenticated && token === null)) {
    window.location.href = "/login"
    return null
  }

  return <>{children}</>;
};

export default Guard;
