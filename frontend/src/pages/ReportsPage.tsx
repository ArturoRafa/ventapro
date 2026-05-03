import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Tabs, Tab, TextField, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Card, CardContent, Grid,
  CircularProgress, FormControl, InputLabel, Select, MenuItem, Chip,
} from '@mui/material';
import type { SalesSummary, TopProduct, CashierSales, CreditSummaryReport, CashRegisterReport } from '../types/report.types';
import * as reportService from '../services/report.service';
import * as userService from '../services/user.service';
import type { UserSummary } from '../services/user.service';
import { useSnackbar } from '../context/SnackbarContext';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency } from '../utils/formatCurrency';

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function KpiCard({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5" fontWeight="bold">{value}</Typography>
      </CardContent>
    </Card>
  );
}

interface TabConfig {
  key: string;
  label: string;
}

export default function ReportsPage(): React.ReactElement {
  const { config } = useConfig();
  const { showSnackbar } = useSnackbar();

  // Tabs
  const tabs: TabConfig[] = [
    { key: 'ventas', label: 'Ventas' },
    { key: 'productos', label: 'Productos Top' },
    { key: 'cajeros', label: 'Por Cajero' },
    ...(config?.usesCredit !== false ? [{ key: 'creditos', label: 'Creditos' }] : []),
    ...(config?.usesCashRegister !== false ? [{ key: 'cajas', label: 'Cajas' }] : []),
  ];

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const activeKey = tabs[activeTabIndex]?.key ?? 'ventas';

  // Date filters
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [from, setFrom] = useState(startOfMonth.toISOString().split('T')[0]);
  const [to, setTo] = useState(now.toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // Tab data
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topSortBy, setTopSortBy] = useState<'quantity' | 'revenue'>('quantity');
  const [topLimit, setTopLimit] = useState(10);
  const [cashierSales, setCashierSales] = useState<CashierSales[]>([]);
  const [creditSummary, setCreditSummary] = useState<CreditSummaryReport | null>(null);
  const [cashRegisterReport, setCashRegisterReport] = useState<CashRegisterReport[]>([]);
  const [cashiers, setCashiers] = useState<UserSummary[]>([]);
  const [cajaCashierId, setCajaCashierId] = useState<number | undefined>(undefined);

  const fetchActiveTab = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { from: from || undefined, to: to || undefined };
      switch (activeKey) {
        case 'ventas': {
          const data = await reportService.getSalesSummary(filters);
          setSalesSummary(data);
          break;
        }
        case 'productos': {
          const data = await reportService.getTopProducts({ ...filters, sortBy: topSortBy, limit: topLimit });
          setTopProducts(data);
          break;
        }
        case 'cajeros': {
          const data = await reportService.getSalesByCashier(filters);
          setCashierSales(data);
          break;
        }
        case 'creditos': {
          const data = await reportService.getCreditSummary();
          setCreditSummary(data);
          break;
        }
        case 'cajas': {
          const data = await reportService.getCashRegisterSummary({
            ...filters,
            ...(cajaCashierId ? { cashierId: cajaCashierId } : {}),
          });
          setCashRegisterReport(data);
          break;
        }
      }
    } catch {
      showSnackbar('Error al cargar reporte', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeKey, from, to, topSortBy, topLimit, cajaCashierId, showSnackbar]);

  useEffect(() => { fetchActiveTab(); }, [fetchActiveTab]);
  useEffect(() => { userService.getUsers().then(setCashiers).catch(() => {}); }, []);

  const getDiffColor = (diff: number | null): string => {
    if (diff === null) return 'inherit';
    return diff >= 0 ? 'success.main' : 'error.main';
  };

  const paymentLabels: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Reportes</Typography>

      <Tabs value={activeTabIndex} onChange={(_, v) => setActiveTabIndex(v)} sx={{ mb: 2 }}>
        {tabs.map((t) => <Tab key={t.key} label={t.label} />)}
      </Tabs>

      {/* Date filter */}
      {activeKey !== 'creditos' && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
          <TextField size="small" type="date" label="Desde" InputLabelProps={{ shrink: true }} value={from} onChange={(e) => setFrom(e.target.value)} />
          <TextField size="small" type="date" label="Hasta" InputLabelProps={{ shrink: true }} value={to} onChange={(e) => setTo(e.target.value)} />
          <Button variant="outlined" onClick={fetchActiveTab}>Aplicar</Button>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
        <>
          {/* Tab: Ventas */}
          {activeKey === 'ventas' && salesSummary && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}><KpiCard label="Total Ventas" value={formatCurrency(salesSummary.totalRevenue)} /></Grid>
                <Grid item xs={12} sm={4}><KpiCard label="Cantidad" value={`${salesSummary.salesCount} ventas`} /></Grid>
                <Grid item xs={12} sm={4}><KpiCard label="Ticket Promedio" value={formatCurrency(salesSummary.averageTicket)} /></Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Por Forma de Pago</Typography>
                    {Object.entries(salesSummary.byPaymentMethod).map(([key, val]) => (
                      <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                        <Typography variant="body2">{paymentLabels[key] ?? key}</Typography>
                        <Typography variant="body2">{formatCurrency(val.total)} ({val.count})</Typography>
                      </Box>
                    ))}
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Por Estado</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2">Pagadas</Typography>
                      <Typography variant="body2">{formatCurrency(salesSummary.byStatus.paid.total)} ({salesSummary.byStatus.paid.count})</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2">Pendientes</Typography>
                      <Typography variant="body2">{formatCurrency(salesSummary.byStatus.pending.total)} ({salesSummary.byStatus.pending.count})</Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab: Productos Top */}
          {activeKey === 'productos' && (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Ordenar por</InputLabel>
                  <Select value={topSortBy} label="Ordenar por" onChange={(e) => setTopSortBy(e.target.value as 'quantity' | 'revenue')}>
                    <MenuItem value="quantity">Cantidad</MenuItem>
                    <MenuItem value="revenue">Ingresos</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>Limite</InputLabel>
                  <Select value={topLimit} label="Limite" onChange={(e) => setTopLimit(Number(e.target.value))}>
                    <MenuItem value={5}>Top 5</MenuItem>
                    <MenuItem value={10}>Top 10</MenuItem>
                    <MenuItem value={20}>Top 20</MenuItem>
                    <MenuItem value={50}>Top 50</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>En el periodo seleccionado</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Codigo</TableCell>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Cantidad Vendida</TableCell>
                      <TableCell align="right">Ingresos</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topProducts.map((p, i) => (
                      <TableRow key={p.productId}>
                        <TableCell>
                          <Chip label={i + 1} size="small" color={i === 0 ? 'warning' : i <= 2 ? 'default' : 'default'}
                            sx={i === 0 ? { bgcolor: '#ffd700', color: '#000' } : i === 1 ? { bgcolor: '#c0c0c0' } : i === 2 ? { bgcolor: '#cd7f32', color: '#fff' } : {}} />
                        </TableCell>
                        <TableCell>{p.productCode}</TableCell>
                        <TableCell>{p.productName}</TableCell>
                        <TableCell align="right">{p.totalQuantity}</TableCell>
                        <TableCell align="right">{formatCurrency(p.totalRevenue)}</TableCell>
                      </TableRow>
                    ))}
                    {topProducts.length === 0 && (
                      <TableRow><TableCell colSpan={5} align="center">Sin datos en el periodo</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Tab: Por Cajero */}
          {activeKey === 'cajeros' && (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Cajero</TableCell>
                    <TableCell align="right">Ventas</TableCell>
                    <TableCell align="right">Total Ingresos</TableCell>
                    <TableCell align="right">Ticket Promedio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cashierSales.map((c) => (
                    <TableRow key={c.cashierId}>
                      <TableCell>{c.cashierName}</TableCell>
                      <TableCell align="right">{c.salesCount}</TableCell>
                      <TableCell align="right">{formatCurrency(c.totalRevenue)}</TableCell>
                      <TableCell align="right">{c.salesCount > 0 ? formatCurrency(c.totalRevenue / c.salesCount) : '-'}</TableCell>
                    </TableRow>
                  ))}
                  {cashierSales.length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center">Sin datos en el periodo</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Tab: Creditos */}
          {activeKey === 'creditos' && creditSummary && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}><KpiCard label="Total Creditos" value={String(creditSummary.summary.totalCredits)} /></Grid>
                <Grid item xs={12} sm={4}><KpiCard label="Total Prestado" value={formatCurrency(creditSummary.summary.totalAmount)} /></Grid>
                <Grid item xs={12} sm={4}><KpiCard label="Saldo Pendiente" value={formatCurrency(creditSummary.summary.totalPending)} /></Grid>
              </Grid>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Deuda por Cliente</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell align="right">Creditos</TableCell>
                      <TableCell align="right">Monto Total</TableCell>
                      <TableCell align="right">Saldo Pendiente</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {creditSummary.byCustomer.map((c) => (
                      <TableRow key={c.customerId}>
                        <TableCell>{c.customerName}</TableCell>
                        <TableCell align="right">{c.creditCount}</TableCell>
                        <TableCell align="right">{formatCurrency(c.totalAmount)}</TableCell>
                        <TableCell align="right" sx={{ color: c.pendingBalance > 0 ? 'error.main' : 'success.main' }}>
                          {formatCurrency(c.pendingBalance)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {creditSummary.byCustomer.length === 0 && (
                      <TableRow><TableCell colSpan={4} align="center">Sin creditos</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Tab: Cajas */}
          {activeKey === 'cajas' && (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Cajero</InputLabel>
                  <Select value={cajaCashierId ?? ''} label="Cajero" onChange={(e) => setCajaCashierId(e.target.value ? Number(e.target.value) : undefined)}>
                    <MenuItem value="">Todos</MenuItem>
                    {cashiers.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Cajero</TableCell>
                    <TableCell>Apertura</TableCell>
                    <TableCell>Cierre</TableCell>
                    <TableCell align="right">Inicial</TableCell>
                    <TableCell align="right">Sistema</TableCell>
                    <TableCell align="right">Real</TableCell>
                    <TableCell align="right">Diferencia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cashRegisterReport.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.cashierName}</TableCell>
                      <TableCell>{formatDateTime(r.openedAt)}</TableCell>
                      <TableCell>{r.closedAt ? formatDateTime(r.closedAt) : '-'}</TableCell>
                      <TableCell align="right">{r.initialAmount !== null ? formatCurrency(r.initialAmount) : '-'}</TableCell>
                      <TableCell align="right">{r.systemCloseAmount !== null ? formatCurrency(r.systemCloseAmount) : '-'}</TableCell>
                      <TableCell align="right">{r.actualCloseAmount !== null ? formatCurrency(r.actualCloseAmount) : '-'}</TableCell>
                      <TableCell align="right" sx={{ color: getDiffColor(r.difference) }}>
                        {r.difference !== null ? formatCurrency(r.difference) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {cashRegisterReport.length === 0 && (
                    <TableRow><TableCell colSpan={8} align="center">Sin datos en el periodo</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
