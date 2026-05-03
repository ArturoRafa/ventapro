# Fase 2 — Frontend: Guía de Implementación

> Documento de referencia con TODOS los puntos importantes para implementar las pantallas de Fase 2.
> Última actualización: 2026-04-22

---

## 1. Estado actual

| Capa | Estado |
|------|--------|
| Backend Fase 2 | ✅ 100% completo (Caja, Ventas, Créditos, Reportes, Tickets PDF) |
| Frontend Fase 1 | ✅ Completo (Login, Productos, Categorías, Inventario, Clientes, Config) |
| Frontend Fase 2 | ⏳ Pendiente — este documento guía su implementación |
| Wireframes | ✅ 11 mocks HTML en `documents/wireframes/` + `index.html` hub |
| Wireframes mobile | ✅ `documents/wireframes/mobile.html` |

---

## 2. Decisiones de diseño tomadas

### WhatsApp
- **Solo switch on/off** (`usesWhatsapp`) en Configuración
- **Eliminar campo `whatsappNumber`** del backend — es peso muerto, nunca se lee
- Implementación: `window.open('https://wa.me/{telefono_cliente}?text={mensaje}')`
- No hay backend para WhatsApp, no hay API de WhatsApp Business
- Botón visible solo si: `usesWhatsapp === true` AND cliente tiene teléfono
- **En POS post-venta:** el botón WhatsApp solo aparece si la venta tuvo cliente asignado (ya sea crédito o efectivo con cliente seleccionado). Una venta anónima en efectivo NO muestra el botón aunque `usesWhatsapp=true` — no hay teléfono al que enviar.

### Subcategorías en Productos
- Campo subcategoría cambia de `<Select>` a **Autocomplete con freeSolo**
- Si el usuario escribe algo que no existe → se crea automáticamente (POST /api/subcategorias)
- El frontend debe manejar: buscar existentes + crear on-the-fly

### Inventario — Dos acciones
- **Editar producto**: cambiar nombre, precio, stock mínimo
- **Ajustar stock**: +/- con razón y preview del nuevo stock
- Son dos botones separados en cada fila (antes era solo uno)

---

## 3. Archivos a crear

### Types (`frontend/src/types/`)

```
cash-register.types.ts
├── CashRegister (id, userId, user?, openingAmount, systemCloseAmount?, realCloseAmount?, difference?, status, notes?, openedAt, closedAt?)
├── OpenCashRegisterDto { openingAmount: number }
└── CloseCashRegisterDto { realCloseAmount: number; notes?: string }

sale.types.ts
├── Sale (id, cashRegisterId, customerId?, customer?, paymentMethod, status, total, items?, creditId?, createdAt)
├── SaleItem (id, saleId, productId, product?, quantity, unitPrice, subtotal)
├── CreateSaleDto { paymentMethod, customerId?, isCredit?, items: CreateSaleItemDto[] }
└── CreateSaleItemDto { productId: number; quantity: number }

credit.types.ts
├── Credit (id, saleId, sale?, customerId, customer?, totalAmount, paidAmount, remainingBalance, status, payments?, createdAt)
├── CreditPayment (id, creditId, cashRegisterId, amount, notes?, createdAt)
└── CreateCreditPaymentDto { amount: number; notes?: string }

report.types.ts
├── SalesSummary { totalRevenue, totalSales, averageTicket, byPaymentMethod[], byStatus[] }
├── TopProduct { productId, code, name, quantitySold, revenue }
├── SalesByCashier { userId, userName, totalSales, totalRevenue }
├── CreditSummary { totalCredits, totalLent, totalPending, byCustomer[] }
└── CashRegisterSummary { id, userName, openingAmount, systemClose, realClose, difference, openedAt, closedAt }
```

### Services (`frontend/src/services/`)

