import { ThemeProvider } from '@mui/material';
import Snackbar from './components/snackbar/Snackbar';
import Layout from './components/layout/Layout';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NotFoundPage from './components/pages/NotFoundPage';
import HomePage from './components/pages/HomePage';
import AboutPage from './components/pages/AboutPage';
import LoginPage from './components/pages/LoginPage';
import { useSelector } from 'react-redux';
import { RootState } from './redux/redux.store';
import AutoAnnoLayout from './components/layout/AutoAnnoLayout';
import AutoAnnoList from './components/auto_anno/AutoAnnoList';
import React from 'react';
import CircularIndeterminate from './components/support/CircularIndeterminate';

import { AuthProvider } from './components/auth/AuthContext';
import GitInfo from './components/misc/GitInfo';

import './extensions';
import StateMessages from './components/snackbar/StateMessages';
import ErrorBoundary from './components/support/ErrorBoundary';
import theme from '@src/utils/theme/theme';
import { ProtectedRoute } from '@src/components/auth/ProtetctedRoute';
import LogoutPage from '@src/components/pages/LogoutPage';
import AutoAnnoLetters from '@src/components/auto_anno/AutoAnnoLetters';
import IndexLetters from '@src/components/pages/editor/IndexLetters';
import ShowEditor from '@src/components/pages/editor/ShowEditor';

const App = () => {
  const isLoading = useSelector((state: RootState) => state.spinnerLoading.isLoading);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <Router>
          <AuthProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route index element={<HomePage />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="logout" element={<LogoutPage />} />
                  <Route path={'/automatic_annotations/:id?'} element={<AutoAnnoList />} />
                  <Route
                    path={'/automatic_annotations/:job_id/letters/:id'}
                    element={<AutoAnnoLetters />}
                  />
                  <Route path={'/editor/letters'} element={<IndexLetters />} />
                  <Route path={'/editor/'} element={<ShowEditor />} />
                  <Route path={'/editor/letters/:letterId/:letterName'} element={<ShowEditor />} />
                </Route>
              </Route>
              <Route element={<AutoAnnoLayout />}>
                {/*<GuardedRoute path="/dashboard" component={Dashboard} auth={isAuthenticated} />*/}
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </Router>
        {isLoading && <CircularIndeterminate />}
        <StateMessages />
        <Snackbar />
        <GitInfo />
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
