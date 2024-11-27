import React, { useEffect } from 'react';
import logo from './logo.svg';
// import './App.css';
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import Snackbar from "./components/snackbar/Snackbar";
import Layout from "./components/layout/Layout";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import NotFoundPage from "./components/pages/NotFoundPage";
import HomePage from "./components/pages/HomePage";
import AboutPage from "./components/pages/AboutPage";
import Login from "./components/auth/Login";
import { useDispatch, useSelector } from "react-redux";
import { getMe } from "./services/user.service";
import { loginState } from "./redux/slices/user.slice";
import { RootState } from "./redux/redux.store";

const lightTheme = createTheme({
  palette: {
    mode: 'light'
  }
})

const App = () => {
  const state = useSelector((state) => state);

  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);
  const handleStateLogin = (data = { last_name: new String, first_name: new String }) => {
    if (!data.first_name || !data.last_name) {
      console.error("Invalid data provided");
      return;
    }
    dispatch(loginState(data));
  };

  const refreshUserState = () => {
    const token = localStorage.getItem('authToken');
    if (token && user === null) {
      getMe()
        .then( (data)  => {
          if (data !== null) {
            // handleUserLoginState(data)
            handleStateLogin(data)
          }
        })
        .catch(err => {
          console.error('Error:', err);
        });
    }
  }
  refreshUserState()

  // useEffect(() => {
  //   const handleBeforeUnload = () => {
  //     localStorage.setItem('reduxState', JSON.stringify(state));
  //   };
  //
  //   window.addEventListener('beforeunload', handleBeforeUnload);
  //
  //   // Cleanup on component unmount
  //   return () => {
  //     window.removeEventListener('beforeunload', handleBeforeUnload);
  //   };
  // }, [state]);

  return (
    // <ApolloProvider client={client}>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="login" element={<Login />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Snackbar />
        </BrowserRouter>
      </ThemeProvider>
    // </ApolloProvider>
  );
}

export default App;
