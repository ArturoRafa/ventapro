import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, TextField, Chip, Card, CardActionArea, CardContent,
  IconButton, ToggleButtonGroup, ToggleButton, Checkbox, FormControlLabel,
  Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar,
  CircularProgress, Divider, Alert,
} from '@mui/material';
import { Add, Remove, Close, PointOfSale, CheckCircle, PictureAsPdf, ShoppingCart } from '@mui/icons-material';
import { Tabs, Tab, Badge } from '@mui/material';
import type { Product } from '../types/product.types';
import type { Category } from '../types/category.types';
import type { Customer } from '../types/customer.types';
import type { CashRegister } from '../types/cash-register.types';
import type { Sale, CreateSaleDto } from '../types/sale.types';
import * as productService from '../services/product.service';
import * as categoryService from '../services/category.service';
import * as customerService from '../services/customer.service';
import * as cashRegisterService from '../services/cash-register.service';
import * as saleService from '../services/sale.service';
import WhatsAppButton from '../components/ui/WhatsAppButton';
import EmptyState from '../components/ui/EmptyState';
import { useSnackbar } from '../context/SnackbarContext';
import { useConfig } from '../context/ConfigContext';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency } from '../utils/formatCurrency';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function PosPage(): React.ReactElement {
  const { config } = useConfig();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  // Mobile tab state
  const [posTab, setPosTab] = useState(0);

  // Register check
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null | undefined>(undefined);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [isCredit, setIsCredit] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Post-sale snackbar
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [postSaleOpen, setPostSaleOpen] = useState(false);

  // Fetch register
  useEffect(() => {
    cashRegisterService.getCurrent().then(setCurrentRegister).catch(() => setCurrentRegister(null));
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const result = await productService.getProducts({ page: 1, limit: 500, status: 'activo' });
      setProducts(result.data);
    } catch {
      showSnackbar('Error al cargar productos', 'error');
    } finally {
      setLoadingProducts(false);
    }
  }, [showSnackbar]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Fetch categories
  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Fetch customers (for credit)
  useEffect(() => {
    if (config?.usesCredit) {
      customerService.getCustomers({ limit: 200, status: 'activo' }).then((r) => setCustomers(r.data)).catch(() => {});
    }
  }, [config?.usesCredit]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term));
    }
    if (selectedCategoryId) {
      filtered = filtered.filter((p) => p.subcategory?.category?.id === selectedCategoryId);
    }
    return filtered;
  }, [products, debouncedSearch, selectedCategoryId]);

  // Cart helpers
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const addToCart = (product: Product): void => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (product.type === 'inventory' && existing.quantity >= product.stock) {
          showSnackbar('Stock insuficiente', 'warning');
          return prev;
        }
        return prev.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (product.type === 'inventory' && product.stock <= 0) {
        showSnackbar('Producto sin stock', 'warning');
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number): void => {
    setCart((prev) => prev.map((item) => {
      if (item.product.id !== productId) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      if (item.product.type === 'inventory' && newQty > item.product.stock) {
        showSnackbar('Stock insuficiente', 'warning');
        return item;
      }
      return { ...item, quantity: newQty };
    }));
  };

  const removeFromCart = (productId: number): void => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Credit toggle
  const handleCreditToggle = (checked: boolean): void => {
    setIsCredit(checked);
    if (checked) {
      setPaymentMethod('cash');
    }
  };

  // Submit sale
  const handleConfirmSale = async (): Promise<void> => {
    setSubmitting(true);
    try {
      const dto: CreateSaleDto = {
        items: cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        paymentMethod,
        ...(isCredit && selectedCustomer ? { customerId: selectedCustomer.id, status: 'pending' as const } : {}),
      };
      const sale = await saleService.create(dto);
      setLastSale(sale);
      setCart([]);
      setIsCredit(false);
      setSelectedCustomer(null);
      setPaymentMethod('cash');
      setConfirmOpen(false);
      setPostSaleOpen(true);
      fetchProducts();
    } catch (err) {
      showSnackbar(err instanceof Error ? err.message : 'Error al registrar venta', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const canCharge = cart.length > 0 && (!isCredit || selectedCustomer !== null);

  const paymentLabels: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' };

  // Gate: no open register
  if (currentRegister === undefined) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  if (config?.usesCashRegister !== false && currentRegister === null) {
    return (
      <EmptyState
        icon={<PointOfSale />}
        title="Debes abrir una caja"
        subtitle="No puedes realizar ventas sin una caja activa"
        action={{ label: 'Ir a Caja', onClick: () => navigate('/caja') }}
      />
    );
  }

  const productsPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Box sx={{ p: 2, pb: 1 }}>
        <TextField
          fullWidth
          placeholder="Buscar producto..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', pb: 1 }}>
          <Chip
            label="Todas"
            variant={selectedCategoryId === null ? 'filled' : 'outlined'}
            color={selectedCategoryId === null ? 'primary' : 'default'}
            onClick={() => setSelectedCategoryId(null)}
            size="small"
          />
          {categories.filter((c) => c.status === 'activo').map((cat) => (
            <Chip
              key={cat.id}
              label={cat.name}
              variant={selectedCategoryId === cat.id ? 'filled' : 'outlined'}
              color={selectedCategoryId === cat.id ? 'primary' : 'default'}
              onClick={() => setSelectedCategoryId(cat.id)}
              size="small"
            />
          ))}
        </Box>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, pt: 1 }}>
        {loadingProducts ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : filteredProducts.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            {debouncedSearch ? `Sin resultados para "${debouncedSearch}"` : 'No hay productos'}
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '140px' : '145px'}, 1fr))`, gap: 1 }}>
            {filteredProducts.map((product) => {
              const isOutOfStock = product.type === 'inventory' && product.stock <= 0;
              const isLowStock = product.type === 'inventory' && product.stock > 0 && product.stock <= product.minStock;
              return (
                <Card
                  key={product.id}
                  sx={{
                    opacity: isOutOfStock ? 0.5 : 1,
                    borderLeft: 3,
                    borderColor: isOutOfStock ? 'error.main' : isLowStock ? 'warning.main' : 'transparent',
                  }}
                >
                  <CardActionArea onClick={() => addToCart(product)} disabled={isOutOfStock}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="body2" fontWeight="bold" noWrap>{product.name}</Typography>
                      <Typography variant="body2" color="primary">{formatCurrency(product.price)}</Typography>
                      <Chip
                        label={product.type === 'food' ? 'Comida' : `stk: ${product.stock}`}
                        size="small"
                        color={product.type === 'food' ? 'info' : isLowStock ? 'warning' : 'success'}
                        sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
                      />
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );

  const cartPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, bgcolor: isMobile ? 'transparent' : 'grey.50' }}>
      {!isMobile && (
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="h6">
            Carrito {cartCount > 0 && <Chip label={cartCount} size="small" color="primary" sx={{ ml: 1 }} />}
          </Typography>
        </Box>
      )}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2 }}>
        {cart.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>Carrito vacio</Typography>
        ) : (
          cart.map((item) => (
            <Box key={item.product.id} sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight="bold" noWrap>{item.product.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatCurrency(item.product.price)} x {item.quantity} = {formatCurrency(item.product.price * item.quantity)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                <IconButton size="small" onClick={() => updateQuantity(item.product.id, -1)} disabled={item.quantity <= 1}>
                  <Remove fontSize="small" />
                </IconButton>
                <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>{item.quantity}</Typography>
                <IconButton size="small" onClick={() => updateQuantity(item.product.id, 1)}>
                  <Add fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => removeFromCart(item.product.id)} color="error">
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))
        )}
      </Box>
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Forma de pago</Typography>
        <ToggleButtonGroup
          value={paymentMethod}
          exclusive
          onChange={(_, val) => { if (val) setPaymentMethod(val); }}
          size="small"
          fullWidth
          sx={{ mb: 1.5 }}
        >
          <ToggleButton value="cash">Efectivo</ToggleButton>
          <ToggleButton value="card" disabled={isCredit}>Tarjeta</ToggleButton>
          <ToggleButton value="transfer" disabled={isCredit}>Transferencia</ToggleButton>
        </ToggleButtonGroup>

        {config?.usesCredit && (
          <>
            <FormControlLabel
              control={<Checkbox checked={isCredit} onChange={(e) => handleCreditToggle(e.target.checked)} size="small" />}
              label="Venta a credito (fiado)"
              sx={{ mb: isCredit ? 1 : 0 }}
            />
            {isCredit && (
              <Autocomplete
                options={customers}
                getOptionLabel={(c) => `${c.name}${c.phone ? ` - ${c.phone}` : ''}`}
                value={selectedCustomer}
                onChange={(_, val) => setSelectedCustomer(val)}
                renderInput={(params) => (
                  <TextField {...params} label="Cliente *" size="small" placeholder="Buscar cliente..." />
                )}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                size="small"
                sx={{ mb: 1 }}
              />
            )}
          </>
        )}

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6">TOTAL</Typography>
          <Typography variant="h5" fontWeight="bold">{formatCurrency(cartTotal)}</Typography>
        </Box>

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={() => setConfirmOpen(true)}
          disabled={!canCharge}
          sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' }, py: 1.5, fontSize: '1.1rem' }}
        >
          COBRAR {cartTotal > 0 ? formatCurrency(cartTotal) : ''}
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      height: isMobile ? 'calc(100vh - 64px - 56px)' : 'calc(100vh - 64px)',
      mx: isMobile ? -2 : -3,
      mt: isMobile ? -2 : -3,
      overflow: 'hidden',
    }}>
      {isMobile ? (
        <>
          <Tabs value={posTab} onChange={(_, v) => setPosTab(v)} variant="fullWidth">
            <Tab label="Productos" />
            <Tab label={
              <Badge badgeContent={cartCount} color="primary">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ShoppingCart fontSize="small" /> Carrito
                </Box>
              </Badge>
            } />
          </Tabs>
          {posTab === 0 && productsPanel}
          {posTab === 1 && cartPanel}
        </>
      ) : (
        <>
          <Box sx={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', borderRight: 1, borderColor: 'divider' }}>
            {productsPanel}
          </Box>
          <Box sx={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column' }}>
            {cartPanel}
          </Box>
        </>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle>Confirmar Venta</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
            <Typography>{cartCount} producto{cartCount !== 1 ? 's' : ''}</Typography>
            <Typography>Forma de pago: <strong>{paymentLabels[paymentMethod]}</strong></Typography>
            {isCredit && selectedCustomer && (
              <Alert severity="warning" sx={{ py: 0 }}>
                <strong>VENTA A CREDITO</strong> — {selectedCustomer.name}
              </Alert>
            )}
            <Typography variant="h5" fontWeight="bold" align="center" sx={{ mt: 1 }}>
              Total: {formatCurrency(cartTotal)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirmSale} disabled={submitting} color="success">
            Confirmar Venta
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post-sale Snackbar */}
      <Snackbar
        open={postSaleOpen}
        autoHideDuration={8000}
        onClose={() => setPostSaleOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            <Typography>Venta #{lastSale?.id} registrada correctamente</Typography>
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {config?.usesTicketsPdf && lastSale && (
              <Button
                color="inherit"
                size="small"
                startIcon={<PictureAsPdf />}
                onClick={() => { saleService.downloadTicketPdf(lastSale.id); }}
              >
                Ticket
              </Button>
            )}
            {config?.usesWhatsapp && lastSale?.customer?.phone && (
              <WhatsAppButton
                phone={lastSale.customer.phone}
                message={`Hola ${lastSale.customer.name}, tu compra en ${config?.businessName ?? 'nuestra tienda'}:\nVenta #${lastSale.id}\nTotal: ${formatCurrency(lastSale.total)}\nForma de pago: ${paymentLabels[lastSale.paymentMethod]}\n\nGracias por tu compra!`}
                variant="button"
                label="WhatsApp"
              />
            )}
            <Button color="inherit" size="small" onClick={() => setPostSaleOpen(false)}>OK</Button>
          </Box>
        }
      />
    </Box>
  );
}
