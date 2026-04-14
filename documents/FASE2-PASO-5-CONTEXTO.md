# Fase 2 — Paso 5: Creditos/Fiado (Backend)

## Resumen

Se implemento el modulo backend completo de **Creditos/Fiado** para el proyecto VentaPro/InventarioCaja. Este modulo permite consultar creditos generados por ventas a fiado (paso 4) y registrar abonos (pagos parciales o totales) contra esos creditos. Introduce el segundo uso de **TypeORM QueryRunner** para transacciones atomicas: cada abono decrementa el saldo pendiente y, al llegar a 0, marca el credito como pagado automaticamente. Es prerequisito para el paso 10 (Creditos Frontend).

---

## Archivos creados (4)

| Archivo | Descripcion |
|---------|-------------|
| `backend/src/dtos/credit.dto.ts` | 1 interface (CreateCreditPaymentDto) + 1 funcion de validacion |
| `backend/src/services/credit.service.ts` | 3 funciones de negocio (findAll, findById, createPayment) |
| `backend/src/controllers/credit.controller.ts` | 3 handlers Express |
| `backend/src/routes/credit.routes.ts` | 3 rutas (2 admin + 1 any) |

## Archivos modificados (2)

| Archivo | Cambio |
|---------|--------|
| `backend/src/utils/AppError.ts` | 2 nuevos error factories: `creditAlreadyPaid`, `paymentExceedsBalance` |
| `backend/src/index.ts` | Import de `creditRoutes` + registro en `/api/creditos` |

---

## Endpoints API implementados

| Metodo | Ruta | Auth | Rol | Descripcion |
|--------|------|------|-----|-------------|
| GET | `/api/creditos` | Si | admin | Listado paginado de creditos con filtros |
| GET | `/api/creditos/:id` | Si | admin | Detalle de un credito con todas las relaciones |
| POST | `/api/creditos/:id/abonos` | Si | any | Registrar abono (requiere caja abierta) |

---

## DTOs (`dtos/credit.dto.ts`)

### CreateCreditPaymentDto

```typescript
interface CreateCreditPaymentDto {
  amount: number;   // > 0
  notes?: string;   // opcional, se aplica trim
}
```

Validaciones:
- `amount`: requerido, `typeof number`, debe ser > 0
- `notes`: si presente, debe ser string; se aplica trim, si queda vacio se descarta

Nota: La validacion `amount <= pendingBalance` se hace en el service (requiere leer el credito de la BD), no en el DTO. Esto sigue el mismo patron de `sale.dto.ts` donde las reglas de negocio como stock se validan en el service.

---

## Service — Logica de negocio (`services/credit.service.ts`)

### Repositorio usado

```typescript
const repo = () => AppDataSource.getRepository(Credit);
```

### `findAll(filters)` → { data, meta }

- QueryBuilder con join: `customer`
- Filtros: `customerId`, `status` ('pending' | 'paid'), `from`, `to` (rango en createdAt)
- Paginacion estandar: `Math.max(1, page)`, `Math.min(100, Math.max(1, limit))`
- OrderBy: `createdAt DESC`

### `findById(id)` → Credit

- findOne con relations: `customer`, `sale`, `sale.details`, `payments`, `payments.cashRegister`
- `Errors.notFound()` si no existe

### `createPayment(creditId, cashierId, dto)` → Credit — Transaccion atomica con QueryRunner

```
1.  createQueryRunner → connect → startTransaction
2.  Buscar credito por id → Errors.notFound()
3.  Validar credit.status === 'pending' → Errors.creditAlreadyPaid()
4.  Buscar caja abierta del cajero → Errors.cashRegisterClosed()
5.  Validar dto.amount <= credit.pendingBalance → Errors.paymentExceedsBalance()
6.  Crear CreditPayment (creditId, credit.customerId, register.id, amount, notes)
7.  runner.manager.decrement(Credit, {id}, 'pendingBalance', dto.amount)
8.  Re-leer credito de BD para verificar saldo (evita floating-point)
9.  Si pendingBalance === 0 → runner.manager.update(Credit, {id}, {status: 'paid'})
10. Commit
```

En caso de error: rollback + throw. Siempre: release del runner.

Despues del commit: re-fetch con `findById(creditId)` para retornar el credito completo con todas las relaciones.

**Detalle importante (revision critica):** En el paso 8, en vez de calcular `pendingBalance - amount` en JavaScript (riesgo de imprecision floating-point), se re-lee el valor directamente de la BD despues del `decrement`. La columna `saldo_pendiente` es `decimal(12,2)`, por lo que la aritmetica en la BD es exacta. `parseFloat("0.00") === 0` es `true`, lo cual hace segura la comparacion.

