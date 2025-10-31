import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

// @ts-ignore
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <HomePage />,
  },
]);

export default router;
