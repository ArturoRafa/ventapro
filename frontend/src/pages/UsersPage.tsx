import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Tooltip,
} from '@mui/material';
import { Add, Edit, ToggleOn, ToggleOff } from '@mui/icons-material';
import type { UserAdmin, CreateUserDto, UpdateUserDto } from '../services/user.service';
import * as userService from '../services/user.service';
import StatusChip from '../components/ui/StatusChip';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useSnackbar } from '../context/SnackbarContext';
import { useAuth } from '../context/AuthContext';

interface FormState {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'cashier';
}

const EMPTY_FORM: FormState = { name: '', email: '', password: '', role: 'cashier' };

export default function UsersPage(): React.ReactElement {
  const { user: currentUser } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAdmin | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<UserAdmin | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch {
      showSnackbar('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = (): void => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (u: UserAdmin): void => {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setDialogOpen(true);
  };

  const handleSave = async (): Promise<void> => {
    try {
      if (editingUser) {
        const dto: UpdateUserDto = { name: form.name, email: form.email, role: form.role };
        if (form.password) dto.password = form.password;
        await userService.updateUser(editingUser.id, dto);
        showSnackbar('Usuario actualizado');
      } else {
        const dto: CreateUserDto = { name: form.name, email: form.email, password: form.password, role: form.role };
        await userService.createUser(dto);
        showSnackbar('Usuario creado');
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar usuario';
      showSnackbar(msg, 'error');
    }
  };

  const handleToggle = async (): Promise<void> => {
    if (!toggleTarget) return;
    try {
      await userService.toggleUserStatus(toggleTarget.id);
      showSnackbar(`Usuario ${toggleTarget.status === 'activo' ? 'desactivado' : 'activado'}`);
      fetchUsers();
    } catch {
      showSnackbar('Error al cambiar estado', 'error');
    }
    setConfirmOpen(false);
    setToggleTarget(null);
  };

  const isSaveDisabled = !form.name || !form.email || (!editingUser && !form.password);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Usuarios</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Nuevo Usuario</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Creado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={u.role === 'admin' ? 'Admin' : 'Cajero'}
                      size="small"
                      color={u.role === 'admin' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell><StatusChip status={u.status} /></TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleDateString('es-CO')}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEdit(u)}><Edit fontSize="small" /></IconButton>
                    <Tooltip title={u.id === currentUser?.id ? 'No puedes desactivar tu propia cuenta' : ''}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={u.id === currentUser?.id}
                          onClick={() => { setToggleTarget(u); setConfirmOpen(true); }}
                        >
                          {u.status === 'activo'
                            ? <ToggleOff fontSize="small" />
                            : <ToggleOn fontSize="small" color="success" />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center">No hay usuarios</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Nombre" value={form.name} margin="dense" autoFocus
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            fullWidth label="Email" type="email" value={form.email} margin="dense"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            fullWidth
            label={editingUser ? 'Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
            type="password"
            value={form.password}
            margin="dense"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            helperText={editingUser ? undefined : 'Mínimo 8 caracteres'}
          />
          <TextField
            fullWidth select label="Rol" value={form.role} margin="dense"
            onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'cashier' })}
          >
            <MenuItem value="cashier">Cajero</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaveDisabled}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Cambiar estado"
        message={`¿Deseas ${toggleTarget?.status === 'activo' ? 'desactivar' : 'activar'} a "${toggleTarget?.name}"?`}
        onConfirm={handleToggle}
        onCancel={() => { setConfirmOpen(false); setToggleTarget(null); }}
      />
    </Box>
  );
}
