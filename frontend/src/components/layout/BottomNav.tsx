import { useState } from 'react';
import {
  BottomNavigation, BottomNavigationAction, Paper, Drawer, List,
  ListItemButton, ListItemIcon, ListItemText, Divider, Box, Toolbar,
} from '@mui/material';
import { Storefront, PointOfSale, ShoppingCart, CreditScore, MoreHoriz } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { navItems, isVisible, cleanDividers } from './Sidebar';
import type { NavEntry } from './Sidebar';

interface BottomItem {
  label: string;
  path: string;
  icon: React.ReactElement;
}

export default function BottomNav(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { config } = useConfig();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const configRecord = config as unknown as Record<string, unknown> | null;

  const allVisible = navItems.filter((entry): entry is Exclude<NavEntry, 'divider'> => {
    if (entry === 'divider') return false;
    return isVisible(entry, user?.role, configRecord);
  });

  const priorityPaths = ['/pos', '/caja', '/productos', '/creditos'];
  const primaryItems: BottomItem[] = [];
  const primaryIcons: Record<string, React.ReactElement> = {
    '/pos': <Storefront />,
    '/caja': <PointOfSale />,
    '/productos': <ShoppingCart />,
    '/creditos': <CreditScore />,
  };

  for (const path of priorityPaths) {
    const item = allVisible.find((i) => i.path === path);
    if (item && primaryItems.length < 4) {
      primaryItems.push({ label: item.label, path: item.path, icon: primaryIcons[path] ?? item.icon });
    }
  }

  const primaryPaths = new Set(primaryItems.map((i) => i.path));
  const drawerItems = navItems.filter((entry) => {
    if (entry === 'divider') return true;
    return isVisible(entry, user?.role, configRecord) && !primaryPaths.has(entry.path);
  });
  const cleanedDrawerItems = cleanDividers(drawerItems);
  const hasDrawerItems = cleanedDrawerItems.some((e) => e !== 'divider');

  const currentPath = location.pathname;
  const activeIndex = primaryItems.findIndex((i) => currentPath === i.path);
  const showMore = hasDrawerItems;

  return (
    <>
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200 }} elevation={3}>
        <BottomNavigation
          value={activeIndex >= 0 ? activeIndex : (showMore ? primaryItems.length : -1)}
          onChange={(_, newValue) => {
            if (newValue < primaryItems.length) {
              navigate(primaryItems[newValue].path);
            } else {
              setDrawerOpen(true);
            }
          }}
          showLabels
        >
          {primaryItems.map((item) => (
            <BottomNavigationAction key={item.path} label={item.label} icon={item.icon} />
          ))}
          {showMore && (
            <BottomNavigationAction label="Mas" icon={<MoreHoriz />} />
          )}
        </BottomNavigation>
      </Paper>

      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Toolbar />
        <Box sx={{ pt: 1, pb: 2 }}>
          <List>
            {cleanedDrawerItems.map((entry, index) => {
              if (entry === 'divider') {
                return <Divider key={`d-${index}`} sx={{ my: 0.5 }} />;
              }
              return (
                <ListItemButton
                  key={entry.path}
                  selected={currentPath === entry.path}
                  onClick={() => { navigate(entry.path); setDrawerOpen(false); }}
                >
                  <ListItemIcon>{entry.icon}</ListItemIcon>
                  <ListItemText primary={entry.label} />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
