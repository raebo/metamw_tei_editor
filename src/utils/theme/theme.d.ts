import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    toolbarButton: {
      activeBg: string;
      activeColor: string;
      inactiveBg: string;
      inactiveColor: string;
      hoverBg: string;
    };
  }
  interface PaletteOptions {
    toolbarButton?: {
      activeBg?: string;
      activeColor?: string;
      inactiveBg?: string;
      inactiveColor?: string;
      hoverBg?: string;
    };
  }
}
