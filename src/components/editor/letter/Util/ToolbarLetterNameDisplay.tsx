import { useMemo } from 'react';
import { Box, Tooltip, useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';

interface LetterNameDisplayProps {
  letterName: string | null;
  xmlContent: string | null;
}

const revisionStatusFromXml = (xmlContent: string | null): 'Draft' | 'Live' | null => {
  if (!xmlContent) return null;
  const document = new DOMParser().parseFromString(xmlContent, 'application/xml');
  if (document.getElementsByTagName('parsererror').length > 0) return null;
  const revisionDesc =
    document.getElementsByTagNameNS('*', 'revisionDesc').item(0) ?? document.getElementsByTagName('revisionDesc').item(0);
  const status = revisionDesc?.getAttribute('status')?.toLowerCase();
  if (status === 'live') return 'Live';
  if (status === 'draft') return 'Draft';
  return null;
};

export const ToolbarLetterNameDisplay: React.FC<LetterNameDisplayProps> = ({ letterName, xmlContent }) => {
  const theme = useTheme();
  const revisionStatus = useMemo(() => revisionStatusFromXml(xmlContent), [xmlContent]);

  return (
    <>
      <Tooltip title={letterName ?? ''} placement="right" disableHoverListener={!letterName}>
        <Box
          sx={{
            border: `1px solid ${theme.palette.toolbarButton.borderColor}`,
            bgcolor: letterName !== null ? theme.palette.background.paper : theme.palette.action.disabledBackground,
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
      {revisionStatus && (
        <Box
          sx={{
            border: `1px solid ${theme.palette.toolbarButton.borderColor}`,
            bgcolor: theme.palette.background.paper,
            borderRadius: 1,
            padding: '4px 6px',
            boxSizing: 'border-box',
            width: '100%',
            minHeight: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: theme.palette.secondary.main }}>{revisionStatus}</Typography>
        </Box>
      )}
    </>
  );
};
