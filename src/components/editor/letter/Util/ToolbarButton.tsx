import { IconButton, Tooltip } from '@mui/material';
import { useTheme, Theme } from '@mui/material/styles';
import React from 'react';

type ToolbarButtonProps = {
  title: string;
  active?: boolean;
  icon: React.ReactNode;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  title,
  active = false,
  onClick,
  icon,
}) => {
  const theme = useTheme<Theme>();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!active) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    onClick(event);
  };

  return (
    <Tooltip title={title} placement="right">
      <IconButton
        size="small"
        aria-pressed={active}
        onClick={handleClick}
        sx={{
          bgcolor: active
            ? theme.palette.toolbarButton.activeBg
            : theme.palette.toolbarButton.inactiveBg,
          color: active
            ? theme.palette.toolbarButton.activeColor
            : theme.palette.toolbarButton.inactiveColor,
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
