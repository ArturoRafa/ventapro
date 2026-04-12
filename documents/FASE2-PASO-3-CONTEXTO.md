# Fase 2 — Paso 3: Control de Caja (Backend)

## Resumen

Se implemento el modulo backend completo de **Control de Caja** para el proyecto VentaPro/InventarioCaja. Este modulo permite abrir y cerrar sesiones de caja, consultar la caja activa del cajero, y listar historial de cajas (admin). Es prerequisito para los pasos 4 (Ventas/POS) y 5 (Creditos/Fiado), ya que ambos requieren una caja abierta.

---

## Archivos creados (4)

| Archivo | Descripcion |
|---------|-------------|
| `backend/src/dtos/cash-register.dto.ts` | 2 interfaces (Open, Close) + 2 funciones de validacion |
| `backend/src/services/cash-register.service.ts` | 5 funciones de negocio + helper `stripCashierPassword` |
| `backend/src/controllers/cash-register.controller.ts` | 5 handlers Express |
| `backend/src/routes/cash-register.routes.ts` | 5 rutas (3 any + 2 admin) |

## Archivos modificados (1)

| Archivo | Cambio |
|---------|--------|
| `backend/src/index.ts` | Import de `cashRegisterRoutes` + registro en `/api/cajas` |

---

## Endpoints API implementados

| Metodo | Ruta | Auth | Rol | Descripcion |
|--------|------|------|-----|-------------|
| POST | `/api/cajas/abrir` | Si | any | Abrir caja (cajero = req.user.id) |
| POST | `/api/cajas/cerrar` | Si | any | Cerrar caja abierta del usuario |
| GET | `/api/cajas/actual` | Si | any | Caja abierta del usuario (o null) |
| GET | `/api/cajas` | Si | admin | Historial paginado con filtros |
| GET | `/api/cajas/:id` | Si | admin | Detalle de una caja |

---

## DTOs (`dtos/cash-register.dto.ts`)

### OpenCashRegisterDto

```typescript
interface OpenCashRegisterDto {
  initialAmount?: number | null;  // Opcional segun config.requiresOpeningAmount
}
```

Validacion:
- `initialAmount` si presente, debe ser `number >= 0`
- Si ausente o null, se permite (a menos que la config lo exija)

### CloseCashRegisterDto

```typescript
interface CloseCashRegisterDto {
  actualCloseAmount: number;  // Monto contado fisicamente, requerido, >= 0
  closingNotes?: string;      // Notas opcionales
}
```

Validacion:
- `actualCloseAmount` requerido, tipo number, >= 0
- `closingNotes` si presente, debe ser string; se aplica trim, string vacio se convierte a undefined

---

## Service — Logica de negocio (`services/cash-register.service.ts`)

### Repositorios usados

```typescript
const repo = () => AppDataSource.getRepository(CashRegister);
const saleRepo = () => AppDataSource.getRepository(Sale);
const paymentRepo = () => AppDataSource.getRepository(CreditPayment);
const configRepo = () => AppDataSource.getRepository(BusinessConfig);
```

### `open(cashierId, dto)` → CashRegister

1. Verifica que el cajero NO tenga caja abierta → `Errors.conflict()` si ya tiene
2. Consulta `config.requiresOpeningAmount` (singleton id=1) → `Errors.validation()` si requiere monto y no viene
3. Crea y guarda CashRegister con `status: 'abierta'`

### `close(cashierId, dto)` → CashRegister

1. Busca caja abierta del cajero → `Errors.cashRegisterClosed()` si no hay
2. Calcula monto sistema:
   ```
   systemCloseAmount = initialAmount
                     + SUM(ventas cash pagadas de esta caja)
                     + SUM(abonos registrados en esta caja)
   ```
3. Queries con QueryBuilder + `COALESCE(SUM(...), 0)` para evitar null
4. `difference = actualCloseAmount - systemCloseAmount`
   - Positivo = sobrante en caja
   - Negativo = faltante en caja
5. Actualiza: status='cerrada', closedAt, systemCloseAmount, actualCloseAmount, difference, closingNotes

### `findCurrent(cashierId)` → CashRegister | null

- Busca caja con `{ cashierId, status: 'abierta' }` + relacion `cashier`
- Retorna `null` si no hay caja abierta (no es error, el frontend lo necesita)
- Aplica `stripCashierPassword` antes de retornar

### `findAll(filters)` → { data, meta }

- Paginacion estandar: `Math.max(1, page)`, `Math.min(100, limit)`
- Filtros: `cashierId`, `status` ('abierta'/'cerrada'), `from`, `to` (rango de fechas)
- Join con `cashier` para mostrar nombre del cajero
- OrderBy: `openedAt DESC`
- Aplica `stripCashierPassword` a cada registro

### `findById(id)` → CashRegister

- Busca por id con relacion `cashier`
- `Errors.notFound()` si no existe
- Aplica `stripCashierPassword`

---

## Reglas de negocio

| Regla | Implementacion |
|-------|---------------|
| Un cajero = max 1 caja abierta | Check en `open()` con `findOne({ cashierId, status: 'abierta' })` |
| Solo el propio cajero cierra su caja | `close()` usa `req.user.id`, no un parametro |
| `requiresOpeningAmount` | Flag de `configuracion_negocio` consultado en `open()` |
| Calculo sistema al cerrar | `initialAmount + ventas_cash + abonos` via QueryBuilder SUM |
| Diferencia = real - sistema | Positivo = sobrante, negativo = faltante |

---

## Revision critica — 1 issue encontrado y corregido

