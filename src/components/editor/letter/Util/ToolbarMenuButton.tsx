import React from 'react';
import { ListItemButton, ListItemIcon, Tooltip, useTheme } from '@mui/material';

type ToolbarMenuButtonProps = {
  title: string;
  selected?: boolean;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  icon?: React.ReactNode;
};

export const ToolbarMenuButton: React.FC<ToolbarMenuButtonProps> = ({
  title,
  selected = false,
  onClick,
  icon,
}) => {
  const theme = useTheme();

  return (
    <Tooltip title={selected ? 'selected' : 'NOT selected'} placement="right">
      <ListItemButton
        selected={selected}
        onClick={onClick}
        sx={{
          border: `1px solid ${theme.palette.toolbarButton.borderColor}`,
          bgcolor: selected
            ? theme.palette.toolbarButton.activeBg
            : theme.palette.toolbarButton.inactiveBg,
          color: selected
            ? theme.palette.toolbarButton.activeColor
            : theme.palette.toolbarButton.inactiveColor,
          borderRadius: 1,
          '&:hover': selected
            ? { bgcolor: theme.palette.toolbarButton.hoverBg }
            : { bgcolor: theme.palette.toolbarButton.hoverBg },
        }}
      >
        <ListItemIcon>{icon}</ListItemIcon>
      </ListItemButton>
    </Tooltip>
  );
};
