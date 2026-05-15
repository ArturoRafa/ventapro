import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TablePagination, Chip, IconButton,
  TextField, Select, MenuItem, FormControl, InputLabel, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider,
  Stack, SelectChangeEvent,
} from '@mui/material';
import { Visibility, PictureAsPdf } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { useSnackbar } from '../context/SnackbarContext';
import * as saleService from '../services/sale.service';
import { getUsers } from '../services/user.service';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDateTime } from '../utils/dateHelpers';
import type { Sale } from '../types/sale.types';
import type { UserSummary } from '../services/user.service';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

function getFirstDayOfMonth(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export default function SalesHistoryPage(): React.ReactElement {
  const { user } = useAuth();
  const { config } = useConfig();
  const { showSnackbar } = useSnackbar();
  const isAdmin = user?.role === 'admin';

  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 20;
  const [loading, setLoading] = useState(false);

  // Filters
  const [from, setFrom] = useState(getFirstDayOfMonth());
  const [to, setTo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [status, setStatus] = useState('');
  const [cashierId, setCashierId] = useState('');
  const [cashiers, setCashiers] = useState<UserSummary[]>([]);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      getUsers().then(setCashiers).catch(() => {});
    }
  }, [isAdmin]);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const result = await saleService.getAll({
        page: page + 1,
        limit,
        from: from || undefined,
        to: to || undefined,
        paymentMethod: (paymentMethod as Sale['paymentMethod']) || undefined,
        status: (status as Sale['status']) || undefined,
        cashierId: cashierId ? Number(cashierId) : undefined,
      });
      setSales(result.data);
      setTotal(result.meta.total);
    } catch {
      showSnackbar('Error al cargar ventas', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, from, to, paymentMethod, status, cashierId, showSnackbar]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  function handleTextChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setPage(0);
    };
  }

  function handleSelectChange(setter: (v: string) => void) {
    return (e: SelectChangeEvent) => {
      setter(e.target.value);
      setPage(0);
    };
  }

  async function openDetail(id: number) {
    setDetailOpen(true);
    setDetailSale(null);
    setDialogLoading(true);
    try {
      const sale = await saleService.getById(id);
      setDetailSale(sale);
    } catch {
      showSnackbar('Error al cargar detalle', 'error');
      setDetailOpen(false);
    } finally {
      setDialogLoading(false);
    }
  }

  async function handleTicket(id: number) {
    try {
      await saleService.downloadTicketPdf(id);
    } catch {
      showSnackbar('Error al generar ticket', 'error');
    }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {isAdmin ? 'Ventas' : 'Mis Ventas'}
      </Typography>

      {/* Filtros */}
      <Stack direction="row" flexWrap="wrap" gap={2} mb={3}>
        <TextField
          label="Desde"
          type="date"
          size="small"
          value={from}
          onChange={handleTextChange(setFrom)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 160 }}
        />
        <TextField
          label="Hasta"
          type="date"
          size="small"
          value={to}
          onChange={handleTextChange(setTo)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 160 }}
        />
        <FormControl size="small" sx={{ width: 160 }}>
          <InputLabel>Método</InputLabel>
          <Select label="Método" value={paymentMethod} onChange={handleSelectChange(setPaymentMethod)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="cash">Efectivo</MenuItem>
            <MenuItem value="card">Tarjeta</MenuItem>
            <MenuItem value="transfer">Transferencia</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 140 }}>
          <InputLabel>Estado</InputLabel>
          <Select label="Estado" value={status} onChange={handleSelectChange(setStatus)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="paid">Pagado</MenuItem>
            <MenuItem value="pending">Pendiente</MenuItem>
          </Select>
        </FormControl>
        {isAdmin && (
          <FormControl size="small" sx={{ width: 180 }}>
            <InputLabel>Cajero</InputLabel>
            <Select label="Cajero" value={cashierId} onChange={handleSelectChange(setCashierId)}>
              <MenuItem value="">Todos</MenuItem>
              {cashiers.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>

      {/* Tabla */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Fecha y hora</TableCell>
              <TableCell>Cliente</TableCell>
              {isAdmin && <TableCell>Cajero</TableCell>}
              <TableCell>Método</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No hay ventas para los filtros seleccionados</Typography>
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id} hover>
                  <TableCell>{sale.id}</TableCell>
                  <TableCell>{formatDateTime(sale.createdAt)}</TableCell>
                  <TableCell>{sale.customer?.name ?? '-'}</TableCell>
                  {isAdmin && <TableCell>{sale.cashier?.name ?? '-'}</TableCell>}
                  <TableCell>{METHOD_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</TableCell>
                  <TableCell>
                    <Chip
                      label={sale.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      color={sale.status === 'paid' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{formatCurrency(sale.total)}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => openDetail(sale.id)} title="Ver detalle">
                      <Visibility fontSize="small" />
                    </IconButton>
                    {config?.usesTicketsPdf && (
                      <IconButton size="small" onClick={() => handleTicket(sale.id)} title="Descargar ticket">
                        <PictureAsPdf fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={limit}
          rowsPerPageOptions={[20]}
          onPageChange={(_, newPage) => setPage(newPage)}
        />
      </TableContainer>

      {/* Dialog de detalle */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalle de venta #{detailSale?.id}</DialogTitle>
        <DialogContent dividers>
          {dialogLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : detailSale ? (
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Fecha</Typography>
                <Typography variant="body2">{formatDateTime(detailSale.createdAt)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Cajero</Typography>
                <Typography variant="body2">{detailSale.cashier?.name ?? '-'}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Cliente</Typography>
                <Typography variant="body2">{detailSale.customer?.name ?? '-'}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">Método de pago</Typography>
                <Typography variant="body2">{METHOD_LABELS[detailSale.paymentMethod]}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">Estado</Typography>
                <Chip
                  label={detailSale.status === 'paid' ? 'Pagado' : 'Pendiente'}
                  color={detailSale.status === 'paid' ? 'success' : 'warning'}
                  size="small"
                />
              </Stack>

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle2">Productos</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="center">Cant.</TableCell>
                    <TableCell align="right">P. Unit.</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(detailSale.details ?? []).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.product?.name ?? `Producto #${d.productId}`}</TableCell>
                      <TableCell align="center">{d.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(d.unitPrice)}</TableCell>
                      <TableCell align="right">{formatCurrency(d.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Stack direction="row" justifyContent="flex-end" pt={1}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Total: {formatCurrency(detailSale.total)}
                </Typography>
              </Stack>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          {config?.usesTicketsPdf && detailSale && (
            <Button
              startIcon={<PictureAsPdf />}
              onClick={() => handleTicket(detailSale.id)}
              size="small"
            >
              Descargar ticket
            </Button>
          )}
          <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
