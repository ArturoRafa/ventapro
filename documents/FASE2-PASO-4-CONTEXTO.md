# Fase 2 — Paso 4: Ventas/POS (Backend)

## Resumen

Se implemento el modulo backend completo de **Ventas/POS** para el proyecto VentaPro/InventarioCaja. Este modulo es el nucleo transaccional del sistema: permite crear ventas con transacciones atomicas (QueryRunner), consultar historial y detalle de ventas. Introduce el primer uso de **TypeORM QueryRunner** para operaciones multi-tabla en una sola transaccion. Es prerequisito para los pasos 5 (Creditos/Fiado), 7 (Tickets PDF) y 9 (POS Frontend).

---

## Archivos creados (4)

| Archivo | Descripcion |
|---------|-------------|
| `backend/src/dtos/sale.dto.ts` | 2 interfaces (CreateSaleItemDto, CreateSaleDto) + 1 funcion de validacion |
| `backend/src/services/sale.service.ts` | 3 funciones de negocio (create, findAll, findById) + helper `stripCashierPassword` |
| `backend/src/controllers/sale.controller.ts` | 3 handlers Express |
| `backend/src/routes/sale.routes.ts` | 3 rutas (1 any + 2 admin) |

## Archivos modificados (2)

| Archivo | Cambio |
|---------|--------|
| `backend/src/index.ts` | Import de `saleRoutes` + registro en `/api/ventas` |
| `.gitignore` | Agregado `.claude/` a la seccion IDE |

---

## Endpoints API implementados

| Metodo | Ruta | Auth | Rol | Descripcion |
|--------|------|------|-----|-------------|
| POST | `/api/ventas` | Si | any | Crear venta (requiere caja abierta) |
| GET | `/api/ventas` | Si | admin | Historial paginado con filtros |
| GET | `/api/ventas/:id` | Si | admin | Detalle de una venta con relaciones |

---

## DTOs (`dtos/sale.dto.ts`)

### CreateSaleItemDto

```typescript
interface CreateSaleItemDto {
  productId: number;   // > 0
  quantity: number;    // entero > 0
}
```

### CreateSaleDto

```typescript
interface CreateSaleDto {
  items: CreateSaleItemDto[];                    // al menos 1 elemento
  paymentMethod: 'cash' | 'card' | 'transfer';  // requerido
  customerId?: number;                           // opcional, requerido si status='pending'
  status: 'paid' | 'pending';                   // default 'paid'
}
```

Validaciones:
- `items`: array no vacio; cada item con productId (number > 0) y quantity (entero > 0)
- `paymentMethod`: enum contra `['cash', 'card', 'transfer']`
- `status`: si presente, debe ser 'paid' o 'pending'; default 'paid'
- `customerId`: si presente, number > 0; **requerido** si `status='pending'` (venta a credito)

---

## Service — Logica de negocio (`services/sale.service.ts`)

### Repositorios usados

```typescript
const repo = () => AppDataSource.getRepository(Sale);
```

Dentro de la transaccion se usa `runner.manager` para acceder a todas las entidades: `CashRegister`, `Customer`, `Product`, `Sale`, `SaleDetail`, `Credit`.

### `create(cashierId, dto)` → Sale — Transaccion atomica con QueryRunner

```
1.  createQueryRunner → connect → startTransaction
2.  Buscar caja abierta del cajero → Errors.cashRegisterClosed()
3.  Si customerId, verificar que existe → Errors.notFound()
4.  Cargar todos los productos en 1 query (In operator)
5.  Verificar que todos los productIds existen → Errors.notFound()
6.  Agregar cantidades por productId (manejo de duplicados en items)
7.  Validar cada producto: activo → Errors.inactiveProduct()
8.  Validar stock para type='inventory' → Errors.insufficientStock()
9.  Calcular total = SUM(price * quantity), redondear a 2 decimales
10. Crear Sale (cashRegisterId, cashierId, customerId, total, paymentMethod, status)
11. Crear SaleDetail[] (unitPrice = snapshot de product.price, subtotal = price * qty)
12. Decrementar stock con runner.manager.decrement() solo para type='inventory'
13. Si status='pending': crear Credit (customerId, saleId, totalAmount, pendingBalance)
14. Commit
```

En caso de error: rollback + throw. Siempre: release del runner.

Despues del commit: re-fetch con relations `['details', 'details.product', 'cashier', 'customer', 'credit']` para retornar la venta completa. Se aplica `stripCashierPassword`.

### `findAll(filters)` → { data, meta }

- QueryBuilder con joins: cashier, customer
- Filtros: `cashRegisterId`, `cashierId`, `paymentMethod`, `status`, `from`, `to` (rango en createdAt)
- Paginacion estandar: `Math.max(1, page)`, `Math.min(100, Math.max(1, limit))`
- OrderBy: `createdAt DESC`
- Aplica `stripCashierPassword` a cada registro

