import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, TablePagination, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControlLabel, Switch,
  CircularProgress,
} from '@mui/material';
import { TuneRounded, Edit } from '@mui/icons-material';
import type { Product } from '../types/product.types';
import * as inventoryService from '../services/inventory.service';
import * as productService from '../services/product.service';
import { useSnackbar } from '../context/SnackbarContext';
import { formatCurrency } from '../utils/formatCurrency';
import { useDebounce } from '../hooks/useDebounce';

export default function InventoryPage(): React.ReactElement {
  const { showSnackbar } = useSnackbar();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Adjust dialog
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [adjustment, setAdjustment] = useState(0);
  const [reason, setReason] = useState('');

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ price: 0, minStock: 0 });

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const result = await inventoryService.getStockView({ page: page + 1, limit, search: debouncedSearch || undefined, lowStockOnly });
      setProducts(result.data);
      setTotal(result.meta.total);
    } catch {
      showSnackbar('Error al cargar inventario', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, lowStockOnly, showSnackbar]);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  const openAdjust = (product: Product): void => {
    setAdjustTarget(product);
    setAdjustment(0);
    setReason('');
    setAdjustOpen(true);
  };

  const handleAdjust = async (): Promise<void> => {
    if (!adjustTarget || adjustment === 0) return;
    try {
      await inventoryService.adjustStock(adjustTarget.id, { adjustment, reason: reason || undefined });
      showSnackbar('Stock ajustado');
      setAdjustOpen(false);
      fetchStock();
    } catch {
      showSnackbar('Error al ajustar stock', 'error');
    }
  };

  const openEdit = (product: Product): void => {
    setEditTarget(product);
    setEditForm({ price: product.price, minStock: product.minStock });
    setEditOpen(true);
  };

  const handleEdit = async (): Promise<void> => {
    if (!editTarget) return;
    try {
      await productService.updateProduct(editTarget.id, editForm);
      showSnackbar('Producto actualizado');
      setEditOpen(false);
      fetchStock();
    } catch {
      showSnackbar('Error al actualizar producto', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Inventario</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Buscar..."
          size="small"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ width: 300 }}
        />
        <FormControlLabel
          control={<Switch checked={lowStockOnly} onChange={(e) => { setLowStockOnly(e.target.checked); setPage(0); }} />}
          label="Solo bajo stock"
        />
      </Box>

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
              <TableCell align="right">Precio</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell align="right">Stock Min.</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id} sx={p.stock <= p.minStock ? { bgcolor: '#ffebee' } : {}}>
                <TableCell>{p.code}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.subcategory?.category?.name} / {p.subcategory?.name}</TableCell>
                <TableCell align="right">{formatCurrency(p.price)}</TableCell>
                <TableCell align="right" sx={p.stock <= p.minStock ? { color: 'error.main', fontWeight: 'bold' } : {}}>
                  {p.stock}
                </TableCell>
                <TableCell align="right">{p.minStock}</TableCell>
                <TableCell>{p.stock <= p.minStock ? 'BAJO' : 'OK'}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => openEdit(p)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => openAdjust(p)}><TuneRounded fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow><TableCell colSpan={8} align="center">No hay productos de inventario</TableCell></TableRow>
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Editar: {editTarget?.name}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Precio" type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} margin="dense" inputProps={{ min: 0 }} />
          <TextField fullWidth label="Stock minimo" type="number" value={editForm.minStock} onChange={(e) => setEditForm({ ...editForm, minStock: Number(e.target.value) })} margin="dense" inputProps={{ min: 0 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleEdit}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Adjust Dialog */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)}>
        <DialogTitle>Ajustar Stock: {adjustTarget?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Stock actual: {adjustTarget?.stock} | Usa numeros positivos para agregar, negativos para restar.
          </Typography>
          <TextField fullWidth label="Ajuste" type="number" value={adjustment} onChange={(e) => setAdjustment(Number(e.target.value))} margin="dense" autoFocus />
          <TextField fullWidth label="Razon (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAdjust} disabled={adjustment === 0}>Aplicar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
