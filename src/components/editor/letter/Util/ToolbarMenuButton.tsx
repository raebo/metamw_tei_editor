import React from 'react';
import { ListItemButton, ListItemIcon, Tooltip, useTheme } from '@mui/material';

type ToolbarMenuButtonProps = {
  title: string;
  selected?: boolean;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
};

export const ToolbarMenuButton: React.FC<ToolbarMenuButtonProps> = ({ title, selected = false, onClick, children }) => {
  const theme = useTheme();

  return (
    <Tooltip title={title} placement="right">
      <ListItemButton
        selected={selected}
        onClick={onClick}
        sx={{
          bgcolor: selected ? theme.palette.toolbarButton.activeBg : theme.palette.toolbarButton.inactiveBg,
          color: selected ? theme.palette.toolbarButton.activeColor : theme.palette.toolbarButton.inactiveColor,
          borderRadius: 1,
          '&:hover': selected ? { bgcolor: theme.palette.toolbarButton.hoverBg } : {},
        }}
      >
        <ListItemIcon>{children}</ListItemIcon>
      </ListItemButton>
    </Tooltip>
  );
};