```
cash-register.service.ts
├── getCurrent()           → GET /api/cajas/current
├── open(dto)              → POST /api/cajas/open
├── close(dto)             → POST /api/cajas/close
├── getAll(params)         → GET /api/cajas?page&limit&userId&status&from&to
└── getById(id)            → GET /api/cajas/:id

sale.service.ts
├── create(dto)            → POST /api/ventas
├── getAll(params)         → GET /api/ventas?page&limit
├── getById(id)            → GET /api/ventas/:id
└── getTicketPdf(id)       → GET /api/ventas/:id/ticket (blob)

credit.service.ts
├── getAll(params)         → GET /api/creditos?page&limit&status&customerId&from&to
├── getById(id)            → GET /api/creditos/:id
└── registerPayment(id, dto) → POST /api/creditos/:id/abonos

report.service.ts
├── salesSummary(from, to)    → GET /api/reportes/ventas?from&to
├── topProducts(from, to, orderBy, limit) → GET /api/reportes/productos-top?...
├── salesByCashier(from, to)  → GET /api/reportes/por-cajero?from&to
├── creditSummary(from, to)   → GET /api/reportes/creditos?from&to
└── cashRegisterSummary(from, to, userId?) → GET /api/reportes/cajas?from&to&userId
```

### Pages (`frontend/src/pages/`)

```
CashRegisterPage.tsx    → /caja
PosPage.tsx             → /pos
CreditsPage.tsx         → /creditos
ReportsPage.tsx         → /reportes
```

### Componentes UI (`frontend/src/components/ui/`)

```
WhatsAppButton.tsx       → Botón reutilizable wa.me (outlined verde + icon)
NoOpenRegisterAlert.tsx  → Alerta "Debes abrir una caja" (reutilizable en POS y Créditos)
```

---

## 4. Archivos existentes a modificar

### `frontend/src/components/layout/Sidebar.tsx`

Agregar items nuevos al array `navItems`:

```typescript
// Orden final:
{ label: 'Caja', icon: PointOfSale, path: '/caja', featureFlag: 'usesCashRegister' },
{ label: 'POS', icon: Storefront, path: '/pos' },  // siempre visible
// --- divider ---
{ label: 'Productos', ... },      // ya existe
{ label: 'Categorías', ... },     // ya existe
{ label: 'Inventario', ... },     // ya existe (adminOnly)
{ label: 'Clientes', ... },       // ya existe (featureFlag: usesCredit)
{ label: 'Créditos', icon: CreditScore, path: '/creditos', featureFlag: 'usesCredit' },
// --- divider ---
{ label: 'Reportes', ... },       // ya existe (adminOnly + usesReports)
{ label: 'Configuración', ... },  // ya existe (adminOnly)
```

**Sidebar según combinaciones de flags comunes:**

```
Config completa (todos ON)        Config mínima (sin Caja ni Crédito)
─────────────────────────         ────────────────────────────────────
🏦 Caja                           🛍 POS
🛍 POS                            ──────────────────
──────────────────                🛒 Productos
🛒 Productos                      🏷 Categorías
🏷 Categorías                     📦 Inventario (admin)
📦 Inventario (admin)             ──────────────────
👥 Clientes                       📊 Reportes (admin)
💳 Créditos                       ⚙️ Configuración (admin)
──────────────────
📊 Reportes (admin)
⚙️ Configuración (admin)

Cajero (todos ON)                 Cajero (sin Caja ni Crédito)
─────────────────────────         ────────────────────────────────────
🏦 Caja                           🛍 POS
🛍 POS                            ──────────────────
──────────────────                🛒 Productos
🛒 Productos                      🏷 Categorías
🏷 Categorías
👥 Clientes
💳 Créditos
```

> **Regla de implementación:** el orden de los items es fijo — los items se ocultan según flags/rol, nunca se reordenan. Usar `navItems.filter(item => isVisible(item, config, role))` antes de renderizar.

### `frontend/src/App.tsx`

Agregar rutas:

```typescript
<Route path="/caja" element={<ProtectedRoute><CashRegisterPage /></ProtectedRoute>} />
<Route path="/pos" element={<ProtectedRoute><PosPage /></ProtectedRoute>} />
<Route path="/creditos" element={<ProtectedRoute><CreditsPage /></ProtectedRoute>} />
<Route path="/reportes" element={<ProtectedRoute adminOnly><ReportsPage /></ProtectedRoute>} />
```

### `frontend/src/pages/ProductsPage.tsx`

- Cambiar subcategoría de `<Select>` a `<Autocomplete freeSolo>`
- Agregar lógica para crear subcategoría on-the-fly si no existe

### `frontend/src/pages/InventoryPage.tsx`

