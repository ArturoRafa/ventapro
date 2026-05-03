import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, TextField, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
} from '@mui/material';
import { Add, Edit, ToggleOn, ToggleOff } from '@mui/icons-material';
import type { Customer, CreateCustomerDto } from '../types/customer.types';
import * as customerService from '../services/customer.service';
import StatusChip from '../components/ui/StatusChip';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useSnackbar } from '../context/SnackbarContext';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';

export default function CustomersPage(): React.ReactElement {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const isAdmin = user?.role === 'admin';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CreateCustomerDto>({ name: '', phone: '' });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await customerService.getCustomers({ page: page + 1, limit, search: debouncedSearch || undefined });
      setCustomers(result.data);
      setTotal(result.meta.total);
    } catch {
      showSnackbar('Error al cargar clientes', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, showSnackbar]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openCreate = (): void => {
    setEditingCustomer(null);
    setForm({ name: '', phone: '' });
    setDialogOpen(true);
  };

  const openEdit = (customer: Customer): void => {
    setEditingCustomer(customer);
    setForm({ name: customer.name, phone: customer.phone, alternatePhone: customer.alternatePhone ?? '', address: customer.address ?? '' });
    setDialogOpen(true);
  };

  const handleSave = async (): Promise<void> => {
    try {
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, form);
        showSnackbar('Cliente actualizado');
      } else {
        await customerService.createCustomer(form);
        showSnackbar('Cliente creado');
      }
      setDialogOpen(false);
      fetchCustomers();
    } catch {
      showSnackbar('Error al guardar cliente', 'error');
    }
  };

  const handleToggle = async (): Promise<void> => {
    if (!toggleTarget) return;
    try {
      await customerService.toggleCustomerStatus(toggleTarget.id);
      showSnackbar(`Cliente ${toggleTarget.status === 'activo' ? 'desactivado' : 'activado'}`);
      fetchCustomers();
    } catch {
      showSnackbar('Error al cambiar estado', 'error');
    }
    setConfirmOpen(false);
    setToggleTarget(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Clientes</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Nuevo Cliente</Button>
      </Box>

      <TextField
        placeholder="Buscar por nombre o telefono..."
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
              <TableCell>Nombre</TableCell>
              <TableCell>Telefono</TableCell>
              <TableCell>Telefono Alt.</TableCell>
              <TableCell>Direccion</TableCell>
              <TableCell>Estado</TableCell>
              {isAdmin && <TableCell>Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.alternatePhone ?? '-'}</TableCell>
                <TableCell>{c.address ?? '-'}</TableCell>
                <TableCell><StatusChip status={c.status} /></TableCell>
                {isAdmin && (
                  <TableCell>
                    <IconButton size="small" onClick={() => openEdit(c)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => { setToggleTarget(c); setConfirmOpen(true); }}>
                      {c.status === 'activo' ? <ToggleOff fontSize="small" /> : <ToggleOn fontSize="small" color="success" />}
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center">No hay clientes</TableCell></TableRow>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} margin="dense" autoFocus />
          <TextField fullWidth label="Telefono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} margin="dense" />
          <TextField fullWidth label="Telefono alternativo" value={form.alternatePhone ?? ''} onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })} margin="dense" />
          <TextField fullWidth label="Direccion" value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} margin="dense" multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name || !form.phone}>Guardar</Button>
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
