// theme.ts
import { createTheme } from '@mui/material/styles';

const baseTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#63a4ff',
      dark: '#004ba0',
      contrastText: '#fff',
    },
  },
});

export const theme = createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    toolbarButton: {
      primaryColor: baseTheme.palette.primary.main,
      secondaryColor: baseTheme.palette.primary.light,
      activeBg: baseTheme.palette.primary.light,
      activeColor: '#fff',
      inactiveBg: '#f5f5f5',
      inactiveColor: '#555',
      hoverBg: baseTheme.palette.primary.light,
      borderColor: '#555',
    },

    // Editor tabs custom palette
    editorTabs: {
      savedTab: {
        main: baseTheme.palette.primary.main,
        border: 'transparent',
        background: 'transparent',
        iconColor: baseTheme.palette.primary.main,
        inactive: {
          color: '#555',
        },
        active: {
          color: baseTheme.palette.primary.main,
        },
      },
      unsavedTab: {
        main: '#ffa726',
        border: '#ffa726',
        background: 'rgba(255, 167, 38, 0.08)',
        bookmarkIconColor: '#ffa726',
        inactive: {
          color: '#555',
        },
        active: {
          color: '#ffa726',
        },
      },
    },
  },
});

export type AppTheme = typeof theme;
export default theme;