- Agregar botón "Editar producto" junto al existente de "Ajustar stock"
- Nuevo dialog de edición (nombre, precio, stock mínimo)

### `frontend/src/pages/ConfigPage.tsx`

- Eliminar campo `whatsappNumber` del formulario
- Mantener solo el switch `usesWhatsapp` en la sección de módulos

### Backend: Eliminar `whatsappNumber`

- Quitar campo de la entity `BusinessConfig`
- Quitar del `UpdateConfigDto`
- Crear migración para eliminar columna `numero_whatsapp`

---

## 5. Feature flags — Qué controla cada uno

| Flag | Efecto |
|------|--------|
| `usesCashRegister` | Muestra/oculta "Caja" en sidebar + toda la página CashRegister + tab "Cajas" en Reportes. Si `false`, el tab de Cajas en Reportes se oculta completamente |
| `usesCredit` | Muestra/oculta "Clientes" y "Créditos" en sidebar + checkbox crédito en POS + tab "Créditos" en Reportes. Si `false`, el tab de Créditos en Reportes se oculta completamente (no queda vacío) |
| `usesReports` | Muestra/oculta "Reportes" en sidebar (+ requiere adminOnly) |
| `usesTicketsPdf` | Muestra/oculta botón "Ver Ticket" en snackbar post-venta del POS |
| `usesWhatsapp` | Muestra/oculta botones WhatsApp en POS (post-venta), Créditos (recordatorio + confirmación abono) |
| `requiresOpeningAmount` | Si true: campo monto inicial es requerido al abrir caja. Si false: es opcional |
| `usesFood` | Si true: permite crear productos tipo "Comida" (sin stock). Si false: solo tipo "Inventario" |

---

## 6. Roles — Acceso por pantalla

| Pantalla | Admin | Cajero | Notas |
|----------|-------|--------|-------|
| Login/Logout | ✅ | ✅ | — |
| Caja | ✅ completo | ✅ solo estado + abrir/cerrar | Cajero NO ve historial |
| POS | ✅ | ✅ | Requiere caja abierta |
| Productos | ✅ | ✅ | — |
| Categorías | ✅ | ✅ | — |
| Inventario | ✅ | ❌ | Solo admin |
| Clientes | ✅ | ✅ | Solo si usesCredit |
| Créditos | ✅ completo | ✅ solo ver + abonar | Cajero ve TODOS los créditos (no solo los suyos) — puede recibir pagos de cualquier cliente |
| Reportes | ✅ | ❌ | Solo admin + usesReports |
| Configuración | ✅ | ❌ | Solo admin |

---

## 7. Validaciones críticas del frontend

### POS
- [ ] Carrito vacío → botón COBRAR deshabilitado
- [ ] `(crédito=true AND cliente=null)` → botón COBRAR deshabilitado (además de carrito vacío)
- [ ] Sin caja abierta → overlay "Debes abrir una caja" con botón a /caja (aplica en mobile Y desktop)
- [ ] Stock insuficiente → impedir agregar más cantidad (productos tipo inventory); tarjeta con borde naranja si stock ≤ stockMin, deshabilitada si stock = 0
- [ ] Productos tipo food → no validar stock, mostrar chip "Comida", nunca bloquear click
- [ ] Crédito checked → campo cliente es obligatorio (asterisco rojo visible)
- [ ] Crédito checked → botones "Tarjeta" y "Transferencia" se deshabilitan visualmente (opacity 50%); tooltip: *"El crédito siempre se registra en efectivo"*; si el usuario tenía seleccionado Tarjeta/Transferencia antes de marcar crédito, resetear a "Efectivo" automáticamente
- [ ] **Flujo post-venta:** Al confirmar venta exitosa → (1) carrito se vacía automáticamente, (2) snackbar aparece con opciones [Ver Ticket*] [WhatsApp**] [OK], (3) snackbar se cierra solo a los 6 segundos si el usuario no interactúa, (4) el cajero puede comenzar una nueva venta de inmediato sin reload

