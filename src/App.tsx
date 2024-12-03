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
import Container from "@mui/material/Container";
import AutoAnnoLayout from "./components/layout/AutoAnnoLayout";
import AutoAnnoList from "./components/auto_anno/AutoAnnoList";
import Guard from "./components/auth/Guard";
import AaIndex from "./components/pages/aa_annotations/AaIndex";
import React from "react";
import CircularIndeterminate from "./components/support/CircularIndeterminate";
import AutoAnnoLetters from "./components/auto_anno/AutoAnnoLetters";

const lightTheme = createTheme({
  palette: {
    mode: 'light'
  }
})

const App = () => {
  // const state = useSelector((state) => state);

  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);
  // eslint-disable-next-line no-new-wrappers
  const handleStateLogin = (data = { last_name: new String(), first_name: new String() }) => {
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


  const isLoading = useSelector((state: RootState) => state.spinnerLoading.isLoading);

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

  console.log("App component rendered: Is Loading: ", isLoading)

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Guard>
        <BrowserRouter>
          <Routes>
            <Route path="/">
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="login" element={<Login />} />
                <Route path={"/automatic_annotations"} element={<AutoAnnoList />} />
                <Route path={"/automatic_annotations/:id"} element={<AutoAnnoLetters />} />
              </Route>
              <Route element={<AutoAnnoLayout/>}>
                {/*<GuardedRoute path="/dashboard" component={Dashboard} auth={isAuthenticated} />*/}
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </Guard>
      { isLoading && <CircularIndeterminate />}
      <Snackbar />
    </ThemeProvider>
  );
}

export default App;
