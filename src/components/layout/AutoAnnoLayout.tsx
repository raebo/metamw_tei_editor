import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  Toolbar,
  Typography,
} from "@mui/material";
import Grid from '@mui/material/Grid';
import Header from "../header/Header";
import { useAuthToken } from "../../services/authentication.service";
import { authenticatedVar } from "../../constants/authenticated";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";
import Container from "@mui/material/Container";

const drawerWidth = 480;


const AutoAnnoLayout = () => {
  const _authenticatedVar = authenticatedVar.get()
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Header isAuthenticated={_authenticatedVar} />
      </AppBar>
      <Grid container spacing={2}>
        <Outlet /> {/* Render child routes here */}
      </Grid>
      {/*<Container fixed style={{ border: "2px solid RED"}}>*/}
      {/*</Container>*/}
    </>
    // <Box sx={{ display: "flex" }}>
    //   {/* AppBar */}
    //   <Box
    //     component="main"
    //     sx={{
    //       flexGrow: 1,
    //       p: 3,
    //       ml: `${drawerWidth}px`,
    //       mt: "15%", // Adjust based on AppBar height
    //     }}
    //   >
    //     <Outlet /> {/* Render child routes here */}
    //   </Box>
    // </Box>
  );
};

export default AutoAnnoLayout;
