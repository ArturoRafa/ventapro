import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Divider, Box, Tooltip } from '@mui/material';
import { Inventory2, Category, ShoppingCart, People, Settings, Assessment, PointOfSale, Storefront, CreditScore, ManageAccounts } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';

const DRAWER_WIDTH = 240;
const MINI_DRAWER_WIDTH = 64;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
  adminOnly?: boolean;
  featureFlag?: string;
}

type NavEntry = NavItem | 'divider';

const navItems: NavEntry[] = [
  { label: 'Caja', path: '/caja', icon: <PointOfSale />, featureFlag: 'usesCashRegister' },
  { label: 'POS', path: '/pos', icon: <Storefront /> },
  'divider',
  { label: 'Productos', path: '/productos', icon: <ShoppingCart /> },
  { label: 'Categorías', path: '/categorias', icon: <Category /> },
  { label: 'Inventario', path: '/inventario', icon: <Inventory2 />, adminOnly: true },
  { label: 'Clientes', path: '/clientes', icon: <People />, featureFlag: 'usesCredit' },
  { label: 'Créditos', path: '/creditos', icon: <CreditScore />, featureFlag: 'usesCredit' },
  'divider',
  { label: 'Reportes', path: '/reportes', icon: <Assessment />, adminOnly: true, featureFlag: 'usesReports' },
  { label: 'Configuración', path: '/configuracion', icon: <Settings />, adminOnly: true },
  { label: 'Usuarios', path: '/usuarios', icon: <ManageAccounts />, adminOnly: true },
];

function isVisible(item: NavItem, role: string | undefined, config: Record<string, unknown> | null): boolean {
  if (item.adminOnly && role !== 'admin') return false;
  if (item.featureFlag && config) {
    return config[item.featureFlag] !== false;
  }
  return true;
}

function cleanDividers(entries: NavEntry[]): NavEntry[] {
  const result = entries.reduce<NavEntry[]>((acc, entry) => {
    if (entry === 'divider') {
      if (acc.length === 0 || acc[acc.length - 1] === 'divider') return acc;
      return [...acc, entry];
    }
    return [...acc, entry];
  }, []);
  if (result.length > 0 && result[result.length - 1] === 'divider') {
    result.pop();
  }
  return result;
}

interface SidebarProps {
  variant?: 'full' | 'mini';
}

export default function Sidebar({ variant = 'full' }: SidebarProps): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { config } = useConfig();

  const configRecord = config as unknown as Record<string, unknown> | null;

  const filtered = navItems.filter((entry) => {
    if (entry === 'divider') return true;
    return isVisible(entry, user?.role, configRecord);
  });
  const visibleEntries = cleanDividers(filtered);

  const isMini = variant === 'mini';
  const width = isMini ? MINI_DRAWER_WIDTH : DRAWER_WIDTH;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width, boxSizing: 'border-box', overflowX: 'hidden' },
      }}
    >
      <Toolbar />
      <Divider />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {visibleEntries.map((entry, index) => {
            if (entry === 'divider') {
              return <Divider key={`divider-${index}`} sx={{ my: 1 }} />;
            }
            const button = (
              <ListItemButton
                key={entry.path}
                selected={location.pathname === entry.path}
                onClick={() => navigate(entry.path)}
                sx={isMini ? { justifyContent: 'center', px: 2 } : {}}
              >
                <ListItemIcon sx={isMini ? { minWidth: 0 } : {}}>{entry.icon}</ListItemIcon>
                {!isMini && <ListItemText primary={entry.label} />}
              </ListItemButton>
            );
            if (isMini) {
              return (
                <Tooltip key={entry.path} title={entry.label} placement="right">
                  {button}
                </Tooltip>
              );
            }
            return button;
          })}
        </List>
      </Box>
    </Drawer>
  );
}

export { DRAWER_WIDTH, MINI_DRAWER_WIDTH, navItems, isVisible, cleanDividers };
export type { NavItem, NavEntry };