### Caja
- [ ] Solo 1 caja abierta por usuario a la vez (el backend lo rechaza; frontend muestra el estado actual sin botón "Abrir" si ya hay una activa)
- [ ] `requiresOpeningAmount` → monto inicial requerido/opcional según config
- [ ] Monto cierre real → obligatorio siempre
- [ ] Diferencia = systemCloseAmount - realCloseAmount → mostrar color (verde ≥ 0, rojo < 0)
- [ ] **Flujo post-cierre:** Dialog "Resumen de Cierre" aparece → usuario hace clic en ACEPTAR → dialog se cierra → la tarjeta de estado cambia a "Sin caja abierta" → snackbar "Caja cerrada exitosamente". No redirige a otra pantalla.

### Créditos
- [ ] Registrar abono requiere caja abierta; si no hay caja → snackbar de error "Debes tener una caja abierta para registrar abonos"
- [ ] Monto abono > 0 AND ≤ saldo pendiente; validación **en tiempo real** (onChange): si monto > saldo, el campo se pone en rojo con helper text "No puede superar el saldo de $X"
- [ ] Crédito pagado → ocultar botón "Registrar Abono" completamente (no solo disabled)
- [ ] Botón WhatsApp → solo si `usesWhatsapp=true` AND cliente tiene teléfono registrado

### Productos (mejora subcategoría)
- [ ] Autocomplete freeSolo → si escribe texto nuevo, crear subcategoría vía POST
- [ ] Cambiar categoría → limpiar subcategoría seleccionada
- [ ] Subcategorías filtradas por categoría seleccionada

---

## 8. Patrones existentes a reutilizar

### Del frontend Fase 1:

| Patrón | Dónde se usa | Reutilizar en |
|--------|-------------|---------------|
| Tabla + paginación server-side | ProductsPage, CustomersPage | CashRegisterPage (historial), CreditsPage |
| Dialog CRUD (create/edit) | ProductsPage, CategoriesPage | CashRegisterPage (abrir/cerrar), CreditsPage (abono) |
| Debounced search | ProductsPage | PosPage, CreditsPage |
| ConfirmDialog | ProductsPage (toggle) | PosPage (confirmar venta) |
| Snackbar (SnackbarContext) | Todas las páginas | PosPage (post-venta), CreditsPage (post-abono) |
| ProtectedRoute + adminOnly | App.tsx | Nuevas rutas |
| ConfigContext (feature flags) | Sidebar, ConfigPage | Todas las nuevas páginas |

### Componentes MUI a usar:

| Componente | Para qué |
|------------|----------|
| `Autocomplete` con `freeSolo` | Subcategoría en productos, Cliente en POS |
| `ToggleButtonGroup` | Forma de pago en POS |
| `Tabs` + `TabPanel` | Reportes (5 tabs) |
| `Card` / `CardActionArea` | Grid de productos en POS |
| `Chip` | Categorías en POS, estados, stock |
| `LinearProgress` | Barra de progreso en detalle de crédito |
| `Alert` | NoOpenRegisterAlert |

---

## 9. Orden de implementación

```
Paso 1: Types + Services (sin dependencias)
   └── cash-register.types.ts, sale.types.ts, credit.types.ts, report.types.ts
   └── cash-register.service.ts, sale.service.ts, credit.service.ts, report.service.ts

Paso 2: Componentes compartidos + rutas
   └── WhatsAppButton.tsx, NoOpenRegisterAlert.tsx
   └── Sidebar.tsx (agregar items Caja, POS, Créditos)
   └── App.tsx (agregar rutas)

Paso 3: CashRegisterPage — PRIMERO porque POS depende de caja abierta
   └── Estado actual (tarjeta abierta/cerrada)
   └── Dialogs: abrir, cerrar, resumen, detalle
   └── Historial admin con filtros

Paso 4: PosPage — Pantalla más compleja, núcleo del sistema
   └── Grid de productos con búsqueda + chips de categoría
   └── Carrito con controles de cantidad
   └── Pago, crédito, confirmación
   └── Snackbar post-venta (ticket + WhatsApp)

Paso 5: CreditsPage
   └── KPI cards de resumen
   └── Tabla con filtros
   └── Detalle con progress bar + historial
   └── Dialog registrar abono

Paso 6: ReportsPage
   └── 5 tabs con filtro de fecha compartido
   └── KPI cards reutilizables
   └── Tablas de datos

Paso 7: Mejoras Fase 1
   └── ProductsPage: Autocomplete freeSolo subcategoría
   └── InventoryPage: Botón editar + dialog edición
   └── ConfigPage: Eliminar campo whatsappNumber

Paso 8: Backend cleanup
   └── Eliminar whatsappNumber de entity + DTO + migración
```

