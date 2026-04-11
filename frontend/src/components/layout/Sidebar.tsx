import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Divider, Box } from '@mui/material';
import { Inventory2, Category, ShoppingCart, People, Settings, Assessment } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
  adminOnly?: boolean;
  featureFlag?: string;
}

const navItems: NavItem[] = [
  { label: 'Productos', path: '/productos', icon: <ShoppingCart /> },
  { label: 'Categorias', path: '/categorias', icon: <Category /> },
  { label: 'Inventario', path: '/inventario', icon: <Inventory2 />, adminOnly: true },
  { label: 'Clientes', path: '/clientes', icon: <People />, featureFlag: 'usesCredit' },
  { label: 'Reportes', path: '/reportes', icon: <Assessment />, adminOnly: true, featureFlag: 'usesReports' },
  { label: 'Configuracion', path: '/configuracion', icon: <Settings />, adminOnly: true },
];

export default function Sidebar(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { config } = useConfig();

  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && user?.role !== 'admin') return false;
    if (item.featureFlag && config) {
      return (config as unknown as Record<string, unknown>)[item.featureFlag] !== false;
    }
    return true;
  });

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <Divider />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {visibleItems.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
