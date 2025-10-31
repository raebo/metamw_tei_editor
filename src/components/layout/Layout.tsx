import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppBar, Box } from '@mui/material';
import Header from '../header/Header';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';

const drawerWidth = 240;

const Layout = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Header isAuthenticated={isAuthenticated} />
      </AppBar>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: `${drawerWidth}px`,
          mt: '64px', // Adjust based on AppBar height
        }}
      >
        <Outlet /> {/* Render child routes here */}
      </Box>
    </Box>
  );
};

export default Layout;
