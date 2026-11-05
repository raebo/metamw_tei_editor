import React from 'react';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, MenuItem, Tooltip, type SxProps, type Theme, Typography } from '@mui/material';

type EditorCommandMenuItemProps = {
  label?: string;
  shortcut?: string;
  hasSubMenu?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  danger?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  sx?: SxProps<Theme>;
};

export const editorCommandMenuPaperSx = {
  minWidth: 288,
  maxWidth: 360,
};

const EditorCommandMenuItem = ({
  label,
  shortcut,
  hasSubMenu = false,
  disabled = false,
  disabledReason,
  danger = false,
  onClick,
  onMouseEnter,
  sx,
}: EditorCommandMenuItemProps) => {
  const content = (
    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
      <Typography component="span" variant="body2" noWrap sx={{ flexGrow: 1 }}>
        {label}
      </Typography>
      {shortcut && (
        <Box
          component="kbd"
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 0.75,
            bgcolor: 'action.hover',
            color: 'text.secondary',
            fontFamily: 'monospace',
            fontSize: '0.68rem',
            lineHeight: 1.4,
            px: 0.75,
            py: 0.125,
            whiteSpace: 'nowrap',
          }}
        >
          {shortcut}
        </Box>
      )}
      {hasSubMenu && <ChevronRightIcon color="action" fontSize="small" aria-hidden="true" />}
    </Box>
  );

  return (
    <MenuItem
      disabled={disabled}
      title={disabled ? disabledReason : undefined}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={disabled ? undefined : onMouseEnter}
      sx={[
        {
          minHeight: 40,
          px: 1.5,
          py: 0.75,
          color: danger ? 'error.main' : 'text.primary',
          '&.Mui-disabled': {
            opacity: 0.48,
            cursor: 'not-allowed',
            pointerEvents: 'auto',
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {disabled && disabledReason ? (
        <Tooltip title={disabledReason} placement="right" arrow describeChild>
          {content}
        </Tooltip>
      ) : (
        content
      )}
    </MenuItem>
  );
};

export default EditorCommandMenuItem;
