# Plan de Wireframes — Frontend Completo (Fase 1 + Fase 2)

## Contexto

El backend de Fase 2 esta 100% completo (pasos 1-7): Control de Caja, Ventas/POS, Creditos/Fiado, Reportes y Tickets PDF. El frontend de Fase 1 ya tiene: Login, Productos, Categorias, Inventario, Clientes y Configuracion. Se crearon wireframes HTML interactivos para TODAS las pantallas del sistema (11 archivos) antes de implementar codigo de Fase 2.

## Wireframes completados (documents/wireframes/)

### Fase 1 (referencia de pantallas existentes)
- `00-login.html` — Login, error, loading, logout, flujo auth completo (5 vistas)
- `00b-productos.html` — Productos CRUD, cascading selects, toggle estado
- `00c-categorias.html` — Categorias + Subcategorias (two-panel)
- `00d-inventario.html` — Inventario, stock bajo, ajuste con preview
- `00e-clientes.html` — Clientes CRUD
- `00f-configuracion.html` — Config negocio (identidad, modulos, WhatsApp)

### Fase 2 (pantallas nuevas a implementar)
- `01-caja.html` — Caja Registradora (estado actual + historial admin + 4 dialogs)
- `02-pos.html` — POS split-panel (grid productos + carrito + credito + post-venta)
- `03-creditos.html` — Creditos (KPIs + tabla + detalle con progress bar + abonos)
- `04-reportes.html` — Reportes (5 tabs interactivos)
- `05-whatsapp.html` — Componente WhatsApp (showcase de 3 integraciones)

### Mobile / Responsive
- `mobile.html` — 16 vistas mobile (390px) en simulador iPhone: Login, Drawer, Caja, Caja Dialogs, POS Productos, POS Carrito, POS Confirmar, POS Sin Caja, POS Vacio, Productos, Creditos, Credito Detalle, Reportes, Config, Inventario, Bottom Nav Flags. Bottom Navigation, card lists, filtros colapsables, dialogs fullscreen.

### Hub de navegacion
- `index.html` — Mapa completo con flujos de cajero/admin, tarjetas clickables, matriz de feature flags y roles

### Mejoras aplicadas (revision critica)
- Sidebar con navegacion clickable entre wireframes (todos los archivos)
- Link "Mapa de Wireframes" en sidebar de todas las pantallas
- AppBar consistente en TODOS los wireframes (rol chip + usuario + boton SALIR)
- Login title corregido a "cafe-pos" (como el codigo real)
- POS: boton "IR A CAJA" enlaza a caja wireframe
- Login: boton INGRESAR enlaza a caja wireframe
- Productos: subcategoria ahora es Autocomplete freeSolo (crear inline escribiendo)
- Inventario: 2 acciones por fila — editar producto + ajustar stock (antes solo ajustar)
- WhatsApp: eliminado campo whatsappNumber de config (peso muerto, nunca se leía)
- WhatsApp: 05-whatsapp.html reclasificado como "doc tecnica" (no es pantalla)
- WhatsApp: solo queda switch usesWhatsapp on/off en modulos de config

### Decisiones tomadas
- **WhatsApp**: Opcion B — solo switch on/off, sin whatsappNumber. Deep link wa.me/{tel_cliente}. Sin WhatsApp Business API por ahora.
- **Subcategorias**: Autocomplete freeSolo en productos — si no existe se crea automaticamente
- **Inventario**: Editar (precio, stock min) + Ajustar stock como acciones separadas

**Stack frontend:** React 18 + MUI 5 + Vite + TypeScript  
**Roles:** Admin (ve todo) | Cajero (vista limitada)  
**Feature flags:** usesCredit, usesCashRegister, usesReports, usesTicketsPdf, usesWhatsapp, requiresOpeningAmount

---

## Flujo del cajero (contexto de uso)

```
Abrir Caja → Vender (POS) → Recibir abonos → Cerrar Caja
```

---

## WIREFRAME 1: CashRegisterPage (`/caja`)

**Acceso:** Todos los roles | Feature flag: `usesCashRegister`

### Layout

