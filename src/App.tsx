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
import { loginState } from "./redux/slices/authentication.slice";
import { RootState } from "./redux/redux.store";
import Container from "@mui/material/Container";
import AutoAnnoLayout from "./components/layout/AutoAnnoLayout";
import AutoAnnoList from "./components/auto_anno/AutoAnnoList";
import Guard from "./components/auth/Guard";
import AaIndex from "./components/pages/aa_annotations/AaIndex";
import React from "react";
import CircularIndeterminate from "./components/support/CircularIndeterminate";
import AutoAnnoLetters from "./components/auto_anno/AutoAnnoLetters";
import LoadCSSFile from "./components/support/LoadCssFile";
import IndexLetters from "./components/pages/editor/IndexLetters";
import ShowLetter from "./components/pages/editor/ShowLetter";
import { AuthProvider } from "./components/auth/AuthContext";

const lightTheme = createTheme({
  palette: {
    mode: 'light'
  }
})

const App = () => {
  // const dispatch = useDispatch();
  // const user = useSelector((state: RootState) => state.auth.user);
  // // eslint-disable-next-line no-new-wrappers
  // const handleStateLogin = (data = { last_name: new String(), first_name: new String() }) => {
  //   if (!data.first_name || !data.last_name) {
  //     console.error("Invalid data provided");
  //     return;
  //   }
  //   dispatch(loginState(data));
  // };
  //
  // const refreshUserState = () => {
  //   const token = localStorage.getItem('authToken');
  //   if (token && user === null) {
  //     getMe()
  //       .then( (data)  => {
  //         if (data !== null) {
  //           // handleUserLoginState(data)
  //           handleStateLogin(data)
  //         }
  //       })
  //       .catch(err => {
  //         console.error('Error:', err);
  //       });
  //   }
  // }
  // refreshUserState()

  const isLoading = useSelector((state: RootState) => state.spinnerLoading.isLoading);

  return (
    <ThemeProvider theme={lightTheme}>
      {/*<CssBaseline />*/}
      {/*<LoadCSSFile href={"./css/tei_weblayout.css"} />*/}
      <AuthProvider>
        <Guard>
          <BrowserRouter>
            <Routes>
              <Route path="/">
                <Route element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="login" element={<Login />} />
                  <Route path={"/automatic_annotations/:id?"} element={<AutoAnnoList />} />
                  <Route path={"/automatic_annotations/:job_id/letters/:id"} element={<AutoAnnoLetters />} />
                  <Route path={"/editor/letters"} element={<IndexLetters />} />
                  <Route path={"/editor/letters/:letterId/:letterName"} element={<ShowLetter />} />
                </Route>
                <Route element={<AutoAnnoLayout/>}>
                  {/*<GuardedRoute path="/dashboard" component={Dashboard} auth={isAuthenticated} />*/}
                </Route>
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </Guard>
      </AuthProvider>
      { isLoading && <CircularIndeterminate />}
      <Snackbar />
    </ThemeProvider>
  );
}

export default App;
