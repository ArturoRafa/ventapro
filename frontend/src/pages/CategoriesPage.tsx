import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, List, ListItemButton, ListItemText,
  Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Divider, CircularProgress,
} from '@mui/material';
import { Add, Edit, ToggleOn, ToggleOff } from '@mui/icons-material';
import type { Category, Subcategory } from '../types/category.types';
import * as categoryService from '../services/category.service';
import StatusChip from '../components/ui/StatusChip';
import { useSnackbar } from '../context/SnackbarContext';

export default function CategoriesPage(): React.ReactElement {
  const { showSnackbar } = useSnackbar();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Category dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catOrder, setCatOrder] = useState(0);

  // Subcategory dialog
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null);
  const [subName, setSubName] = useState('');
  const [subOrder, setSubOrder] = useState(0);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const cats = await categoryService.getCategories(true);
      setCategories(cats);
    } catch {
      showSnackbar('Error al cargar categorias', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => {
    if (selectedCat) {
      setSubcategories(selectedCat.subcategories ?? []);
    }
  }, [selectedCat]);

  const selectCategory = (cat: Category): void => {
    setSelectedCat(cat);
  };

  // Category CRUD
  const openCatCreate = (): void => { setEditingCat(null); setCatName(''); setCatOrder(0); setCatDialogOpen(true); };
  const openCatEdit = (cat: Category): void => { setEditingCat(cat); setCatName(cat.name); setCatOrder(cat.order); setCatDialogOpen(true); };

  const saveCat = async (): Promise<void> => {
    try {
      if (editingCat) {
        await categoryService.updateCategory(editingCat.id, { name: catName, order: catOrder });
        showSnackbar('Categoria actualizada');
      } else {
        await categoryService.createCategory({ name: catName, order: catOrder });
        showSnackbar('Categoria creada');
      }
      setCatDialogOpen(false);
      await fetchCategories();
    } catch {
      showSnackbar('Error al guardar categoria', 'error');
    }
  };

  const toggleCat = async (cat: Category): Promise<void> => {
    try {
      await categoryService.toggleCategoryStatus(cat.id);
      showSnackbar(`Categoria ${cat.status === 'activo' ? 'desactivada' : 'activada'}`);
      await fetchCategories();
      if (selectedCat?.id === cat.id) {
        const updated = await categoryService.getCategoryById(cat.id);
        setSelectedCat(updated);
      }
    } catch {
      showSnackbar('Error al cambiar estado', 'error');
    }
  };

  // Subcategory CRUD
  const openSubCreate = (): void => { setEditingSub(null); setSubName(''); setSubOrder(0); setSubDialogOpen(true); };
  const openSubEdit = (sub: Subcategory): void => { setEditingSub(sub); setSubName(sub.name); setSubOrder(sub.order); setSubDialogOpen(true); };

  const saveSub = async (): Promise<void> => {
    if (!selectedCat) return;
    try {
      if (editingSub) {
        await categoryService.updateSubcategory(editingSub.id, { name: subName, order: subOrder });
        showSnackbar('Subcategoria actualizada');
      } else {
        await categoryService.createSubcategory({ categoryId: selectedCat.id, name: subName, order: subOrder });
        showSnackbar('Subcategoria creada');
      }
      setSubDialogOpen(false);
      await fetchCategories();
      const updated = await categoryService.getCategoryById(selectedCat.id);
      setSelectedCat(updated);
    } catch {
      showSnackbar('Error al guardar subcategoria', 'error');
    }
  };

  const toggleSub = async (sub: Subcategory): Promise<void> => {
    try {
      await categoryService.toggleSubcategoryStatus(sub.id);
      showSnackbar(`Subcategoria ${sub.status === 'activo' ? 'desactivada' : 'activada'}`);
      await fetchCategories();
      if (selectedCat) {
        const updated = await categoryService.getCategoryById(selectedCat.id);
        setSelectedCat(updated);
      }
    } catch {
      showSnackbar('Error al cambiar estado', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Categorias y Subcategorias</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
      <Grid container spacing={3}>
        {/* Categories panel */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Categorias</Typography>
              <Button size="small" startIcon={<Add />} onClick={openCatCreate}>Nueva</Button>
            </Box>
            <List>
              {categories.map((cat) => (
                <ListItemButton key={cat.id} selected={selectedCat?.id === cat.id} onClick={() => selectCategory(cat)}>
                  <ListItemText
                    primary={cat.name}
                    secondary={`Orden: ${cat.order} | ${cat.subcategories?.length ?? 0} subcategorias`}
                  />
                  <StatusChip status={cat.status} />
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); openCatEdit(cat); }}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleCat(cat); }}>
                    {cat.status === 'activo' ? <ToggleOff fontSize="small" /> : <ToggleOn fontSize="small" color="success" />}
                  </IconButton>
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Subcategories panel */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Subcategorias {selectedCat && <Chip label={selectedCat.name} size="small" sx={{ ml: 1 }} />}
              </Typography>
              {selectedCat && <Button size="small" startIcon={<Add />} onClick={openSubCreate}>Nueva</Button>}
            </Box>
            <Divider sx={{ mb: 2 }} />
            {!selectedCat ? (
              <Typography color="text.secondary">Selecciona una categoria</Typography>
            ) : subcategories.length === 0 ? (
              <Typography color="text.secondary">No hay subcategorias</Typography>
            ) : (
              <List>
                {subcategories.map((sub) => (
                  <ListItemButton key={sub.id}>
                    <ListItemText primary={sub.name} secondary={`Orden: ${sub.order}`} />
                    <StatusChip status={sub.status} />
                    <IconButton size="small" onClick={() => openSubEdit(sub)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => toggleSub(sub)}>
                      {sub.status === 'activo' ? <ToggleOff fontSize="small" /> : <ToggleOn fontSize="small" color="success" />}
                    </IconButton>
                  </ListItemButton>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
      )}

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onClose={() => setCatDialogOpen(false)}>
        <DialogTitle>{editingCat ? 'Editar Categoria' : 'Nueva Categoria'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nombre" value={catName} onChange={(e) => setCatName(e.target.value)} margin="dense" autoFocus />
          <TextField fullWidth label="Orden" type="number" value={catOrder} onChange={(e) => setCatOrder(Number(e.target.value))} margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCatDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveCat} disabled={!catName.trim()}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={subDialogOpen} onClose={() => setSubDialogOpen(false)}>
        <DialogTitle>{editingSub ? 'Editar Subcategoria' : 'Nueva Subcategoria'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nombre" value={subName} onChange={(e) => setSubName(e.target.value)} margin="dense" autoFocus />
          <TextField fullWidth label="Orden" type="number" value={subOrder} onChange={(e) => setSubOrder(Number(e.target.value))} margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveSub} disabled={!subName.trim()}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
