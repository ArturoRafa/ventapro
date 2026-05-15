import { Box, AppBar, Toolbar, Typography, Button, Chip, IconButton } from '@mui/material';
import { Logout } from '@mui/icons-material';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { useResponsive } from '../../hooks/useResponsive';
import Sidebar, { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from './Sidebar';
import BottomNav from './BottomNav';

export default function MainLayout(): React.ReactElement {
  const { user, logout } = useAuth();
  const { config } = useConfig();
  const { isMobile, isTablet } = useResponsive();

  const drawerWidth = isMobile ? 0 : isTablet ? MINI_DRAWER_WIDTH : DRAWER_WIDTH;

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
                sx={{ mr: isMobile ? 1 : 2 }}
              />
              {!isMobile && (
                <Typography variant="body2" sx={{ mr: 2 }}>
                  {user.name}
                </Typography>
              )}
              {isMobile ? (
                <IconButton color="inherit" onClick={logout} size="small">
                  <Logout />
                </IconButton>
              ) : (
                <Button color="inherit" onClick={logout}>
                  Salir
                </Button>
              )}
            </>
          )}
        </Toolbar>
      </AppBar>
      {!isMobile && <Sidebar variant={isTablet ? 'mini' : 'full'} />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isMobile ? 2 : 3,
          mt: '64px',
          mb: isMobile ? '56px' : 0,
          minHeight: isMobile ? 'calc(100vh - 64px - 56px)' : 'calc(100vh - 64px)',
        }}
      >
        <Outlet />
      </Box>
      {isMobile && <BottomNav />}
    </Box>
  );
}
