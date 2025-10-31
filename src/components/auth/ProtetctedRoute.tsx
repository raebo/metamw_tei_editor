import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@src/components/auth/AuthContext';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // You can render a loader or a splash screen while checking auth state
    return <div>Loading...</div>;
  }

  if (!user) {
    // Not logged in → redirect to login page
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
