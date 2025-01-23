import { Box, IconButton, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import state from "react";
import { useState } from "react";
import { snackVar } from "../../constants/snack";
import { UNKNOWN_SNACK_ERROR_MESSAGE } from "../../constants/errors";
import { removeToken } from "../../services/authentication.service";
import { useSelector } from "react-redux";
import { logoutState } from "../../redux/slices/authentication.slice";
import SettingsAvatar from "./SettingsAvatar";
import { RootState } from "../../redux/redux.store";
import { useAppDispatch } from "../../redux/hooks";

const Settings = () => {
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const handleOpenUserMenu = (event: state.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const dispatch = useAppDispatch();
  const handleStateLogout = () => {
    dispatch(logoutState());
  };

  const user = useSelector((state: RootState) => state.auth.user);

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <>
      <Box sx={{ flexGrow: 1 }} >
        <Tooltip title="Open settings">
          <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
            <SettingsAvatar nameUser={ user !== null && user !== undefined ? { first_name: user.first_name, last_name: user.last_name} : null} />

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
          <MenuItem key={'logout'} onClick={async () => {
            try {
              await removeToken()
              handleStateLogout()
              // await onLogout();
              handleCloseUserMenu()
              // navigate("/", { replace: true })
              window.location.href = "/"
            } catch (err) {
              snackVar.set(UNKNOWN_SNACK_ERROR_MESSAGE)
            }
          }
          }>
            <Typography sx={{ textAlign: 'center' }}>Logout</Typography>
          </MenuItem>
          <MenuItem key={'profile'} onClick={() => {
          }}>
            <Typography sx={{ textAlign: 'center' }}>VERSION_STATUS</Typography>
          </MenuItem>
        </Menu>
      </Box>
    </>
  )
}

export default Settings;
