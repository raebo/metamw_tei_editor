import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    toolbarButton: {
      primaryColor: string;
      secondaryColor: string;
      activeBg: string;
      activeColor: string;
      inactiveBg: string;
      inactiveColor: string;
      hoverBg: string;
      borderColor: string;
    };
  }
  interface PaletteOptions {
    toolbarButton?: {
      primaryColor?: string;
      secondaryColor?: string;
      activeBg?: string;
      activeColor?: string;
      inactiveBg?: string;
      inactiveColor?: string;
      hoverBg?: string;
      borderColor: string;
    };
    unsavedTab?: {
      main: string;
      border: string;
      background: string;
      bookmarkIconColor: string;
    };
    savedTab?: {
      inactive: {
        color: string;
      };
      active: {
        color: string;
      };
    };
  }
}

