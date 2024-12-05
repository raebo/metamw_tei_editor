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
import Header from "../header/Header";
import { useAuthToken } from "../../services/authentication.service";
import { authenticatedVar } from "../../constants/authenticated";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/redux.store";

const drawerWidth = 240;

const Layout = () => {
  const _authenticatedVar = authenticatedVar.get()
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);

  return (
    <Box sx={{ display: "flex" }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Header isAuthenticated={_authenticatedVar} />
      </AppBar>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: `${drawerWidth}px`,
          mt: "64px", // Adjust based on AppBar height
        }}
      >
        <Outlet /> {/* Render child routes here */}
      </Box>
    </Box>
  );
};

export default Layout;