---

## 10. Responsive / Mobile

Ver wireframes de teléfono en `documents/wireframes/mobile.html` (390px).  
No hay wireframe de tablet — se rige por las reglas de la tabla siguiente.

**POS es prioritario en cualquier resolución** — debe ser usable desde teléfono, tablet y desktop indistintamente.

### Breakpoints MUI

| | `xs` 0–599px (teléfono) | `sm` 600–899px (tablet) | `md` 900px+ (desktop) |
|---|---|---|---|
| **Navegación** | Bottom Navigation (5 items) + Drawer hamburger | Mini sidebar solo íconos (64px) colapsable | Sidebar completa (240px) |
| **POS layout** | Tabs: "Productos" / "Carrito" (full width) | Split panel 50/50 — mismo concepto desktop | Split panel 60/40 |
| **Tablas** | Card lists apiladas | Tablas normales | Tablas normales |
| **Dialogs** | `fullScreen` prop activo | Dialog centrado `maxWidth="sm"` | Dialog centrado `maxWidth="md"` |
| **KPI cards** | Grid 2 columnas | Grid 3 columnas | Grid 3–4 columnas |
| **Filtros** | Colapsables (Accordion o toggle) | En línea (una fila) | En línea (una fila) |
| **Reportes** | Select/Dropdown (1 reporte a la vez) | Tabs visibles sin scroll | Tabs visibles sin scroll |
| **Botones acción** | FAB flotante para crear | Botón normal en header | Botón normal en header |

### Patrones MUI a usar

```typescript
// Detección de breakpoint en componente
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

// Sidebar / Bottom Nav condicional
{ isMobile ? <BottomNavigation /> : <Sidebar /> }

// POS — layout dinámico
<Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, height: '100%' }}>
  <ProductsPanel sx={{ flex: { xs: 1, sm: 5, md: 6 } }} />
  <CartPanel sx={{ flex: { xs: 1, sm: 5, md: 4 } }} />
</Box>

// POS — tabs solo en xs
{ isMobile && <Tabs value={posTab} onChange={...}> ... </Tabs> }

// Dialog fullscreen solo en móvil
<Dialog fullScreen={isMobile} maxWidth="md" ...>

// Tabla vs Card list
{ isMobile ? <CardList data={rows} /> : <DataTable rows={rows} /> }

// Filtros colapsables en móvil
{ isMobile
  ? <Accordion><AccordionSummary>Filtros</AccordionSummary><Filters /></Accordion>
  : <Box display="flex" gap={2}><Filters /></Box>
}

// Reportes — Select en móvil, Tabs en desktop
{ isMobile
  ? <Select value={tab} onChange={...}> {reportOptions} </Select>
  : <Tabs value={tab} onChange={...}> {reportTabs} </Tabs>
}
```

### Bottom Navigation con feature flags activos

Cuando un módulo está desactivado su ítem **desaparece** del Bottom Nav (no queda disabled). Los ítems restantes se redistribuyen equitativamente. El Bottom Nav siempre muestra máximo 5 ítems; si hay menos de 5 módulos activos se redistribuyen sin huecos.

Prioridad de ítems en Bottom Nav (de mayor a menor):
1. POS — siempre visible
2. Caja — si `usesCashRegister`
3. Créditos — si `usesCredit`
4. Productos — siempre visible
5. Más (drawer) — siempre visible

### Reportes: Productos Top

El select "Top 10 / Top 20 / Top 50" reemplaza la paginación — no hay tabla paginada en ese tab. El backend devuelve exactamente N productos ordenados. El período de fechas compartido aplica a TODOS los tabs incluyendo Productos Top; agregar subtítulo debajo del título del tab: *"En el período seleccionado"*.

### Detalles críticos del POS en cada resolución

