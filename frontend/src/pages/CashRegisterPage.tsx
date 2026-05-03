import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, FormControl, InputLabel, Select, MenuItem, Grid,
} from '@mui/material';
import { Visibility, LockOpen, Lock } from '@mui/icons-material';
import type { CashRegister, CashRegisterFilters } from '../types/cash-register.types';
import type { UserSummary } from '../services/user.service';
import * as cashRegisterService from '../services/cash-register.service';
import * as userService from '../services/user.service';
import { useSnackbar } from '../context/SnackbarContext';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency } from '../utils/formatCurrency';
import { useResponsive } from '../hooks/useResponsive';

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function getElapsedTime(from: string): string {
  const diff = Date.now() - new Date(from).getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

export default function CashRegisterPage(): React.ReactElement {
  const { user } = useAuth();
  const { config } = useConfig();
  const { showSnackbar } = useSnackbar();
  const { isMobile } = useResponsive();
  const isAdmin = user?.role === 'admin';

  // Current register
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(true);

  // History (admin)
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [filterCashierId, setFilterCashierId] = useState<string>('');
  const [cashiers, setCashiers] = useState<UserSummary[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Dialogs
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRegister, setSelectedRegister] = useState<CashRegister | null>(null);
  const [closeSummary, setCloseSummary] = useState<CashRegister | null>(null);

  // Forms
  const [openAmount, setOpenAmount] = useState<string>('');
  const [closeAmount, setCloseAmount] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCurrent = useCallback(async () => {
    setLoadingCurrent(true);
    try {
      const result = await cashRegisterService.getCurrent();
      setCurrentRegister(result);
    } catch {
      showSnackbar('Error al cargar estado de caja', 'error');
    } finally {
      setLoadingCurrent(false);
    }
  }, [showSnackbar]);

  const fetchHistory = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingHistory(true);
    try {
      const filters: CashRegisterFilters = { page: page + 1, limit };
      if (filterCashierId) filters.cashierId = Number(filterCashierId);
      if (filterStatus) filters.status = filterStatus as 'abierta' | 'cerrada';
      if (filterFrom) filters.from = filterFrom;
      if (filterTo) filters.to = filterTo;
      const result = await cashRegisterService.getAll(filters);
      setRegisters(result.data);
      setTotal(result.meta.total);
    } catch {
      showSnackbar('Error al cargar historial', 'error');
    } finally {
      setLoadingHistory(false);
    }
  }, [isAdmin, page, limit, filterCashierId, filterStatus, filterFrom, filterTo, showSnackbar]);

  useEffect(() => { fetchCurrent(); }, [fetchCurrent]);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  useEffect(() => {
    if (isAdmin) {
      userService.getUsers().then(setCashiers).catch(() => {});
    }
  }, [isAdmin]);

  // Open register
  const handleOpen = async (): Promise<void> => {
    setSubmitting(true);
    try {
      const amount = openAmount ? Number(openAmount) : undefined;
      await cashRegisterService.openRegister({ initialAmount: amount });
      showSnackbar('Caja abierta exitosamente');
      setOpenDialogOpen(false);
      setOpenAmount('');
      fetchCurrent();
      fetchHistory();
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Error al abrir caja', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Close register
  const handleClose = async (): Promise<void> => {
    if (!closeAmount) return;
    setSubmitting(true);
    try {
      const result = await cashRegisterService.closeRegister({
        actualCloseAmount: Number(closeAmount),
        closingNotes: closeNotes || undefined,
      });
      setCloseSummary(result);
      setCloseDialogOpen(false);
      setCloseAmount('');
      setCloseNotes('');
      setSummaryDialogOpen(true);
      fetchCurrent();
      fetchHistory();
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Error al cerrar caja', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // View detail
  const handleViewDetail = async (id: number): Promise<void> => {
    try {
      const register = await cashRegisterService.getById(id);
      setSelectedRegister(register);
      setDetailDialogOpen(true);
    } catch {
      showSnackbar('Error al cargar detalle', 'error');
    }
  };

  const getDifferenceColor = (diff: number | null): string => {
    if (diff === null) return 'inherit';
    return diff >= 0 ? 'success.main' : 'error.main';
  };

  const requiresAmount = config?.requiresOpeningAmount === true;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Caja Registradora</Typography>

      {/* Current register status card */}
      {loadingCurrent ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
        <Paper sx={{ p: 3, mb: 4, borderLeft: 4, borderColor: currentRegister ? 'success.main' : 'grey.400' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {currentRegister ? <LockOpen color="success" /> : <Lock color="disabled" />}
                <Chip
                  label={currentRegister ? 'Abierta' : 'Sin caja abierta'}
                  color={currentRegister ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              {currentRegister ? (
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Cajero</Typography>
                    <Typography variant="body1">{currentRegister.cashier?.name ?? '-'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Apertura</Typography>
                    <Typography variant="body1">{formatDateTime(currentRegister.openedAt)}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Monto inicial</Typography>
                    <Typography variant="body1">{currentRegister.initialAmount !== null ? formatCurrency(currentRegister.initialAmount) : '-'}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Tiempo abierta</Typography>
                    <Typography variant="body1">{getElapsedTime(currentRegister.openedAt)}</Typography>
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary">No tienes una caja abierta. Abre una caja para comenzar a vender.</Typography>
              )}
            </Box>
            <Box>
              {currentRegister ? (
                <Button variant="contained" color="warning" onClick={() => setCloseDialogOpen(true)}>
                  Cerrar Caja
                </Button>
              ) : (
                <Button variant="contained" onClick={() => setOpenDialogOpen(true)}>
                  Abrir Caja
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Admin history section */}
      {isAdmin && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>Historial de Cajas</Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Cajero</InputLabel>
              <Select value={filterCashierId} label="Cajero" onChange={(e) => { setFilterCashierId(e.target.value); setPage(0); }}>
                <MenuItem value="">Todos</MenuItem>
                {cashiers.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Estado</InputLabel>
              <Select value={filterStatus} label="Estado" onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="abierta">Abierta</MenuItem>
                <MenuItem value="cerrada">Cerrada</MenuItem>
              </Select>
            </FormControl>
            <TextField size="small" type="date" label="Desde" InputLabelProps={{ shrink: true }} value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); setPage(0); }} />
            <TextField size="small" type="date" label="Hasta" InputLabelProps={{ shrink: true }} value={filterTo} onChange={(e) => { setFilterTo(e.target.value); setPage(0); }} />
          </Box>

          {loadingHistory ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Cajero</TableCell>
                    <TableCell align="right">M. Inicial</TableCell>
                    <TableCell align="right">Cierre Sistema</TableCell>
                    <TableCell align="right">Cierre Real</TableCell>
                    <TableCell align="right">Diferencia</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Apertura</TableCell>
                    <TableCell>Cierre</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registers.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.cashier?.name ?? '-'}</TableCell>
                      <TableCell align="right">{r.initialAmount !== null ? formatCurrency(r.initialAmount) : '-'}</TableCell>
                      <TableCell align="right">{r.systemCloseAmount !== null ? formatCurrency(r.systemCloseAmount) : '-'}</TableCell>
                      <TableCell align="right">{r.actualCloseAmount !== null ? formatCurrency(r.actualCloseAmount) : '-'}</TableCell>
                      <TableCell align="right" sx={{ color: getDifferenceColor(r.difference) }}>
                        {r.difference !== null ? formatCurrency(r.difference) : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip label={r.status === 'abierta' ? 'Abierta' : 'Cerrada'} color={r.status === 'abierta' ? 'success' : 'default'} size="small" />
                      </TableCell>
                      <TableCell>{formatDateTime(r.openedAt)}</TableCell>
                      <TableCell>{r.closedAt ? formatDateTime(r.closedAt) : '-'}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleViewDetail(r.id)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {registers.length === 0 && (
                    <TableRow><TableCell colSpan={10} align="center">Sin historial de cajas</TableCell></TableRow>
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
        </>
      )}

      {/* Dialog: Abrir Caja */}
      <Dialog open={openDialogOpen} onClose={() => setOpenDialogOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Abrir Caja</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Monto inicial"
            type="number"
            value={openAmount}
            onChange={(e) => setOpenAmount(e.target.value)}
            margin="dense"
            required={requiresAmount}
            helperText={requiresAmount ? 'Requerido' : 'Opcional'}
            inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleOpen}
            disabled={submitting || (requiresAmount && !openAmount)}
          >
            Abrir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Cerrar Caja */}
      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Cerrar Caja</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Monto real en caja"
            type="number"
            value={closeAmount}
            onChange={(e) => setCloseAmount(e.target.value)}
            margin="dense"
            required
            inputProps={{ min: 0 }}
          />
          <TextField
            fullWidth
            label="Notas de cierre"
            value={closeNotes}
            onChange={(e) => setCloseNotes(e.target.value)}
            margin="dense"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleClose}
            disabled={submitting || !closeAmount}
          >
            Cerrar Caja
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Resumen de Cierre */}
      <Dialog open={summaryDialogOpen} onClose={() => setSummaryDialogOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Resumen de Cierre</DialogTitle>
        <DialogContent>
          {closeSummary && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Monto inicial:</Typography>
                <Typography>{closeSummary.initialAmount !== null ? formatCurrency(closeSummary.initialAmount) : '-'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Monto sistema:</Typography>
                <Typography>{closeSummary.systemCloseAmount !== null ? formatCurrency(closeSummary.systemCloseAmount) : '-'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Monto real:</Typography>
                <Typography>{closeSummary.actualCloseAmount !== null ? formatCurrency(closeSummary.actualCloseAmount) : '-'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography color="text.secondary">Diferencia:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: getDifferenceColor(closeSummary.difference), fontWeight: 'bold' }}>
                    {closeSummary.difference !== null ? formatCurrency(closeSummary.difference) : '-'}
                  </Typography>
                  {closeSummary.difference !== null && (
                    <Chip
                      label={closeSummary.difference >= 0 ? (closeSummary.difference === 0 ? 'Cuadre' : 'Sobrante') : 'Faltante'}
                      color={closeSummary.difference >= 0 ? 'success' : 'error'}
                      size="small"
                    />
                  )}
                </Box>
              </Box>
              {closeSummary.closingNotes && (
                <Box>
                  <Typography color="text.secondary" sx={{ mb: 0.5 }}>Notas:</Typography>
                  <Typography variant="body2">{closeSummary.closingNotes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setSummaryDialogOpen(false)}>Aceptar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Detalle Caja */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Detalle Caja #{selectedRegister?.id}</DialogTitle>
        <DialogContent>
          {selectedRegister && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Cajero</Typography>
                  <Typography>{selectedRegister.cashier?.name ?? '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Estado</Typography>
                  <Chip label={selectedRegister.status === 'abierta' ? 'Abierta' : 'Cerrada'} color={selectedRegister.status === 'abierta' ? 'success' : 'default'} size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Apertura</Typography>
                  <Typography>{formatDateTime(selectedRegister.openedAt)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Cierre</Typography>
                  <Typography>{selectedRegister.closedAt ? formatDateTime(selectedRegister.closedAt) : '-'}</Typography>
                </Grid>
              </Grid>
              <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Monto inicial:</Typography>
                  <Typography>{selectedRegister.initialAmount !== null ? formatCurrency(selectedRegister.initialAmount) : '-'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Cierre sistema:</Typography>
                  <Typography>{selectedRegister.systemCloseAmount !== null ? formatCurrency(selectedRegister.systemCloseAmount) : '-'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Cierre real:</Typography>
                  <Typography>{selectedRegister.actualCloseAmount !== null ? formatCurrency(selectedRegister.actualCloseAmount) : '-'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Diferencia:</Typography>
                  <Typography sx={{ color: getDifferenceColor(selectedRegister.difference), fontWeight: 'bold' }}>
                    {selectedRegister.difference !== null ? formatCurrency(selectedRegister.difference) : '-'}
                  </Typography>
                </Box>
              </Box>
              {selectedRegister.closingNotes && (
                <Box>
                  <Typography color="text.secondary" sx={{ mb: 0.5 }}>Notas:</Typography>
                  <Typography variant="body2">{selectedRegister.closingNotes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