---

## Reglas de negocio

| Regla | Implementacion |
|-------|---------------|
| Requiere caja abierta para abonar | `findOne({ cashierId, status: 'abierta' })` en la transaccion |
| No se puede abonar a credito ya pagado | Check `credit.status === 'paid'` → `Errors.creditAlreadyPaid()` |
| Monto no puede exceder saldo pendiente | `dto.amount > credit.pendingBalance` → `Errors.paymentExceedsBalance()` |
| Monto debe ser positivo | DTO valida `amount > 0`; BD tiene CHECK `monto > 0` |
| customerId del abono se hereda del credito | `credit.customerId` — no viene del input del usuario |
| cashRegisterId viene de la caja abierta | No viene del input del usuario — se busca por `cashierId` |
| Credito se marca pagado automaticamente | Si `pendingBalance === 0` despues del decrement → `status = 'paid'` |
| Abonos se incluyen en cierre de caja | `cash-register.service.ts` ya suma `CreditPayment.amount` por `cashRegisterId` |

---

## Error factories nuevos (`utils/AppError.ts`)

| Factory | HTTP | Code | Cuando |
|---------|------|------|--------|
| `creditAlreadyPaid()` | 422 | `CREDIT_ALREADY_PAID` | Intentar abonar a credito con status='paid' |
| `paymentExceedsBalance(amount, balance)` | 422 | `PAYMENT_EXCEEDS_BALANCE` | Monto del abono supera el saldo pendiente |

Ambos usan HTTP 422 (business rule violation), consistente con `insufficientStock` y `cashRegisterClosed`.

---

## Patron de transaccion atomica (QueryRunner) — reutilizado del paso 4

```typescript
const runner = AppDataSource.createQueryRunner();
await runner.connect();
await runner.startTransaction();

try {
  // Todas las operaciones via runner.manager (NO repos globales)
  await runner.manager.findOne(...)
  await runner.manager.save(...)
  await runner.manager.decrement(...)
  await runner.manager.update(...)

  await runner.commitTransaction();
} catch (error) {
  await runner.rollbackTransaction();
  throw error;
} finally {
  await runner.release();
}
```

---

## Revision critica — 0 issues encontrados

Se verifico la integracion con todos los modulos existentes:

| Punto verificado | Resultado |
|-----------------|-----------|
| CHECK constraint `saldo_pendiente >= 0` en BD (migracion linea 59) | Doble seguridad: validacion en service + constraint en BD |
| CHECK constraint `monto > 0` en abonos (migracion linea 62) | Compatible con validacion DTO `amount > 0` |
| Cierre de caja suma abonos (`cash-register.service.ts:61-65`) | Ya funciona sin cambios — query `SUM(cp.amount) WHERE cashRegisterId` incluye los nuevos abonos |
| FK abonos → creditos, clientes, cajas | Todas las FK se verifican antes del insert dentro de la transaccion |
| Precision floating-point en comparacion `=== 0` | Se re-lee de BD (`decimal(12,2)`) en vez de calcular en JS |
| Concurrencia: dos abonos simultaneos al mismo credito | Seguro — `decrement` es atomico en SQL; segundo abono leera saldo ya actualizado tras commit del primero |
| QueryBuilder usa property names (camelCase), no columnas SQL | Consistente con sale.service.ts y cash-register.service.ts |
| Modulo de ventas no se ve afectado | Sin cambios en sale.service.ts; creditos se crean en paso 4, se consultan/abonan en paso 5 |

---

## Patrones aplicados (consistentes con pasos anteriores)

| Patron | Detalle |
|--------|---------|
| DTO | Interface + funcion `validateCreateCreditPaymentDto()` con `Errors.validation()` |
| Service | `const repo = () => AppDataSource.getRepository(Entity)`, funciones exportadas |
| Controller | `async (req, res, next) => { try { ... } catch(e) { next(e) } }` |
| Routes | `Router()` con `authenticate` + `authorize('admin')` para operaciones admin |
| Paginacion | `Math.max(1, page)`, `Math.min(100, Math.max(1, limit))` |
| QueryBuilder | Propiedades camelCase: `c.customerId`, `c.status`, `c.createdAt` |
| Error factories | `Errors.creditAlreadyPaid()`, `Errors.paymentExceedsBalance()`, `Errors.notFound()`, `Errors.cashRegisterClosed()`, `Errors.validation()` |
| QueryRunner | Transaccion atomica con `createQueryRunner → connect → startTransaction → try/commit → catch/rollback → finally/release` |
| runner.manager | Todas las ops dentro de la transaccion via `runner.manager`, no repos globales |
| decrement atomico | `runner.manager.decrement(Credit, { id }, 'pendingBalance', amount)` genera SQL atomico |
| **NUEVO: Re-lectura post-decrement** | Re-leer entidad de BD dentro de la transaccion para verificar estado despues de operacion atomica, evitando calculo floating-point en JS |