### `findById(id)` → Sale

- findOne con relations: `details`, `details.product`, `cashier`, `customer`, `credit`
- `Errors.notFound()` si no existe
- Aplica `stripCashierPassword`

---

## Reglas de negocio

| Regla | Implementacion |
|-------|---------------|
| Requiere caja abierta | `findOne({ cashierId, status: 'abierta' })` al inicio de la transaccion |
| Productos deben estar activos | Check `product.status === 'inactivo'` → `Errors.inactiveProduct()` |
| Stock suficiente (solo type='inventory') | `product.stock < totalQty` → `Errors.insufficientStock()` |
| Productos type='food' no decrementan stock | Condicional `if (product.type === 'inventory')` en el decrement |
| Duplicados en items se agregan | `quantityByProduct` Map suma cantidades antes de validar stock |
| Precio snapshot inmutable | `unitPrice = product.price` al momento de la venta |
| Venta a credito requiere cliente | DTO valida `customerId` requerido si `status='pending'` |
| Credito se crea automaticamente | Si `status='pending'`: Credit con `pendingBalance = total` |
| Total calculado en servidor | No se acepta total del cliente; se calcula `SUM(price * qty)` |

---

## Patron de transaccion atomica (QueryRunner)

```typescript
const runner = AppDataSource.createQueryRunner();
await runner.connect();
await runner.startTransaction();

try {
  // Todas las operaciones via runner.manager (NO repos globales)
  await runner.manager.findOne(...)
  await runner.manager.save(...)
  await runner.manager.decrement(...)

  await runner.commitTransaction();
} catch (error) {
  await runner.rollbackTransaction();
  throw error;
} finally {
  await runner.release();
}
```

**Importante:** Dentro de la transaccion se usa `runner.manager` para todas las operaciones. Usar `repo()` (repositorio global) dentro del try ejecutaria fuera de la transaccion.

---

## Revision critica — 0 issues encontrados

Se verifico la integracion con todos los modulos existentes:

| Punto verificado | Resultado |
|-----------------|-----------|
| Cierre de caja (`cash-register.service.ts`) suma ventas cash+paid | ✅ Compatible — nuestras ventas con `paymentMethod='cash'` y `status='paid'` se cuentan correctamente; creditos (`status='pending'`) quedan excluidos |
| CHECK constraints de BD (total>=0, cantidad>0, precio>=0, subtotal>=0) | ✅ Respetados por validaciones DTO + calculos del service |
| FK constraints (caja_id, cajero_id, cliente_id, venta_id, producto_id) | ✅ Todas verificadas antes de insert dentro de la transaccion |
| QueryBuilder usa property names (camelCase), no columnas SQL | ✅ Consistente con cash-register.service.ts |
| `decrement()` genera `SET stock = stock - :qty` atomico | ✅ Dentro de la transaccion del QueryRunner |
| Agregacion de duplicados en items | ✅ `quantityByProduct` Map previene que items duplicados pasen validacion de stock individual pero fallen en conjunto |
| stripCashierPassword aplicado en todas las respuestas con join User | ✅ Aplicado en create, findAll, findById |
| Modulo de inventario (`inventory.service.ts`) no se ve afectado | ✅ Operaciones independientes en endpoints distintos |

---

## Patrones aplicados (consistentes con pasos anteriores)

| Patron | Detalle |
|--------|---------|
| DTO | Interface + funcion `validateCreateSaleDto()` con `Errors.validation()` |
| Service | `const repo = () => AppDataSource.getRepository(Entity)`, funciones exportadas |
| Controller | `async (req, res, next) => { try { ... } catch(e) { next(e) } }` |
| Routes | `Router()` con `authenticate` + `authorize('admin')` para operaciones admin |
| Paginacion | `Math.max(1, page)`, `Math.min(100, Math.max(1, limit))` |
| QueryBuilder | Propiedades camelCase de la entidad: `s.cashRegisterId`, `s.paymentMethod`, `s.createdAt` |
| Enum validation | Controller valida `paymentMethod` contra `['cash','card','transfer']` y `status` contra `['paid','pending']` |
| Error factories | `Errors.cashRegisterClosed()`, `Errors.inactiveProduct()`, `Errors.insufficientStock()`, `Errors.notFound()`, `Errors.validation()` |
| Security | `stripCashierPassword()` elimina passwordHash de joins con User |
| **NUEVO: QueryRunner** | Transaccion atomica multi-tabla con `createQueryRunner → connect → startTransaction → try/commit → catch/rollback → finally/release` |
| **NUEVO: runner.manager** | Todas las ops dentro de la transaccion via `runner.manager`, no repos globales |
| **NUEVO: decrement atomico** | `runner.manager.decrement(Product, { id }, 'stock', qty)` genera SQL atomico |

