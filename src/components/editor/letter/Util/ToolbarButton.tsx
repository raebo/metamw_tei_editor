import { IconButton, Tooltip } from '@mui/material';
import { useTheme, Theme } from '@mui/material/styles';
import React from 'react';

type ToolbarButtonProps = {
  title: string;
  active?: boolean;
  icon: React.ReactNode;
  onClick: (() => void) | ((event: React.MouseEvent<HTMLDivElement>) => void);
};

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({ title, active = false, onClick, icon }) => {
  const theme = useTheme<Theme>();

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!active) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (active) {
      if (typeof onClick === 'function') {
        onClick?.(event);
      }
    }
  };

  return (
    <Tooltip title={active ? 'is active' : 'is not active'} placement="right">
      <IconButton
        size="small"
        active={title}
        onClick={handleClick}
        sx={{
          border: `1px solid ${theme.palette.toolbarButton.borderColor}`,
          bgcolor: active ? theme.palette.toolbarButton.activeBg : theme.palette.toolbarButton.inactiveBg,
          color: active ? theme.palette.toolbarButton.activeColor : theme.palette.toolbarButton.inactiveColor,
          border: '1px solid',
          borderColor: active ? theme.palette.toolbarButton.activeBg : '#ccc',
          borderRadius: 1,
          cursor: active ? 'pointer' : 'not-allowed', // ← shows clearly it’s inactive
          pointerEvents: active ? 'auto' : 'none', // ← prevents click entirely
          '&:hover': active ? { bgcolor: theme.palette.toolbarButton.hoverBg } : {},
        }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
};