```
+------------------------------------------------------------------+
| Caja Registradora                                                |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------------------------------------------------+ |
|  | TARJETA DE ESTADO ACTUAL                     Paper elev=2  | |
|  |                                                            | |
|  |  Estado: [Chip verde "Abierta"] o [Chip gris "Sin caja"]  | |
|  |                                                            | |
|  |  SI ABIERTA:                                               | |
|  |  Cajero: Juan Perez          Apertura: 15/04/2026 08:00   | |
|  |  Monto inicial: $50.000      Tiempo: 4h 32m               | |
|  |                                                            | |
|  |                              [CERRAR CAJA] (btn warning)   | |
|  |                                                            | |
|  |  SI CERRADA (null):                                        | |
|  |  "No tienes una caja abierta"                              | |
|  |                              [ABRIR CAJA] (btn primary)    | |
|  +------------------------------------------------------------+ |
|                                                                  |
|  ---- SOLO ADMIN (abajo) ----                                    |
|                                                                  |
|  Historial de Cajas                                              |
|  Filtros: [Cajero Select] [Estado Select] [Desde] [Hasta]       |
|                                                                  |
|  +------------------------------------------------------------+ |
|  | ID | Cajero | M.Inicial | Cierre Sistema | Cierre Real |   | |
|  |    | Diferencia | Estado(Chip) | Apertura | Cierre | (eye)| |
|  +------------------------------------------------------------+ |
|  | TablePagination                                             | |
+------------------------------------------------------------------+
```

### Dialogos

**Dialog Abrir Caja:**
```
+--------------------------------------------+
|  Abrir Caja                                |
|                                            |
|  Monto inicial: [TextField number]         |
|  (requerido si config.requiresOpeningAmount)|
|  (opcional si no)                           |
|                                            |
|  [Cancelar]              [Abrir]           |
+--------------------------------------------+
```

**Dialog Cerrar Caja:**
```
+--------------------------------------------+
|  Cerrar Caja                               |
|                                            |
|  Monto real en caja: [TextField number] *  |
|  Notas de cierre: [TextField multiline]    |
|                                            |
|  [Cancelar]              [Cerrar Caja]     |
+--------------------------------------------+
```

**Dialog Resumen de Cierre (post-cierre exitoso):**
```
+--------------------------------------------+
|  Resumen de Cierre                         |
|                                            |
|  Monto inicial:      $50.000               |
|  Monto sistema:     $185.500               |
|  Monto real:        $183.000               |
|  Diferencia:         -$2.500 (Chip rojo)   |
|                                            |
|  Notas: "Faltante en monedas"             |
|                                            |
|  [Aceptar]                                 |
+--------------------------------------------+
```

**Dialog Detalle Caja (admin, click en eye icon):**
```
+--------------------------------------------+
|  Detalle Caja #42                          |
|                                            |
|  Cajero: Maria Lopez                       |
|  Apertura: 14/04/2026 08:00               |
|  Cierre:   14/04/2026 18:30               |
|                                            |
|  Monto inicial:       $50.000              |
|  Cierre sistema:     $245.000              |
|  Cierre real:        $243.500              |
|  Diferencia:          -$1.500              |
|                                            |
|  Notas: "Todo bien"                        |
|                                            |
|  [Cerrar]                                  |
+--------------------------------------------+
```

### Visibilidad por rol
- **Cajero:** Solo tarjeta de estado + botones abrir/cerrar
- **Admin:** Tarjeta de estado + historial con filtros + detalle

---

## WIREFRAME 2: PosPage (`/pos`)

**Acceso:** Todos los roles | Requiere caja abierta  
**Este es el diseno mas critico — optimizado para velocidad de uso**

### Prerequisito: Sin caja abierta

```
+------------------------------------------------------------------+
|                                                                  |
|          (icono grande de caja registradora)                     |
|                                                                  |
|    Debes abrir una caja antes de realizar ventas                 |
|                                                                  |
|              [Ir a Caja] (btn primary)                           |
|                                                                  |
+------------------------------------------------------------------+
```

### Layout Principal (split-panel)