---

## Estructura de archivos actualizada (solo cambios del paso 4)

```
backend/src/
├── controllers/
│   └── sale.controller.ts            ← NUEVO
├── dtos/
│   └── sale.dto.ts                   ← NUEVO
├── routes/
│   └── sale.routes.ts                ← NUEVO
├── services/
│   └── sale.service.ts               ← NUEVO
└── index.ts                           ← MODIFICADO (import + ruta /api/ventas)

.gitignore                             ← MODIFICADO (agregado .claude/)
```

---

## Commits realizados

```
dc54cae chore: add .claude/ to gitignore
e70f917 feat(phase2): add sales/POS backend module with atomic transactions
bdc1968 feat(phase2): add cash register backend module (DTOs, service, controller, routes)
51fe0f2 feat(phase2): add 5 TypeORM entities and update existing entity relations
155386c feat(phase2): add migration for 5 new tables (cajas, ventas, detalle_ventas, creditos, abonos)
e56feee fix(phase1): address 12 bugs and improvements from critical review
8be5027 feat(phase1): implement auth, products, inventory, categories, customers and config
b2285b4 chore: bootstrap monorepo with backend and frontend scaffolding
152ddf4 test: verify push access
```

---

## Proximos pasos pendientes (Fase 2, pasos 5-12)

| Paso | Descripcion | Tipo | Dependencia |
|------|-------------|------|-------------|
| 5 | Creditos/Fiado — Backend (abonos con validacion de caja abierta) | Backend | Requiere ventas (paso 4 ✅) + caja (paso 3 ✅) |
| 6 | Reportes — Backend (endpoints read-only de agregacion) | Backend | Requiere ventas (paso 4 ✅) |
| 7 | Tickets PDF — Backend (pdf-lib, endpoint GET /ventas/:id/ticket) | Backend | Requiere ventas (paso 4 ✅) |
| 8 | Caja — Frontend (CashRegisterPage + CashRegisterContext) | Frontend | Requiere backend caja (paso 3 ✅) |
| 9 | POS — Frontend (PosPage, ProductGrid, Cart, CheckoutDialog) | Frontend | Requiere backend ventas (paso 4 ✅) |
| 10 | Creditos — Frontend (CreditsPage, PaymentDialog) | Frontend | Requiere backend creditos (paso 5) |
| 11 | Reportes — Frontend (ReportsPage con tabs) | Frontend | Requiere backend reportes (paso 6) |
| 12 | WhatsApp + integracion final (wa.me deep links, frontend only) | Frontend | - |

### Dependencia critica para paso 5

El servicio de creditos reutilizara el patron de QueryRunner introducido en este paso para los abonos (credit payments). Cada abono debe: decrementar `pendingBalance` del credito, cambiar `status` a 'paid' si saldo llega a 0, y asociarse a la caja abierta del cajero.

---

## Estado actual

- **Rama:** `dev`
- **TypeScript:** 0 errores en backend (`npx tsc --noEmit`)
- **Paso 4:** COMPLETADO — Modulo backend de Ventas/POS funcional con transacciones atomicas
- **Pendiente:** Pasos 5-12

---

## Como probar (requiere DB con migraciones ejecutadas + caja abierta)

```bash
cd backend
npm run dev

# 1. Login para obtener token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cafepos.com","password":"admin123"}'

# 2. Abrir caja (si no hay una abierta)
curl -X POST http://localhost:3000/api/cajas/abrir \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"initialAmount": 50000}'

# 3. Crear venta cash (pago inmediato)
curl -X POST http://localhost:3000/api/ventas \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":1,"quantity":2},{"productId":2,"quantity":1}],"paymentMethod":"cash"}'

# 4. Crear venta a credito (requiere cliente)
curl -X POST http://localhost:3000/api/ventas \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":1,"quantity":1}],"paymentMethod":"cash","customerId":1,"status":"pending"}'

# 5. Crear venta con tarjeta
curl -X POST http://localhost:3000/api/ventas \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":3,"quantity":5}],"paymentMethod":"card"}'

# 6. Listar ventas (admin) con filtros
curl "http://localhost:3000/api/ventas?page=1&limit=10&status=paid&paymentMethod=cash" \
  -H "Authorization: Bearer <token>"

# 7. Detalle de venta (admin) — incluye detalles, productos, cliente, credito
curl http://localhost:3000/api/ventas/1 \
  -H "Authorization: Bearer <token>"

# 8. Cerrar caja — el monto sistema incluira las ventas cash creadas
curl -X POST http://localhost:3000/api/cajas/cerrar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"actualCloseAmount": 55000}'
```
