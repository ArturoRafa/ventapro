import { createTheme } from '@mui/material/styles';

// Default cafe-pos theme — colors from configuracion_negocio defaults
const theme = createTheme({
  palette: {
    primary: {
      main: '#1B5E20', // color_primario
    },
    secondary: {
      main: '#FF6F00', // color_secundario
    },
    background: {
      default: '#F5F5F5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

export default theme;