```
+------------------------------------------------------------------+
|  PANEL IZQUIERDO (60%)         |  PANEL DERECHO (40%)            |
|                                |                                 |
|  [Buscar producto...]          |  CARRITO                        |
|  [Chip: Todas] [Chip: Bebidas] |                                 |
|  [Chip: Panaderia] [Chip: ...]  |  +---------------------------+ |
|                                |  | Coca-Cola 600ml            | |
|  +---------------------------+ |  | 2 x $3.500 = $7.000 [-][+][X]|
|  | +-------+ +-------+      | |  | Pan integral              | |
|  | | Coca  | | Pan   |      | |  | 1 x $5.200 = $5.200 [-][+][X]|
|  | | Cola  | | Integ | ...  | |  +---------------------------+ |
|  | | $3500 | | $5200 |      | |                                 |
|  | | stk:24| | stk:15|      | |  Forma de pago:                |
|  | +-------+ +-------+      | |  [Efectivo|Tarjeta|Transferencia]|
|  |                           | |  (ToggleButtonGroup)            |
|  | +-------+ +-------+      | |                                 |
|  | | Cafe  | | Torta |      | |  [ ] Venta a credito            |
|  | | Latte | | Choco |      | |  [Cliente: Autocomplete] *      |
|  | | $6000 | | $8500 |      | |  *(solo si credito checked)     |
|  | |Comida | | stk:8 |      | |                                 |
|  | +-------+ +-------+      | |  --------------------------------|
|  |                           | |                                 |
|  | (grid scrollable)        | |  TOTAL: $12.200  (h4 bold)      |
|  +---------------------------+ |                                 |
|                                |  [========COBRAR========]       |
|                                |  (btn green, full-width, large) |
+------------------------------------------------------------------+
```

### Tarjetas de producto (detalle)

```
+-------------------+
|  Coca-Cola 600ml  |  <- nombre (body1 bold)
|  $3.500           |  <- precio (body2)
|  [stk: 24]        |  <- Chip pequeno: stock (inventory) o "Comida" (food)
+-------------------+
   CardActionArea (click = agregar al carrito)
   Borde naranja/rojo si stock bajo
   Min 120x100px (touch-friendly para tablet)
```

### Items del carrito (detalle)

```
+--------------------------------------------------+
| Coca-Cola 600ml                                  |
| [-] 2 [+]    x $3.500    = $7.000          [X]  |
+--------------------------------------------------+
  [-] IconButton Remove | [+] IconButton Add | [X] IconButton Delete
  Click en "2" permite editar cantidad inline
```

### Dialog Confirmar Venta

```
+--------------------------------------------+
|  Confirmar Venta                           |
|                                            |
|  3 productos                               |
|  Forma de pago: Efectivo                   |
|  Total: $12.200                            |
|                                            |
|  (si credito:)                             |
|  Cliente: Pedro Gomez                      |
|  ** VENTA A CREDITO **                     |
|                                            |
|  [Cancelar]        [Confirmar Venta]       |
+--------------------------------------------+
```

### Barra post-venta (Snackbar/Dialog despues de venta exitosa)

```
+----------------------------------------------------+
|  Venta #156 registrada correctamente               |
|  [Ver Ticket PDF*] [Enviar WhatsApp*]  [OK]        |
+----------------------------------------------------+
  * Ver Ticket: solo si config.usesTicketsPdf
  * WhatsApp: solo si config.usesWhatsapp Y cliente tiene telefono
```

### Interacciones clave
1. Click en tarjeta producto → agrega 1 unidad al carrito (o incrementa si ya existe)
2. Busqueda debounced filtra productos en tiempo real
3. Chips de categoria filtran el grid
4. Stock se valida al agregar (productos inventory)
5. Productos food no muestran stock, muestran "Comida"
6. Checkbox "Venta a credito" activa Autocomplete de clientes (solo si usesCredit)
7. Boton COBRAR deshabilitado si carrito vacio
8. Despues de venta exitosa: carrito se limpia, se muestra barra post-venta

### Visibilidad por feature flags
- Checkbox credito: solo si `usesCredit === true`
- Boton WhatsApp post-venta: solo si `usesWhatsapp === true`
- Boton Ticket PDF post-venta: solo si `usesTicketsPdf === true`

### Consideracion de layout
- POS necesita espacio completo — contrarrestar el `p: 3` del MainLayout con `mx: -3, mt: -3`
- Panel derecho (carrito) es sticky/fixed para scroll independiente
- Altura: `calc(100vh - 64px)` (restando AppBar)

---

## WIREFRAME 3: CreditsPage (`/creditos`)

**Acceso:** Admin (listado) + Cajero (registrar abonos) | Feature flag: `usesCredit`

### Layout (patron tabla estandar)