---

## Estructura de archivos actualizada (solo cambios del paso 5)

```
backend/src/
├── controllers/
│   └── credit.controller.ts           ← NUEVO
├── dtos/
│   └── credit.dto.ts                  ← NUEVO
├── routes/
│   └── credit.routes.ts               ← NUEVO
├── services/
│   └── credit.service.ts              ← NUEVO
├── utils/
│   └── AppError.ts                    ← MODIFICADO (+2 error factories)
└── index.ts                           ← MODIFICADO (import + ruta /api/creditos)
```

---

## Commits realizados

```
ed5a3c1 feat(phase2): add credits/fiado backend module with atomic payment transactions
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

## Proximos pasos pendientes (Fase 2, pasos 6-12)

| Paso | Descripcion | Tipo | Dependencia |
|------|-------------|------|-------------|
| 6 | Reportes — Backend (endpoints read-only de agregacion) | Backend | Requiere ventas (paso 4 ✅) + creditos (paso 5 ✅) |
| 7 | Tickets PDF — Backend (pdf-lib, endpoint GET /ventas/:id/ticket) | Backend | Requiere ventas (paso 4 ✅) |
| 8 | Caja — Frontend (CashRegisterPage + CashRegisterContext) | Frontend | Requiere backend caja (paso 3 ✅) |
| 9 | POS — Frontend (PosPage, ProductGrid, Cart, CheckoutDialog) | Frontend | Requiere backend ventas (paso 4 ✅) |
| 10 | Creditos — Frontend (CreditsPage, PaymentDialog) | Frontend | Requiere backend creditos (paso 5 ✅) |
| 11 | Reportes — Frontend (ReportsPage con tabs) | Frontend | Requiere backend reportes (paso 6) |
| 12 | WhatsApp + integracion final (wa.me deep links, frontend only) | Frontend | - |

### Dependencias actualizadas

- Pasos 6 y 7 pueden ejecutarse en paralelo (ambos son backend independiente)
- Pasos 8 y 9 pueden ejecutarse en paralelo (frontend independiente, backends ya completos)
- Paso 10 ya tiene su backend completo (este paso)

---

## Estado actual

- **Rama:** `dev`
- **TypeScript:** 0 errores en backend (`npx tsc --noEmit`)
- **Paso 5:** COMPLETADO — Modulo backend de Creditos/Fiado funcional con transacciones atomicas
- **Pendiente:** Pasos 6-12

---

## Como probar (requiere DB con migraciones ejecutadas + caja abierta + al menos 1 venta a credito)

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

# 3. Crear venta a credito (si no hay una — esto genera el credito)
curl -X POST http://localhost:3000/api/ventas \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":1,"quantity":2}],"paymentMethod":"cash","customerId":1,"status":"pending"}'

# 4. Listar creditos (admin) — ver el credito recien creado
curl "http://localhost:3000/api/creditos?page=1&limit=10&status=pending" \
  -H "Authorization: Bearer <token>"

# 5. Listar creditos filtrado por cliente
curl "http://localhost:3000/api/creditos?customerId=1" \
  -H "Authorization: Bearer <token>"

# 6. Detalle de credito (incluye customer, sale, payments)
curl http://localhost:3000/api/creditos/1 \
  -H "Authorization: Bearer <token>"

# 7. Registrar abono parcial
curl -X POST http://localhost:3000/api/creditos/1/abonos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000, "notes": "Abono parcial"}'

# 8. Verificar que el saldo pendiente disminuyo
curl http://localhost:3000/api/creditos/1 \
  -H "Authorization: Bearer <token>"

# 9. Pagar el saldo completo restante (status debe cambiar a 'paid')
curl -X POST http://localhost:3000/api/creditos/1/abonos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": <saldo_restante>}'

# 10. Intentar abonar a credito ya pagado → debe dar error 422 CREDIT_ALREADY_PAID
curl -X POST http://localhost:3000/api/creditos/1/abonos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}'

# 11. Intentar abonar mas del saldo → debe dar error 422 PAYMENT_EXCEEDS_BALANCE
# (crear otro credito primero, luego intentar abonar mas de lo que debe)
curl -X POST http://localhost:3000/api/creditos/2/abonos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 999999}'

# 12. Cerrar caja → systemCloseAmount debe incluir ventas cash + abonos registrados
curl -X POST http://localhost:3000/api/cajas/cerrar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"actualCloseAmount": 60000}'
```
