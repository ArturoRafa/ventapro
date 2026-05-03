import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, TextField, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Chip, LinearProgress, Alert,
  Autocomplete, Snackbar,
} from '@mui/material';
import { Visibility, Payment, CheckCircle } from '@mui/icons-material';
import type { Credit, CreditFilters } from '../types/credit.types';
import type { CashRegister } from '../types/cash-register.types';
import type { Customer } from '../types/customer.types';
import * as creditService from '../services/credit.service';
import * as cashRegisterService from '../services/cash-register.service';
import * as customerService from '../services/customer.service';
import WhatsAppButton from '../components/ui/WhatsAppButton';
import { useSnackbar } from '../context/SnackbarContext';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency } from '../utils/formatCurrency';
import { useResponsive } from '../hooks/useResponsive';

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', { dateStyle: 'short' });
}

export default function CreditsPage(): React.ReactElement {
  const { config } = useConfig();
  const { showSnackbar } = useSnackbar();
  const { isMobile } = useResponsive();

  // List
  const [credits, setCredits] = useState<Credit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filterCustomerId, setFilterCustomerId] = useState<number | undefined>(undefined);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Payment dialog
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentCreditId, setPaymentCreditId] = useState<number>(0);
  const [paymentMaxAmount, setPaymentMaxAmount] = useState<number>(0);
  const [paymentCustomerName, setPaymentCustomerName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentCustomerPhone, setPaymentCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Post-payment snackbar
  const [postPaymentOpen, setPostPaymentOpen] = useState(false);
  const [lastPaymentInfo, setLastPaymentInfo] = useState<{
    amount: number; customerName: string; customerPhone: string; pendingBalance: number;
  } | null>(null);

  // Register check (for payments)
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null | undefined>(undefined);

  useEffect(() => {
    cashRegisterService.getCurrent().then(setCurrentRegister).catch(() => setCurrentRegister(null));
  }, []);

  useEffect(() => {
    customerService.getCustomers({ limit: 200, status: 'activo' })
      .then((r) => setCustomers(r.data)).catch(() => {});
  }, []);

  const fetchCredits = useCallback(async () => {
    setLoading(true);
    try {
      const filters: CreditFilters = { page: page + 1, limit };
      if (filterStatus) filters.status = filterStatus as 'pending' | 'paid';
      if (filterCustomerId) filters.customerId = filterCustomerId;
      if (filterFrom) filters.from = filterFrom;
      if (filterTo) filters.to = filterTo;
      const result = await creditService.getAll(filters);
      setCredits(result.data);
      setTotal(result.meta.total);
    } catch {
      showSnackbar('Error al cargar creditos', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterStatus, filterCustomerId, filterFrom, filterTo, showSnackbar]);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  const handleViewDetail = async (id: number): Promise<void> => {
    setLoadingDetail(true);
    setDetailOpen(true);
    try {
      const credit = await creditService.getById(id);
      setSelectedCredit(credit);
    } catch {
      showSnackbar('Error al cargar detalle', 'error');
      setDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openPaymentDialog = (credit: Credit): void => {
    setPaymentCreditId(credit.id);
    setPaymentMaxAmount(credit.pendingBalance);
    setPaymentCustomerName(credit.customer?.name ?? '');
    setPaymentCustomerPhone(credit.customer?.phone ?? '');
    setPaymentAmount('');
    setPaymentNotes('');
    setPaymentOpen(true);
  };

  const handlePayment = async (): Promise<void> => {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0 || amount > paymentMaxAmount) return;

    if (config?.usesCashRegister !== false && !currentRegister) {
      showSnackbar('Debes tener una caja abierta para registrar abonos', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await creditService.createPayment(paymentCreditId, {
        amount,
        notes: paymentNotes || undefined,
      });
      setPaymentOpen(false);
      setDetailOpen(false);
      setLastPaymentInfo({
        amount,
        customerName: paymentCustomerName,
        customerPhone: paymentCustomerPhone,
        pendingBalance: paymentMaxAmount - amount,
      });
      setPostPaymentOpen(true);
      fetchCredits();
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Error al registrar abono', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const amountError = (): string => {
    const val = Number(paymentAmount);
    if (paymentAmount && val <= 0) return 'Debe ser mayor a $0';
    if (paymentAmount && val > paymentMaxAmount) return `No puede superar ${formatCurrency(paymentMaxAmount)}`;
    return '';
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Creditos</Typography>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Autocomplete
          options={customers}
          getOptionLabel={(c) => c.name}
          value={customers.find((c) => c.id === filterCustomerId) ?? null}
          onChange={(_, val) => { setFilterCustomerId(val?.id); setPage(0); }}
          renderInput={(params) => <TextField {...params} label="Cliente" size="small" />}
          size="small"
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Estado</InputLabel>
          <Select value={filterStatus} label="Estado" onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="pending">Pendiente</MenuItem>
            <MenuItem value="paid">Pagado</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" type="date" label="Desde" InputLabelProps={{ shrink: true }} value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); setPage(0); }} />
        <TextField size="small" type="date" label="Hasta" InputLabelProps={{ shrink: true }} value={filterTo} onChange={(e) => { setFilterTo(e.target.value); setPage(0); }} />
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Venta #</TableCell>
                <TableCell align="right">Monto Total</TableCell>
                <TableCell align="right">Saldo Pendiente</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {credits.map((c) => (
                <TableRow key={c.id} sx={c.status === 'paid' ? { opacity: 0.7 } : {}}>
                  <TableCell>{c.id}</TableCell>
                  <TableCell>{c.customer?.name ?? '-'}</TableCell>
                  <TableCell>#{c.saleId}</TableCell>
                  <TableCell align="right">{formatCurrency(c.totalAmount)}</TableCell>
                  <TableCell align="right" sx={{ color: c.pendingBalance > 0 ? 'error.main' : 'success.main' }}>
                    {formatCurrency(c.pendingBalance)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={c.status === 'pending' ? 'Pendiente' : 'Pagado'}
                      color={c.status === 'pending' ? 'warning' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(c.createdAt)}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleViewDetail(c.id)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                    {c.status === 'pending' && (
                      <IconButton size="small" onClick={() => openPaymentDialog(c)} color="primary">
                        <Payment fontSize="small" />
                      </IconButton>
                    )}
                    {config?.usesWhatsapp && c.customer?.phone && c.status === 'pending' && (
                      <WhatsAppButton
                        phone={c.customer.phone}
                        message={`Hola ${c.customer.name}, te recordamos que tienes un saldo pendiente de ${formatCurrency(c.pendingBalance)} en ${config?.businessName ?? 'nuestra tienda'}.\nPuedes acercarte a realizar tu abono.\nGracias!`}
                        variant="icon"
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {credits.length === 0 && (
                <TableRow><TableCell colSpan={8} align="center">No hay creditos</TableCell></TableRow>
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

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Credito #{selectedCredit?.id}</DialogTitle>
        <DialogContent>
          {loadingDetail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : selectedCredit && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Cliente</Typography>
                  <Typography>{selectedCredit.customer?.name ?? '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Venta</Typography>
                  <Typography>#{selectedCredit.saleId}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Fecha</Typography>
                  <Typography>{formatDate(selectedCredit.createdAt)}</Typography>
                </Box>
              </Box>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Monto total:</Typography>
                  <Typography fontWeight="bold">{formatCurrency(selectedCredit.totalAmount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Total abonado:</Typography>
                  <Typography color="success.main">{formatCurrency(selectedCredit.totalAmount - selectedCredit.pendingBalance)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography color="text.secondary">Saldo pendiente:</Typography>
                  <Typography color="error.main" fontWeight="bold">{formatCurrency(selectedCredit.pendingBalance)}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={selectedCredit.totalAmount > 0 ? ((selectedCredit.totalAmount - selectedCredit.pendingBalance) / selectedCredit.totalAmount) * 100 : 0}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Paper>

              {/* Payments history */}
              {selectedCredit.payments && selectedCredit.payments.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Historial de Abonos</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Fecha</TableCell>
                          <TableCell align="right">Monto</TableCell>
                          <TableCell>Notas</TableCell>
                          <TableCell>Caja</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedCredit.payments.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>{formatDateTime(p.date)}</TableCell>
                            <TableCell align="right">{formatCurrency(p.amount)}</TableCell>
                            <TableCell>{p.notes ?? '-'}</TableCell>
                            <TableCell>#{p.cashRegisterId}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {config?.usesWhatsapp && selectedCredit?.customer?.phone && selectedCredit?.status === 'pending' && (
            <WhatsAppButton
              phone={selectedCredit.customer.phone}
              message={`Hola ${selectedCredit.customer.name}, te recordamos que tienes un saldo pendiente de ${formatCurrency(selectedCredit.pendingBalance)} en ${config?.businessName ?? 'nuestra tienda'}.\nPuedes acercarte a realizar tu abono.\nGracias!`}
              variant="button"
            />
          )}
          {selectedCredit?.status === 'pending' && (
            <Button variant="contained" onClick={() => { setDetailOpen(false); openPaymentDialog(selectedCredit); }}>
              Registrar Abono
            </Button>
          )}
          <Button onClick={() => setDetailOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Registrar Abono</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            Credito #{paymentCreditId} — {paymentCustomerName}<br />
            Saldo pendiente: <strong>{formatCurrency(paymentMaxAmount)}</strong>
          </Alert>

          {config?.usesCashRegister !== false && !currentRegister && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Requiere tener una caja abierta para registrar abonos
            </Alert>
          )}

          <TextField
            fullWidth
            label="Monto del abono"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            margin="dense"
            required
            error={!!amountError()}
            helperText={amountError() || `Debe ser mayor a $0 y menor o igual a ${formatCurrency(paymentMaxAmount)}`}
            inputProps={{ min: 1, max: paymentMaxAmount }}
          />
          <TextField
            fullWidth
            label="Notas"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            margin="dense"
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handlePayment}
            disabled={submitting || !!amountError() || !paymentAmount || (config?.usesCashRegister !== false && !currentRegister)}
          >
            Registrar Abono
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post-payment Snackbar with WhatsApp */}
      <Snackbar
        open={postPaymentOpen}
        autoHideDuration={8000}
        onClose={() => setPostPaymentOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            <Typography>Abono de {lastPaymentInfo ? formatCurrency(lastPaymentInfo.amount) : ''} registrado</Typography>
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {config?.usesWhatsapp && lastPaymentInfo?.customerPhone && (
              <WhatsAppButton
                phone={lastPaymentInfo.customerPhone}
                message={`Hola ${lastPaymentInfo.customerName}, registramos tu abono de ${formatCurrency(lastPaymentInfo.amount)}.\nTu saldo pendiente es ${formatCurrency(lastPaymentInfo.pendingBalance)}.\nGracias por tu pago!`}
                variant="button"
                label="WhatsApp"
              />
            )}
            <Button color="inherit" size="small" onClick={() => setPostPaymentOpen(false)}>OK</Button>
          </Box>
        }
      />
    </Box>
  );
}
