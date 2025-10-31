import React, { useContext } from 'react';
import { Box, IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import state from 'react';
import { useState } from 'react';
import { snackVar } from '@src/constants/snack';
import { UNKNOWN_SNACK_ERROR_MESSAGE } from '@src/constants/errors';
import { useSelector } from 'react-redux';
import { setLogoutState } from '@src/redux/slices/authentication.slice';
import SettingsAvatar from './SettingsAvatar';
import { RootState } from '@src/redux/redux.store';
import { useAppDispatch } from '@src/redux/hooks';
import { AuthContext } from '@src/components/auth/AuthContext';
import { enqueueSnackbar } from 'notistack';

const Settings = () => {
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const auth = useContext(AuthContext);

  const handleOpenUserMenu = (event: state.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const dispatch = useAppDispatch();
  const handleStateLogout = async () => {
    try {
      await auth?.logout();
      dispatch(setLogoutState());

      enqueueSnackbar('Successfully logged out', { variant: 'success' });
    } catch (_error) {
      enqueueSnackbar('Error loging out', { variant: 'error' });
    }
  };

  const user = useSelector((state: RootState) => state.auth.user);

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <Tooltip title="Open settings">
          <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
            <SettingsAvatar
              nameUser={
                user !== null && user !== undefined
                  ? { first_name: user.firstName, last_name: user.lastName }
                  : null
              }
            />
          </IconButton>
        </Tooltip>
        <Menu
          sx={{ mt: '45px' }}
          id="menu-appbar"
          anchorEl={anchorElUser}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorElUser)}
          onClose={handleCloseUserMenu}
        >
          <MenuItem
            key={'logout'}
            onClick={async () => {
              try {
                await handleStateLogout();
                // await onLogout();
                handleCloseUserMenu();
                // navigate("/", { replace: true })
                window.location.href = '/login';
              } catch (_err) {
                snackVar.set(UNKNOWN_SNACK_ERROR_MESSAGE);
              }
            }}
          >
            <Typography sx={{ textAlign: 'center' }}>Logout</Typography>
          </MenuItem>
        </Menu>
      </Box>
    </>
  );
};

export default Settings;
