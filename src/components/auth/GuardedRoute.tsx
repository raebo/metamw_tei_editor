import React from 'react';
import { Route, Navigate } from 'react-router-dom';

interface GuardedRouteProps {
  component: React.ComponentType<any>;
  auth: boolean;
  path: string;
}

const GuardedRoute: React.FC<GuardedRouteProps> = ({ component: Component, auth, path }) => {
  return auth ? (
    <Route path={path} element={<Component />} />
  ) : (
    <Navigate to="/" replace />
  );
};

export default GuardedRoute;