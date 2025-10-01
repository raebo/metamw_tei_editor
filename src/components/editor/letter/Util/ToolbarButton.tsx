import { IconButton, Tooltip, useTheme } from '@mui/material';
import React from 'react';

type ToolbarButtonProps = {
  title: string;
  active?: boolean;
  onClick: (() => void) | ((event: React.MouseEvent<HTMLDivElement>) => void);
  children: React.ReactNode;
};

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({ title, active = false, onClick, children }) => {
  const theme = useTheme();

  return (
    <Tooltip title={title} placement="right">
      <IconButton
        size="small"
        onClick={onClick}
        sx={{
          bgcolor: active ? theme.palette.toolbarButton.activeBg : theme.palette.toolbarButton.inactiveBg,
          color: active ? theme.palette.toolbarButton.activeColor : theme.palette.toolbarButton.inactiveColor,
          border: '1px solid',
          borderColor: active ? theme.palette.toolbarButton.activeBg : '#ccc',
          borderRadius: 1,
          cursor: active ? 'pointer' : 'default',
          '&:hover': active ? { bgcolor: theme.palette.toolbarButton.hoverBg } : {},
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
};
