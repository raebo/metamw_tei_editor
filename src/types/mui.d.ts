// src/types/mui.d.ts
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
    editorTabs: {
      savedTab: {
        main: string;
        border: string;
        background: string;
        iconColor: string;
        inactive: { color: string };
        active: { color: string };
      };
      unsavedTab: {
        main: string;
        border: string;
        background: string;
        bookmarkIconColor: string;
        inactive: { color: string };
        active: { color: string };
      };
    };
  }

  interface PaletteOptions {
    toolbarButton?: Palette['toolbarButton'];
    editorTabs?: Palette['editorTabs'];
  }
}