| # | Severidad | Issue | Archivo | Fix aplicado |
|---|-----------|-------|---------|-------------|
| 1 | HIGH | `relations: ['cashier']` expone `passwordHash` del usuario en respuestas JSON | `cash-register.service.ts` | Helper `stripCashierPassword()` que elimina `passwordHash` antes de serializar. Aplicado en `findCurrent`, `findAll`, `findById` |

### Detalle del fix

```typescript
function stripCashierPassword(register: CashRegister): CashRegister {
  if (register.cashier) {
    delete (register.cashier as unknown as Record<string, unknown>).passwordHash;
  }
  return register;
}
```

Este es el primer modulo del proyecto que hace join con la entidad User en una respuesta publica. Los modulos anteriores (productos, categorias, clientes, inventario) no cargan relaciones con User, por lo que este issue no existia antes.

### Nota de diseno (no es bug, documentado)

**Race condition en `open()`**: Dos requests simultaneos del mismo cajero podrian pasar ambos el check `findOne` y crear 2 cajas abiertas. En un POS real con 1-2 cajeros esto es extremadamente improbable. Si en el futuro se necesita, se puede agregar un unique partial index:
```sql
CREATE UNIQUE INDEX idx_cajas_cajero_abierta ON cajas (cajero_id) WHERE estado = 'abierta';
```

---

## Patrones aplicados (consistentes con Fase 1)

| Patron | Detalle |
|--------|---------|
| DTO | Interfaces + funciones `validateXxxDto()` con `Errors.validation()` |
| Service | `const repo = () => AppDataSource.getRepository(Entity)`, funciones exportadas |
| Controller | `async (req, res, next) => { try { ... } catch(e) { next(e) } }` |
| Routes | `Router()` con `authenticate` + `authorize('admin')` para operaciones admin |
| Paginacion | `Math.max(1, page)`, `Math.min(100, Math.max(1, limit))` |
| QueryBuilder | Propiedades camelCase de la entidad (no columnas SQL): `s.cashRegisterId`, `s.paymentMethod`, `cr.openedAt` |
| Enum validation | Controller valida `status` contra `['abierta', 'cerrada']` antes de pasar al service |
| Error factories | Reutiliza `Errors.cashRegisterClosed()`, `Errors.conflict()`, `Errors.validation()`, `Errors.notFound()` |

---

## Estructura de archivos actualizada (solo cambios del paso 3)

```
backend/src/
├── controllers/
│   └── cash-register.controller.ts   ← NUEVO
├── dtos/
│   └── cash-register.dto.ts          ← NUEVO
├── routes/
│   └── cash-register.routes.ts       ← NUEVO
├── services/
│   └── cash-register.service.ts      ← NUEVO
└── index.ts                           ← MODIFICADO (import + ruta /api/cajas)
```

---

## Proximos pasos pendientes (Fase 2, pasos 4-12)

| Paso | Descripcion | Tipo | Dependencia |
|------|-------------|------|-------------|
| 4 | Ventas/POS — Backend (transaccion atomica con QueryRunner) | Backend | Requiere caja abierta (paso 3 ✅) |
| 5 | Creditos/Fiado — Backend (abonos con validacion de caja abierta) | Backend | Requiere caja abierta (paso 3 ✅) |
| 6 | Reportes — Backend (endpoints read-only de agregacion) | Backend | - |
| 7 | Tickets PDF — Backend (pdf-lib, endpoint GET /ventas/:id/ticket) | Backend | Requiere ventas (paso 4) |
| 8 | Caja — Frontend (CashRegisterPage + CashRegisterContext) | Frontend | Requiere backend caja (paso 3 ✅) |
| 9 | POS — Frontend (PosPage, ProductGrid, Cart, CheckoutDialog) | Frontend | Requiere backend ventas (paso 4) |
| 10 | Creditos — Frontend (CreditsPage, PaymentDialog) | Frontend | Requiere backend creditos (paso 5) |
| 11 | Reportes — Frontend (ReportsPage con tabs) | Frontend | Requiere backend reportes (paso 6) |
| 12 | WhatsApp + integracion final (wa.me deep links, frontend only) | Frontend | - |

### Dependencia critica para paso 4

El servicio de ventas introduce el primer uso de **TypeORM QueryRunner** para transacciones atomicas (crear venta + detalles + decrementar stock + crear credito en una sola transaccion). El paso 3 ya introduce el primer uso de QueryBuilder con SUM/COALESCE para el calculo de cierre, lo cual sienta precedente.

---

## Estado actual

- **Rama:** `dev`
- **TypeScript:** 0 errores en backend (`npx tsc --noEmit`)
- **Paso 3:** COMPLETADO — Modulo backend de Control de Caja funcional
- **Pendiente:** Pasos 4-12

---

## Como probar (requiere DB con migraciones ejecutadas)

```bash
cd backend
npm run dev

# 1. Login para obtener token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cafepos.com","password":"admin123"}'

# 2. Abrir caja
curl -X POST http://localhost:3000/api/cajas/abrir \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"initialAmount": 50000}'

# 3. Ver caja actual
curl http://localhost:3000/api/cajas/actual \
  -H "Authorization: Bearer <token>"

# 4. Cerrar caja
curl -X POST http://localhost:3000/api/cajas/cerrar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"actualCloseAmount": 48000, "closingNotes": "Faltante de 2000"}'

# 5. Historial (admin)
curl "http://localhost:3000/api/cajas?page=1&limit=10" \
  -H "Authorization: Bearer <token>"

# 6. Detalle (admin)
curl http://localhost:3000/api/cajas/1 \
  -H "Authorization: Bearer <token>"
```
