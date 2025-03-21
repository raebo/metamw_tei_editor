import { Menu, MenuItem } from "@mui/material";
import React, { useState } from "react";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";

interface UserActionMenuProps {
  anchorEl: HTMLElement | null
  open: boolean
  handleClose: () => void
}

const UserActionMenu= (props: UserActionMenuProps) => {
  const [subMenuAnchorEl, setSubMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleSubMenuOpen = (event: React.MouseEvent<HTMLLIElement>) => {
    setSubMenuAnchorEl(event.currentTarget);
  };

  const handleSubMenuClose = () => {
    setSubMenuAnchorEl(null);
  };

  return (
    <>
      <Menu
        anchorEl={props.anchorEl}
        open={props.open}
        onClose={() => {
          props.handleClose();
          setSubMenuAnchorEl(null); // ✅ Reset submenu when main menu closes
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <MenuItem onClick={props.handleClose}>Option 1</MenuItem>
        <MenuItem onClick={props.handleClose}>Option 2</MenuItem>
        <MenuItem onMouseEnter={handleSubMenuOpen} onClick={handleSubMenuOpen}>
          More Options <ArrowRightIcon fontSize="small" />
        </MenuItem>
        <MenuItem onClick={props.handleClose}>Option 3</MenuItem>
      </Menu>

      <Menu
        anchorEl={subMenuAnchorEl}
        open={Boolean(subMenuAnchorEl)}
        onClose={handleSubMenuClose} // ✅ Close submenu when clicking outside
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={handleSubMenuClose}>Sub-option 1</MenuItem>
        <MenuItem onClick={handleSubMenuClose}>Sub-option 2</MenuItem>
      </Menu>
    </>
  )
}

export default UserActionMenu;
