import { Box, Tooltip, useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';

interface LetterNameDisplayProps {
  letterName: string | null;
}

export const ToolbarLetterNameDisplay: React.FC<LetterNameDisplayProps> = ({ letterName }) => {
  const theme = useTheme();

  return (
    <Tooltip title={letterName ?? ''} placement="right" disableHoverListener={!letterName}>
      <Box
        sx={{
          border: `1px solid ${theme.palette.toolbarButton.borderColor}`,
          bgcolor:
            letterName !== null
              ? theme.palette.background.paper
              : theme.palette.action.disabledBackground,
          borderRadius: 1,
          padding: '4px 6px',
          width: '232%',
          maxWidth: '14rem',
          minHeight: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'text',
          userSelect: 'text',
          zIndex: 10000,
        }}
      >
        {letterName && (
          <Typography
            sx={{
              fontSize: '1.4em',
              fontWeight: 900,
              lineHeight: 1.2,
              textAlign: 'center',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
              color: theme.palette.secondary.main,
            }}
          >
            {letterName}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
};
