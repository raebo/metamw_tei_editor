import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppBar, Box } from '@mui/material';
import Header from '../header/Header';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { useInactivityLogout } from '@src/hooks/useInactivityLogout';
import InactivityWarningDialog from '@src/components/support/InactivityWarningDialog';

const drawerWidth = 240;

const Layout = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const { showWarning, stayLoggedIn, handleLogout } = useInactivityLogout(isAuthenticated);
  return (
    <>
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
      <InactivityWarningDialog
        open={showWarning}
        onStayLoggedIn={stayLoggedIn}
        onLogout={handleLogout}
      />
    </>
  );
};

export default Layout;
