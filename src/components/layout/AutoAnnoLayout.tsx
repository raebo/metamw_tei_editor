import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppBar } from '@mui/material';
import Grid from '@mui/material/Grid';
import Header from '../header/Header';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';

const AutoAnnoLayout = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Header isAuthenticated={isAuthenticated} />
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
