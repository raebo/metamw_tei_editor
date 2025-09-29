// theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#63a4ff',
      dark: '#004ba0',
      contrastText: '#fff',
    },
    toolbarButton: {
      activeBg: '#1976d2', // active background
      activeColor: '#fff', // active icon/text color
      inactiveBg: '#f5f5f5', // inactive background
      inactiveColor: '#555', // inactive icon/text color
      // hoverBg: '#e0e0e0', // hover background
      hoverBg: '#63a4ff', // active background
    },
  },
});

export default theme;