```
+------------------------------------------------------------------+
| Creditos                                                         |
+------------------------------------------------------------------+
|                                                                  |
| Filtros:                                                         |
| [Cliente Autocomplete w300] [Estado: Todos|Pendiente|Pagado]     |
| [Desde date] [Hasta date]                                        |
|                                                                  |
| +--------------------------------------------------------------+ |
| | ID | Cliente | Venta# | Monto Total | Saldo Pendiente |      | |
| |    | Estado (Chip) | Fecha | Acciones (eye + $ icons)        | |
| |----+----------+--------+-------------+------------------+-----| |
| | 14 | Pedro G. | #156   | $85.000     | $50.000         |     | |
| |    | [Pendiente] (naranja) | 10/04/2026 | (eye) ($)      |    | |
| | 11 | Ana R.   | #142   | $45.000     | $0              |     | |
| |    | [Pagado] (verde)      | 05/04/2026 | (eye)          |    | |
| +--------------------------------------------------------------+ |
| | TablePagination                                               | |
+------------------------------------------------------------------+
```

### Dialog Detalle Credito (click eye icon)

```
+--------------------------------------------------+
|  Credito #14                                      |
|                                                   |
|  Cliente: Pedro Gomez                             |
|  Venta: #156                                      |
|  Fecha: 10/04/2026                                |
|                                                   |
|  Monto total:       $85.000                       |
|  Total abonado:     $35.000                       |
|  Saldo pendiente:   $50.000                       |
|  Estado: [Pendiente] (Chip naranja)               |
|                                                   |
|  --- Historial de Abonos ---                      |
|  +-----------------------------------------------+|
|  | Fecha          | Monto    | Notas    | Caja   ||
|  | 12/04 10:30    | $20.000  | Parcial  | #42    ||
|  | 13/04 14:15    | $15.000  | -        | #43    ||
|  +-----------------------------------------------+|
|                                                   |
|  [Registrar Abono*] [WhatsApp**]      [Cerrar]   |
+--------------------------------------------------+
  * Solo si status=pending
  ** Solo si usesWhatsapp Y cliente tiene telefono
```

### Dialog Registrar Abono

```
+--------------------------------------------+
|  Registrar Abono — Credito #14             |
|                                            |
|  Saldo pendiente: $50.000                  |
|                                            |
|  Monto: [TextField number] *               |
|  Notas: [TextField multiline, opcional]    |
|                                            |
|  * Debe ser > 0 y <= saldo pendiente       |
|  * Requiere caja abierta                   |
|                                            |
|  [Cancelar]          [Registrar Abono]     |
+--------------------------------------------+
```

### Validaciones frontend
- Si no hay caja abierta al intentar abonar: snackbar "Debes tener una caja abierta"
- Monto > saldo pendiente: validacion en el campo
- Credito ya pagado: boton "Registrar Abono" oculto

---

## WIREFRAME 4: ReportsPage (`/reportes`)

**Acceso:** Solo admin | Feature flag: `usesReports`

### Layout con Tabs

```
+------------------------------------------------------------------+
| Reportes                                                         |
+------------------------------------------------------------------+
|                                                                  |
| [Ventas | Productos Top | Por Cajero | Creditos* | Cajas** ]    |
|  * solo si usesCredit  ** solo si usesCashRegister               |
|                                                                  |
| Filtro fecha compartido:                                         |
| [Desde date] [Hasta date] [Aplicar]                              |
|                                                                  |
+------------------------------------------------------------------+
```

### Tab 1: Ventas

```
|  +------------------+ +------------------+ +------------------+  |
|  | Total Ventas     | | Cantidad         | | Ticket Promedio  |  |
|  | $1.250.000       | | 47 ventas        | | $26.595          |  |
|  +------------------+ +------------------+ +------------------+  |
|                                                                  |
|  +------------------------+ +-------------------------+          |
|  | Por Forma de Pago      | | Por Estado              |          |
|  |                        | |                         |          |
|  | Efectivo: $800K (34)   | | Pagadas: $1.100K (40)  |          |
|  | Tarjeta:  $350K (10)   | | Pendientes: $150K (7)  |          |
|  | Transfer: $100K (3)    | |                         |          |
|  +------------------------+ +-------------------------+          |
```

### Tab 2: Productos Top

```
|  Filtros extra: [Ordenar: Cantidad|Ingresos] [Limite: 10|20|50] |
|  Subtitulo: "En el periodo seleccionado · Sin paginacion"        |
|                                                                  |
|  +------------------------------------------------------------+ |
|  | # | Codigo | Producto       | Cant. Vendida | Ingresos     | |
|  | 1 | P001   | Coca-Cola      | 156           | $546.000     | |
|  | 2 | P015   | Pan integral   | 98            | $509.600     | |
|  | 3 | P008   | Cafe latte     | 87            | $522.000     | |
|  +------------------------------------------------------------+ |
```

