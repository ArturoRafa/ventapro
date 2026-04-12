import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, TextField, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select,
  FormControl, InputLabel, RadioGroup, FormControlLabel, Radio, FormLabel,
  CircularProgress,
} from '@mui/material';
import { Add, Edit, ToggleOn, ToggleOff } from '@mui/icons-material';
import type { Product, CreateProductDto } from '../types/product.types';
import type { Category, Subcategory } from '../types/category.types';
import * as productService from '../services/product.service';
import * as categoryService from '../services/category.service';
import StatusChip from '../components/ui/StatusChip';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useSnackbar } from '../context/SnackbarContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { useDebounce } from '../hooks/useDebounce';

export default function ProductsPage(): React.ReactElement {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const isAdmin = user?.role === 'admin';

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<CreateProductDto>({ code: '', name: '', subcategoryId: 0, type: 'inventory', price: 0, stock: 0, minStock: 0 });
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await productService.getProducts({ page: page + 1, limit, search: debouncedSearch || undefined, status: isAdmin ? undefined : 'activo' });
      setProducts(result.data);
      setTotal(result.meta.total);
    } catch {
      showSnackbar('Error al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, isAdmin, showSnackbar]);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await categoryService.getCategories(true);
      setCategories(cats);
    } catch {
      showSnackbar('Error al cargar categorias', 'error');
    }
  }, [showSnackbar]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => {
    if (selectedCategoryId > 0) {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      const activeSubs = cat?.subcategories?.filter((s) => s.status === 'activo') ?? [];
      // When editing, include the product's current subcategory even if inactive
      if (editingProduct && editingProduct.subcategory?.category?.id === selectedCategoryId) {
        const currentSubId = editingProduct.subcategoryId;
        if (!activeSubs.some((s) => s.id === currentSubId)) {
          const currentSub = cat?.subcategories?.find((s) => s.id === currentSubId);
          if (currentSub) activeSubs.push(currentSub);
        }
      }
      setSubcategories(activeSubs);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryId, categories, editingProduct]);

  const openCreate = (): void => {
    setEditingProduct(null);
    setForm({ code: '', name: '', subcategoryId: 0, type: 'inventory', price: 0, stock: 0, minStock: 0 });
    setSelectedCategoryId(0);
    setDialogOpen(true);
  };

  const openEdit = (product: Product): void => {
    setEditingProduct(product);
    setForm({ code: product.code, name: product.name, subcategoryId: product.subcategoryId, type: product.type, price: product.price, stock: product.stock, minStock: product.minStock });
    setSelectedCategoryId(product.subcategory?.category?.id ?? 0);
    setDialogOpen(true);
  };

  const handleSave = async (): Promise<void> => {
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, form);
        showSnackbar('Producto actualizado');
      } else {
        await productService.createProduct(form);
        showSnackbar('Producto creado');
      }
      setDialogOpen(false);
      fetchProducts();
    } catch {
      showSnackbar('Error al guardar producto', 'error');
    }
  };

  const handleToggle = async (): Promise<void> => {
    if (!toggleTarget) return;
    try {
      await productService.toggleProductStatus(toggleTarget.id);
      showSnackbar(`Producto ${toggleTarget.status === 'activo' ? 'desactivado' : 'activado'}`);
      fetchProducts();
    } catch {
      showSnackbar('Error al cambiar estado', 'error');
    }
    setConfirmOpen(false);
    setToggleTarget(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Productos</Typography>
        {isAdmin && <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Nuevo Producto</Button>}
      </Box>

      <TextField
        placeholder="Buscar por nombre o codigo..."
        size="small"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        sx={{ mb: 2, width: 300 }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Codigo</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">Precio</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell>Estado</TableCell>
              {isAdmin && <TableCell>Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id} sx={p.type === 'inventory' && p.stock <= p.minStock ? { bgcolor: 'error.light' } : {}}>
                <TableCell>{p.code}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.subcategory?.category?.name} / {p.subcategory?.name}</TableCell>
                <TableCell>{p.type === 'inventory' ? 'Inventario' : 'Comida'}</TableCell>
                <TableCell align="right">{formatCurrency(p.price)}</TableCell>
                <TableCell align="right">{p.type === 'inventory' ? p.stock : '-'}</TableCell>
                <TableCell><StatusChip status={p.status} /></TableCell>
                {isAdmin && (
                  <TableCell>
                    <IconButton size="small" onClick={() => openEdit(p)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => { setToggleTarget(p); setConfirmOpen(true); }}>
                      {p.status === 'activo' ? <ToggleOff fontSize="small" /> : <ToggleOn fontSize="small" color="success" />}
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow><TableCell colSpan={8} align="center">No hay productos</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={limit}
        rowsPerPageOptions={[20]}
        onPageChange={(_, newPage) => setPage(newPage)}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Codigo" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} margin="dense" />
          <TextField fullWidth label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} margin="dense" />
          <FormControl fullWidth margin="dense">
            <InputLabel>Categoria</InputLabel>
            <Select value={selectedCategoryId} label="Categoria" onChange={(e) => { setSelectedCategoryId(Number(e.target.value)); setForm({ ...form, subcategoryId: 0 }); }}>
              {categories.filter((c) => c.status === 'activo').map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Subcategoria</InputLabel>
            <Select value={form.subcategoryId} label="Subcategoria" onChange={(e) => setForm({ ...form, subcategoryId: Number(e.target.value) })}>
              {subcategories.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl margin="dense">
            <FormLabel>Tipo</FormLabel>
            <RadioGroup row value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'inventory' | 'food' })}>
              <FormControlLabel value="inventory" control={<Radio />} label="Inventario" />
              <FormControlLabel value="food" control={<Radio />} label="Comida" />
            </RadioGroup>
          </FormControl>
          <TextField fullWidth label="Precio" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} margin="dense" />
          {form.type === 'inventory' && (
            <>
              <TextField fullWidth label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} margin="dense" />
              <TextField fullWidth label="Stock minimo" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} margin="dense" />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.code || !form.name || !form.subcategoryId}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Cambiar estado"
        message={`Deseas ${toggleTarget?.status === 'activo' ? 'desactivar' : 'activar'} "${toggleTarget?.name}"?`}
        onConfirm={handleToggle}
        onCancel={() => { setConfirmOpen(false); setToggleTarget(null); }}
      />
    </Box>
  );
}
