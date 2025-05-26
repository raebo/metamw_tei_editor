// import './App.css';
import { createTheme, ThemeProvider } from "@mui/material";
import Snackbar from "./components/snackbar/Snackbar";
import Layout from "./components/layout/Layout";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import NotFoundPage from "./components/pages/NotFoundPage";
import HomePage from "./components/pages/HomePage";
import AboutPage from "./components/pages/AboutPage";
import Login from "./components/auth/Login";
import { useSelector } from "react-redux";
import { RootState } from "./redux/redux.store";
import AutoAnnoLayout from "./components/layout/AutoAnnoLayout";
import AutoAnnoList from "./components/auto_anno/AutoAnnoList";
import Guard from "./components/auth/Guard";
import React from "react";
import CircularIndeterminate from "./components/support/CircularIndeterminate";
const AutoAnnoLetters = React.lazy(() =>
  import("./components/auto_anno/AutoAnnoLetters").catch((err) => {
    console.error("Failed to load chunk for AutoAnnoLetters", err);
    window.location.reload(); // oder Redirect zur Startseite
    return new Promise(() => {});
  })
)
const IndexLetters = React.lazy(() =>
  import("./components/pages/editor/IndexLetters").catch((err) => {
  console.error("Failed to load chunk for IndexLetters", err);
  window.location.reload(); // oder Redirect zur Startseite
  return new Promise(() => {});
})
)
const ShowEditor = React.lazy(() =>
  import("./components/pages/editor/ShowEditor").catch((err) => {
  console.error("Failed to load chunk for ShowEditor", err);
  window.location.reload(); // oder Redirect zur Startseite
  return new Promise(() => {});
})
)
import { AuthProvider } from "./components/auth/AuthContext";
import GitInfo from "./components/misc/GitInfo";

import './extensions'
import StateMessages from "./components/snackbar/StateMessages";
import ErrorBoundary from "./components/support/ErrorBoundary";

const lightTheme = createTheme({
  palette: {
    mode: 'light'
  }
})

const App = () => {
  const isLoading = useSelector((state: RootState) => state.spinnerLoading.isLoading);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={lightTheme}>
        <AuthProvider>
          <BrowserRouter>
            <Guard>
              <Routes>
                <Route path="/">
                  <Route element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="about" element={<AboutPage />} />
                    <Route path="login" element={<Login />} />
                    <Route path={"/automatic_annotations/:id?"} element={<AutoAnnoList />} />
                    <Route path={"/automatic_annotations/:job_id/letters/:id"} element={<AutoAnnoLetters />} />
                    <Route path={"/editor/letters"} element={<IndexLetters />} />
                    <Route path={"/editor/"} element={<ShowEditor />} />
                    <Route path={"/editor/letters/:letterId/:letterName"} element={<ShowEditor />} />
                  </Route>
                  <Route element={<AutoAnnoLayout/>}>
                    {/*<GuardedRoute path="/dashboard" component={Dashboard} auth={isAuthenticated} />*/}
                  </Route>
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Guard>
          </BrowserRouter>
        </AuthProvider>
        { isLoading && <CircularIndeterminate />}
        <StateMessages />
        <Snackbar />
        <GitInfo />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
