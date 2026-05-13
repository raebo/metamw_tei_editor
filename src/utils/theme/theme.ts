// theme.ts
import { createTheme } from '@mui/material/styles';

const cssVars = {
  primaryColor: '#1976d2', // --color-primary-main
  primaryLight: '#90caf9', // --color-primary-light
  primaryDark: '#1565c0', // --color-primary-dark
  secondaryMain: '#9c27b0', // --color-secondary-main
  errorMain: '#d32f2f', // --color-error-main
  warningMain: '#ed6c02', // --color-warning-main
  successMain: '#2e7d32', // --color-success-main
  infoMain: '#0288d1', // --color-info-main
  textPrimary: 'rgba(0,0,0,0.87)', // --color-text-primary
  textSecondary: 'rgba(0,0,0,0.60)', // --color-text-secondary
  textDisabled: 'rgba(0,0,0,0.38)', // --color-text-disabled
  bgDefault: '#ffffff', // --color-bg-default
  bgPaper: '#f5f5f5', // --color-bg-paper
  divider: 'rgba(0,0,0,0.12)', // --color-divider
};

const baseTheme = createTheme({
  palette: {
    primary: {
      main: cssVars.primaryColor,
      light: cssVars.primaryLight,
      dark: cssVars.primaryDark,
      contrastText: '#fff',
    },
    secondary: {
      main: cssVars.secondaryMain,
    },
    error: { main: cssVars.errorMain },
    warning: { main: cssVars.warningMain },
    success: { main: cssVars.successMain },
    info: { main: cssVars.infoMain },
    text: {
      primary: cssVars.textPrimary,
      secondary: cssVars.textSecondary,
      disabled: cssVars.textDisabled,
    },
    background: {
      default: cssVars.bgDefault,
      paper: cssVars.bgPaper,
    },
    divider: cssVars.divider,
  },
});

export const theme = createTheme({
  colorSchemes: undefined,
  defaultColorScheme: undefined,
  modularCssLayers: undefined,
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    toolbarButton: {
      primaryColor: cssVars.primaryColor,
      secondaryColor: cssVars.primaryLight,
      activeBg: cssVars.primaryLight,
      activeColor: '#fff',
      inactiveBg: cssVars.bgPaper,
      inactiveColor: cssVars.textSecondary,
      hoverBg: cssVars.primaryLight,
      borderColor: cssVars.textSecondary,
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
