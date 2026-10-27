import React from 'react';
import { ListItemButton, ListItemIcon, Tooltip, useTheme } from '@mui/material';

type ToolbarMenuButtonProps = {
  title: string;
  selected?: boolean;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  disabledReason?: string;
};

export const ToolbarMenuButton: React.FC<ToolbarMenuButtonProps> = ({
  title,
  selected = false,
  onClick,
  icon,
  disabled = false,
  disabledReason,
}) => {
  const theme = useTheme();

  return (
    <Tooltip title={disabled && disabledReason ? disabledReason : title} placement="right">
      <ListItemButton
        aria-disabled={disabled}
        aria-label={title}
        selected={selected}
        onClick={disabled ? undefined : onClick}
        sx={{
          border: `1px solid ${theme.palette.toolbarButton.borderColor}`,
          bgcolor: selected ? theme.palette.toolbarButton.activeBg : theme.palette.toolbarButton.inactiveBg,
          color: selected ? theme.palette.toolbarButton.activeColor : theme.palette.toolbarButton.inactiveColor,
          borderRadius: 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? theme.palette.action.disabledOpacity : 1,
          '&:hover': { bgcolor: theme.palette.toolbarButton.hoverBg },
        }}
      >
        <ListItemIcon>{icon}</ListItemIcon>
      </ListItemButton>
    </Tooltip>
  );
};
