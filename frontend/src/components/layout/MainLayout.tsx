import { Box, AppBar, Toolbar, Typography, Button, Chip } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';

export default function MainLayout(): React.ReactElement {
  const { user, logout } = useAuth();
  const { config } = useConfig();

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {config?.businessName ?? 'cafe-pos'}
          </Typography>
          {user && (
            <>
              <Chip
                label={user.role === 'admin' ? 'Admin' : 'Cajero'}
                color="secondary"
                size="small"
                sx={{ mr: 2 }}
              />
              <Typography variant="body2" sx={{ mr: 2 }}>
                {user.name}
              </Typography>
              <Button color="inherit" onClick={logout}>
                Salir
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: `${DRAWER_WIDTH}px`, mt: '64px' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