### Tab 3: Por Cajero

```
|  +------------------------------------------------------------+ |
|  | Cajero         | Ventas | Total Ingresos                   | |
|  | Juan Perez     | 28     | $725.000                         | |
|  | Maria Lopez    | 19     | $525.000                         | |
|  +------------------------------------------------------------+ |
```

### Tab 4: Creditos (solo si usesCredit)

```
|  +------------------+ +------------------+ +------------------+  |
|  | Total Creditos   | | Total Prestado   | | Pendiente        |  |
|  | 12               | | $450.000         | | $180.000         |  |
|  +------------------+ +------------------+ +------------------+  |
|                                                                  |
|  Por Cliente:                                                    |
|  +------------------------------------------------------------+ |
|  | Cliente        | Creditos | Monto Total | Saldo Pendiente  | |
|  | Pedro Gomez    | 3        | $120.000    | $85.000          | |
|  | Ana Ruiz       | 2        | $90.000     | $45.000          | |
|  +------------------------------------------------------------+ |
```

### Tab 5: Cajas (solo si usesCashRegister)

```
|  Filtro extra: [Cajero Select]                                   |
|                                                                  |
|  +------------------------------------------------------------+ |
|  | ID | Cajero | Inicial  | Sistema   | Real     | Diferencia | |
|  | 42 | Juan   | $50.000  | $245.000  | $243.500 | -$1.500   | |
|  | 41 | Maria  | $30.000  | $180.000  | $180.500 | +$500     | |
|  +------------------------------------------------------------+ |
|                                                                  |
|  Diferencia: verde si >= 0, rojo si < 0                         |
```

### KPI Cards (componente reutilizable)

```
+--------------------+
|  Label (body2      |
|  text.secondary)   |
|                    |
|  $1.250.000 (h4)  |
+--------------------+
  Card con CardContent, Grid responsive
```

---

## WIREFRAME 5: WhatsApp Integration (cross-cutting)

**No es una pagina — es un componente reutilizable en varias pantallas**

### Componente: WhatsAppButton

```
[WhatsApp icon] "Enviar"    o    (WhatsApp icon solo)
  Button variant="outlined"      IconButton
  color verde (#25D366)          size small/medium
```

### Puntos de integracion

| Ubicacion | Cuando aparece | Mensaje |
|-----------|---------------|---------|
| POS post-venta | Venta exitosa + cliente con telefono | Resumen de compra |
| Creditos detalle | Credito pendiente + cliente con telefono | Recordatorio de saldo |
| Creditos post-abono | Abono registrado + cliente con telefono | Confirmacion de abono |

### URL format
```
https://wa.me/{phone_sin_espacios}?text={mensaje_encoded}
```

### Visibilidad
- Solo si `config.usesWhatsapp === true`
- Solo si el cliente tiene telefono registrado

---

## Cambios en archivos existentes

### Sidebar.tsx — Agregar items de navegacion

```
Orden propuesto en el sidebar:
1. Caja          (icon: PointOfSale, featureFlag: usesCashRegister)
2. POS           (icon: Storefront) — siempre visible
3. Productos     (ya existe)
4. Categorias    (ya existe)
5. Inventario    (ya existe, adminOnly)
6. Clientes      (ya existe, featureFlag: usesCredit)
7. Creditos      (icon: CreditScore, featureFlag: usesCredit)
8. Reportes      (ya existe, adminOnly, featureFlag: usesReports)
9. Configuracion (ya existe, adminOnly)
```

La idea: Caja y POS arriba porque son las acciones principales del cajero.

### App.tsx — Agregar rutas

```
/caja       → CashRegisterPage (ProtectedRoute, feature flag check)
/pos        → PosPage (ProtectedRoute, requiere caja abierta)
/creditos   → CreditsPage (ProtectedRoute, feature flag check)
/reportes   → ReportsPage (ProtectedRoute, adminOnly)
```

---

## Archivos nuevos necesarios

### Types (`frontend/src/types/`)
- `cash-register.types.ts` — CashRegister, OpenDto, CloseDto
- `sale.types.ts` — Sale, SaleDetail, CreateSaleDto, CreateSaleItemDto
- `credit.types.ts` — Credit, CreditPayment, CreateCreditPaymentDto
- `report.types.ts` — SalesSummary, TopProduct, SalesByCashier, CreditSummary, CashRegisterSummary

