import { Box, Menu, MenuItem } from "@mui/material";
import React, { useState } from "react";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";

interface UserActionMenuProps {
  anchorEl: HTMLElement | null
  open: boolean
  handleClose: () => void
}

const UserActionMenu= (props: UserActionMenuProps) => {
  const [menuIsActive, setMenuIsActive] = useState<boolean>(false);

  const [subMenuAnchorEl, setSubMenuAnchorEl] = useState<{ [key: string]: HTMLElement | null }>({});

  const handleSubMenuOpen = (event: React.MouseEvent<HTMLElement>, menuKey: string) => {
    setSubMenuAnchorEl((prev) => ({ ...prev, [menuKey]: event.currentTarget }));
  };

  const handleSubMenuClose = (menuKey: string) => {
    setSubMenuAnchorEl((prev) => ({ ...prev, [menuKey]: null }));
  };

  const getMenuItemStyles = (active: boolean) => ({
    fontSize: "0.675rem",
    padding: "4px 12px",
    minHeight: "32px",
    color: active ? "black" : "gray",
  });
  const getSndMenuItemStyles = (active: boolean) => ({
    fontSize: "0.575rem",
    padding: "2px 12px",
    minHeight: "15px",
    color: active ? "black" : "grey",
  });

  const SndMenuItemStylesSpan = {
    fontSize: "0.475rem",
    padding: "0px 12px",
    minHeight: "15px",
    color: "grey",
  };

  const menuItems = [
    { label: "Brief Header Erstellung", secondaryText: null, active: false },
    { label: "Brief Text Erstellung", secondaryText: null, active: false },
    {
      label: "Text Kritik",
      active: true,
      hasSubMenu: true,
      secondaryText: null,
      subMenu: [
        { label: "Schreibakt Erstellen", secondaryText: null, active: false },
        { label: "Vermerk Hinzufügen", secondaryText: null, active: false },
      ],
    },
    {
      label: "Datum Einfügen",
      active: true,
      hasSubMenu: true,
      secondaryText: null,
      subMenu: [
        { label: "Datum when", secondaryText: "ctrl+alt+shift+1", active: false },
        { label: "Datum when-custom", secondaryText: "ctrl+alt+shift+2", active: false },
      ]
    },
  ];

  return (
    <>
      <Menu
        anchorEl={props.anchorEl}
        open={props.open}
        onClose={() => {
          props.handleClose();
          setSubMenuAnchorEl({});
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        {menuItems.map((item, index) =>
          item.hasSubMenu ? (
            <MenuItem
              key={index}
              component="div"
              onMouseEnter={(e: React.MouseEvent<HTMLElement>) => item.hasSubMenu && handleSubMenuOpen(e, item.label)}
              onClick={(e: React.MouseEvent<HTMLElement>) => handleSubMenuOpen(e, item.label)}
              sx={getMenuItemStyles(item.active)}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <span>{item.label}</span>
                {item.secondaryText && (
                  <span style={SndMenuItemStylesSpan}>{item.secondaryText}</span>
                )}
              </Box>
              <ArrowRightIcon fontSize="small" />
            </MenuItem>
          ) : (
            <MenuItem
              key={index}
              onClick={props.handleClose}
              className="custom-tool-menu-item"
              sx={getMenuItemStyles(item.active)}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                <span>{item.label}</span>
                {item.secondaryText && (
                  <span style={SndMenuItemStylesSpan}>{item.secondaryText}</span>
                )}
              </Box>
            </MenuItem>
          )
        )}
      </Menu>

      {menuItems
        .filter((item) => item.hasSubMenu) // Only consider items with submenus
        .map((item) => (
          <Menu
            key={item.label}
            anchorEl={subMenuAnchorEl[item.label]} // Use the correct anchor element for this submenu
            open={Boolean(subMenuAnchorEl[item.label])} // Only open if the anchor element is set
            onClose={() => handleSubMenuClose(item.label)} // Close this specific submenu
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
          >
            {item.subMenu?.map((subItem, subIndex) => (
              <MenuItem
                key={subIndex}
                onClick={() => handleSubMenuClose(item.label)} // Close the submenu when an item is clicked
                className="custom-tool-menu-item"
                sx={getSndMenuItemStyles(subItem.active)}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                  <span>{subItem.label}</span>
                  {subItem.secondaryText && (
                    <span style={SndMenuItemStylesSpan}>{subItem.secondaryText}</span>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Menu>
        ))}
    </>
  );
}

export default UserActionMenu;