```
Teléfono (xs):
  Tab "Productos"           Tab "Carrito"  [badge 3]
  ┌──────────────────────┐  ┌──────────────────────┐
  │ [buscar]             │  │ item × qty = subtotal │
  │ [chips categoría →]  │  │ ...                  │
  │ ┌──┐ ┌──┐ ┌──┐      │  │ ── Forma de pago ──  │
  │ │  │ │  │ │  │      │  │ [Efec|Tarj|Transfer] │
  │ └──┘ └──┘ └──┘      │  │ [ ] Crédito          │
  │  ...grid 2 cols...  │  │ TOTAL: $18.200       │
  └──────────────────────┘  │ [COBRAR $18.200]     │
                             └──────────────────────┘

Tablet (sm) y Desktop (md):
  ┌─────────────────────────┬───────────────────────┐
  │ [buscar]  [chips cat.→] │ CARRITO         [3]   │
  │ ┌───┐ ┌───┐ ┌───┐      │ Coca x2  $7.000 [-][+]│
  │ │   │ │   │ │   │      │ Pan x1   $5.200 [-][+]│
  │ └───┘ └───┘ └───┘      │ ─────────────────────  │
  │  ...grid 3 cols...     │ [Efec|Tarj|Transfer]  │
  │                         │ TOTAL: $18.200        │
  │                         │ [══ COBRAR ══]        │
  └─────────────────────────┴───────────────────────┘
  (tablet: 50/50)              (desktop: 60/40)
```

---

## 11. Empty States

Cada pantalla que carga datos del servidor debe manejar el estado vacío. Usar un componente reutilizable:

```typescript
// frontend/src/components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon: SvgIconComponent   // ícono MUI
  title: string
  subtitle?: string
  action?: { label: string; onClick: () => void }
}
```

### Por pantalla

| Pantalla / Contexto | Ícono MUI | Título | Subtítulo | Acción |
|---|---|---|---|---|
| POS — sin productos en grid | `Inventory2` | "No hay productos" | "Agrega productos desde la sección Productos" | — |
| POS — búsqueda sin resultados | `SearchOff` | "Sin resultados para '[término]'" | "Intenta con otro nombre o código" | — |
| POS — sin caja abierta | `PointOfSale` | "Debes abrir una caja" | "No puedes realizar ventas sin una caja activa" | "Ir a Caja" → /caja |
| Créditos — tabla vacía | `CreditScore` | "No hay créditos" | "No se encontraron créditos en este período" | — |
| Créditos — sin resultados de filtro | `FilterAlt` | "Sin resultados" | "Ajusta los filtros para ver más créditos" | — |
| Reportes — sin datos en período | `BarChart` | "Sin datos" | "No hay registros en el período seleccionado. Ajusta las fechas." | — |
| Historial de caja — vacío | `PointOfSale` | "Sin historial" | "No hay cajas cerradas en este período" | — |
| Inventario — sin productos | `Inventory2` | "Inventario vacío" | "Agrega productos para comenzar a gestionarlos" | — |

### Notas de implementación

- El componente `EmptyState` va centrado vertical y horizontalmente en el área de la tabla/lista
- En mobile, el ícono es de 56px; en desktop 64px
- El action button usa `variant="contained"` si es navegación principal, `variant="outlined"` si es secundaria
- **No mostrar el EmptyState durante la carga** — usar skeleton/spinner primero; EmptyState solo cuando la respuesta llegó y está genuinamente vacía
- El estado de error del servidor es diferente al empty state: un error 500 muestra `Alert severity="error"` en lugar del EmptyState

---

## 12. Verificación end-to-end

```bash
# 1. Levantar
cd backend && npm run dev
cd frontend && npm run dev

# 2. Login como admin
admin@cafepos.com / admin123

# 3. Flujo completo del cajero
Abrir Caja → POS (vender 3 productos) → Créditos (registrar abono) → Cerrar Caja

# 4. Verificar reportes
Reportes → cada tab debe mostrar datos del flujo anterior

# 5. Probar feature flags
Configuración → desactivar módulos → verificar que desaparecen del sidebar

# 6. Probar rol cajero
Crear usuario cajero → login → verificar que NO ve: Inventario, Reportes, Configuración, Historial de cajas

# 7. Probar responsive
Chrome DevTools:
#   → iPhone 14 (390px)  → Bottom Nav + POS tabs + card lists + dialogs fullscreen
#   → iPad Mini (768px)  → Mini sidebar + POS split panel + tablas normales
#   → Desktop (1280px)   → Sidebar completa + layout normal
```
