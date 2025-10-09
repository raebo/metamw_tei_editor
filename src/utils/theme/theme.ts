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

const theme = createTheme(baseTheme, {
  palette: {
    primary: {
      main: baseTheme.palette.primary.main,
      light: baseTheme.palette.primary.light,
      dark: baseTheme.palette.primary.dark,
      contrastText: baseTheme.palette.primary.contrastText,
    },
    toolbarButton: {
      primaryColor: '#1976d2',
      secondaryColor: '#63a4ff',
      activeBg: '#1976d2', // active background
      activeColor: '#fff', // active icon/text color
      inactiveBg: '#f5f5f5', // inactive background
      inactiveColor: '#555', // inactive icon/text color
      // hoverBg: '#e0e0e0', // hover background
      hoverBg: '#63a4ff', // active background
    },
    editorTabs: {
      savedTab: {
        main: '#1976d2',
        border: 'transparent',
        background: 'transparent',
        iconColor: '#1976d2',
        inactive: {
          color: '#555',
        },
        active: {
          color: baseTheme.palette.primary.main,
        },
      },
      unsavedTab: {
        main: '#ffa726', // or any color you prefer
        border: '#ffa726',
        background: 'rgba(255, 167, 38, 0.08)', // subtle background
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

export default theme;