### Services (`frontend/src/services/`)
- `cash-register.service.ts` — open, close, getCurrent, getAll, getById
- `sale.service.ts` — create, getAll, getById, getTicketPdf
- `credit.service.ts` — getAll, getById, registerPayment
- `report.service.ts` — salesSummary, topProducts, salesByCashier, creditSummary, cashRegisterSummary

### Pages (`frontend/src/pages/`)
- `CashRegisterPage.tsx`
- `PosPage.tsx`
- `CreditsPage.tsx`
- `ReportsPage.tsx`

### Componentes UI (`frontend/src/components/ui/`)
- `WhatsAppButton.tsx` — boton reutilizable wa.me
- `NoOpenRegisterAlert.tsx` — alerta reutilizable (POS y Creditos)
- `EmptyState.tsx` — estado vacio reutilizable

---

## Orden de implementacion recomendado

1. Types + Services (sin dependencias entre si)
2. Sidebar + App.tsx (rutas nuevas)
3. **CashRegisterPage** — primero porque POS depende de caja abierta
4. **PosPage** — la pagina mas compleja, nucleo del sistema
5. **CreditsPage** — depende de que existan ventas a credito
6. **ReportsPage** — depende de datos de todos los modulos
7. **WhatsApp** — se integra incrementalmente en las paginas anteriores

---

## Puntos a resolver antes / durante la implementacion

### 1. Patron de state management (resolver ANTES del Paso 1)
Antes de crear los services, abrir `ProductsPage.tsx` y `CustomersPage.tsx` de Fase 1 y verificar si usan:
- `useState + useEffect + axios` puro
- React Query (`useQuery`, `useMutation`)
- Algun custom hook (ej. `usePagination`, `useFetch`)

Los servicios de Fase 2 deben seguir exactamente el mismo patron para mantener consistencia.

### 2. Ticket PDF — como abrirlo (resolver al implementar PosPage)
El servicio define `getTicketPdf(id) → GET /api/ventas/:id/ticket` devolviendo un blob. Antes de implementar el boton "Ver Ticket" verificar si el endpoint:
- Acepta el JWT en header (Authorization: Bearer ...) → usar `fetch` + `URL.createObjectURL(blob)` + `window.open(blobUrl)`
- O permite el token como query param → simplemente `window.open('/api/ventas/:id/ticket?token=...')`

Revisar el controlador de tickets en el backend para confirmar.

### 3. Plantillas de mensaje WhatsApp (resolver al implementar cada integracion)
El plan dice "Resumen de compra", "Recordatorio de saldo", "Confirmacion de abono" pero no define el texto exacto. Propuesta base a ajustar segun el cliente:

| Contexto | Plantilla sugerida |
|---|---|
| POS post-venta | `Hola {nombre}, tu compra #{id} fue de ${total}. ¡Gracias por tu visita!` |
| Credito — recordatorio saldo | `Hola {nombre}, tienes un saldo pendiente de ${saldo} en tu cuenta. ¿Cuando puedes pasar a abonar?` |
| Credito — confirmacion abono | `Hola {nombre}, registramos tu abono de ${monto}. Tu saldo pendiente es ${saldo_nuevo}.` |

Formato final: `https://wa.me/{telefono_sin_espacios}?text={encodeURIComponent(mensaje)}`

---

## Verificacion end-to-end

```bash
# 1. Levantar
cd backend && npm run dev
cd frontend && npm run dev

# 2. Login como admin
admin@cafepos.com / admin123

# 3. Flujo completo del cajero
Abrir Caja → POS (vender 3 productos) → Creditos (registrar abono) → Cerrar Caja

# 4. Verificar reportes
Reportes → cada tab debe mostrar datos del flujo anterior

# 5. Probar feature flags
Configuracion → desactivar modulos → verificar que desaparecen del sidebar

# 6. Probar rol cajero
Crear usuario cajero → login → verificar que NO ve: Inventario, Reportes, Configuracion, Historial de cajas

# 7. Probar responsive
Chrome DevTools:
  → iPhone 14 (390px)  → Bottom Nav + POS tabs + card lists + dialogs fullscreen
  → iPad Mini (768px)  → Mini sidebar + POS split panel + tablas normales
  → Desktop (1280px)   → Sidebar completa + layout normal
```
