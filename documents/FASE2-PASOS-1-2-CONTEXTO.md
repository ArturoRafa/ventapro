# Fase 2 — Pasos 1 y 2: Migracion y Entidades

## Resumen

Se completaron los pasos 1 (migracion) y 2 (entidades TypeORM) de la Fase 2 del proyecto VentaPro/InventarioCaja. Se agregaron 5 tablas nuevas a la base de datos y sus correspondientes 5 entidades TypeORM, mas las relaciones inversas en 3 entidades existentes.

---

## Commits realizados

```
51fe0f2 feat(phase2): add 5 TypeORM entities and update existing entity relations
155386c feat(phase2): add migration for 5 new tables (cajas, ventas, detalle_ventas, creditos, abonos)
e56feee fix(phase1): address 12 bugs and improvements from critical review
8be5027 feat(phase1): implement auth, products, inventory, categories, customers and config
b2285b4 chore: bootstrap monorepo with backend and frontend scaffolding
152ddf4 test: verify push access
```

- **Rama:** `dev`
- **TypeScript:** 0 errores en backend tras los cambios
- **Migracion pendiente de ejecutar:** Requiere `npm run migration:run` contra la DB

---

## Paso 1: Migracion Phase2Schema

### Archivo creado

- `backend/src/migrations/1776000000000-Phase2Schema.ts`

### 5 tablas nuevas

| Tabla | Columnas | FKs | Checks | Indices |
|-------|----------|-----|--------|---------|
| `cajas` | id, cajero_id, monto_inicial, monto_cierre_real, monto_cierre_sistema, diferencia, estado(abierta/cerrada), fecha_apertura, fecha_cierre, notas_cierre | usuarios(cajero_id) | estado IN (abierta,cerrada) | cajero_id, estado, fecha_apertura |
| `ventas` | id, caja_id, cliente_id?, cajero_id, total, forma_pago(cash/card/transfer), estado(paid/pending), created_at | cajas(caja_id), clientes(cliente_id), usuarios(cajero_id) | forma_pago, estado, total>=0 | caja_id, cliente_id, cajero_id, estado, forma_pago, created_at |
| `detalle_ventas` | id, venta_id, producto_id, cantidad, precio_unitario, subtotal | ventas(venta_id) CASCADE, productos(producto_id) RESTRICT | cantidad>0, precio_unitario>=0, subtotal>=0 | venta_id, producto_id |
| `creditos` | id, cliente_id, venta_id, monto_total, saldo_pendiente, estado(pending/paid), created_at | clientes(cliente_id), ventas(venta_id) | estado, monto_total>=0, saldo_pendiente>=0 | cliente_id, venta_id, estado, created_at |
| `abonos` | id, credito_id, cliente_id, caja_id, monto, fecha, notas | creditos(credito_id), clientes(cliente_id), cajas(caja_id) | monto>0 | credito_id, cliente_id, caja_id, fecha |

### Desviacion del SQL de referencia

Se agrego `caja_id INT NOT NULL FK -> cajas(id)` a la tabla `abonos`. El SQL de referencia (`documents/scrips_proyecto.sql`) no lo incluia.

**Justificacion:** Al cerrar caja, el calculo del monto sistema debe ser:
```
monto_sistema = monto_inicial + SUM(ventas_cash) + SUM(abonos)
```
Sin `caja_id` en abonos, no hay forma confiable de determinar que abonos corresponden a una sesion de caja. Usar rangos de fechas seria fragil y propenso a errores en sesiones superpuestas.

### Totales de la migracion

- 11 Foreign Keys (todas ON DELETE RESTRICT excepto detalle_ventas→ventas que es CASCADE)
- 10 CHECK constraints
- 19 indices
- 0 triggers (las tablas nuevas no tienen `updated_at` — son registros inmutables)

### Metodo `down()`

Limpia en orden inverso de dependencias:
1. Drop indices
2. Drop foreign keys (abonos → creditos → detalle_ventas → ventas → cajas)
3. Drop tablas (abonos → creditos → detalle_ventas → ventas → cajas)

---

## Paso 2: Entidades TypeORM

### 5 entidades nuevas creadas

| Entidad (ingles) | Tabla (espanol) | Archivo |
|-------------------|-----------------|---------|
| `CashRegister` | `cajas` | `backend/src/entities/CashRegister.ts` |
| `Sale` | `ventas` | `backend/src/entities/Sale.ts` |
| `SaleDetail` | `detalle_ventas` | `backend/src/entities/SaleDetail.ts` |
| `Credit` | `creditos` | `backend/src/entities/Credit.ts` |
| `CreditPayment` | `abonos` | `backend/src/entities/CreditPayment.ts` |

### 3 entidades existentes modificadas

| Entidad | Relaciones agregadas |
|---------|---------------------|
| `User` | `OneToMany → CashRegister[]` (cashRegisters), `OneToMany → Sale[]` (sales) |
| `Customer` | `OneToMany → Sale[]` (sales), `OneToMany → Credit[]` (credits), `OneToMany → CreditPayment[]` (creditPayments) |
| `Product` | `OneToMany → SaleDetail[]` (saleDetails) |

### Index actualizado

`backend/src/entities/index.ts` ahora exporta 11 entidades (6 de Fase 1 + 5 de Fase 2).

---

## Mapa de relaciones completo (11 tablas)

```
usuarios        1 ──< N   cajas              (cajero_id)
usuarios        1 ──< N   ventas             (cajero_id)
cajas           1 ──< N   ventas             (caja_id)
cajas           1 ──< N   abonos             (caja_id)        ← NUEVO (no en SQL ref)
clientes        1 ──< N   ventas             (cliente_id)     nullable
clientes        1 ──< N   creditos           (cliente_id)
clientes        1 ──< N   abonos             (cliente_id)
ventas          1 ──< N   detalle_ventas     (venta_id)       CASCADE
ventas          1 ──── 1  creditos           (venta_id)
productos       1 ──< N   detalle_ventas     (producto_id)
creditos        1 ──< N   abonos             (credito_id)
categorias      1 ──< N   subcategorias      (categoria_id)   [Fase 1]
subcategorias   1 ──< N   productos          (subcategoria_id) [Fase 1]
```

---

## Patrones aplicados (consistentes con Fase 1)

### Naming

- Entidades: PascalCase ingles (`CashRegister`, `SaleDetail`)
- Tablas: snake_case espanol via `@Entity('cajas')`, `@Entity('detalle_ventas')`
- Columnas: snake_case espanol via `{ name: 'cajero_id' }`, `{ name: 'monto_inicial' }`
- Propiedades: camelCase ingles (`cashierId`, `initialAmount`, `paymentMethod`)

### Decimal transformer

Todas las columnas `DECIMAL(12,2)` usan `decimalTransformer` para convertir string→number:
```typescript
const decimalTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => parseFloat(value),
};
```

`CashRegister` usa variante nullable:
```typescript
const decimalTransformer = {
  to: (value: number | null): number | null => value,
  from: (value: string | null): number | null => (value === null ? null : parseFloat(value)),
};
```

### Relaciones

- `@ManyToOne` + `@JoinColumn({ name: 'columna_espanol' })` en el lado propietario
- `@OneToMany(() => Entity, (e) => e.inverseProperty)` en el lado inverso
- `@OneToOne` + `@JoinColumn` en `Credit` → `Sale` (el credito es propietario)
- Todas las FK: `onDelete: 'RESTRICT', onUpdate: 'CASCADE'` excepto `SaleDetail→Sale` que es `onDelete: 'CASCADE'`

### Timestamps

- Tablas inmutables (`ventas`, `detalle_ventas`, `creditos`, `abonos`): solo `created_at` o `fecha`, sin `updated_at`, sin triggers
- `cajas`: sin timestamps decorados, usa columnas manuales `fecha_apertura` / `fecha_cierre`

---

## Detalle de cada entidad nueva

### CashRegister (`cajas`)

```typescript
@Entity('cajas')
export class CashRegister {
  id: number;
  cashierId: number;                    // cajero_id → FK usuarios
  initialAmount: number | null;         // monto_inicial — nullable DECIMAL(12,2)
  actualCloseAmount: number | null;     // monto_cierre_real
  systemCloseAmount: number | null;     // monto_cierre_sistema
  difference: number | null;            // diferencia
  status: 'abierta' | 'cerrada';       // estado — default 'abierta'
  openedAt: Date;                       // fecha_apertura — default NOW()
  closedAt: Date | null;               // fecha_cierre — nullable
  closingNotes: string | null;         // notas_cierre — nullable

  // Relaciones
  cashier: User;                        // ManyToOne → User
  sales: Sale[];                        // OneToMany → Sale
  creditPayments: CreditPayment[];      // OneToMany → CreditPayment
}
```

### Sale (`ventas`)

```typescript
@Entity('ventas')
export class Sale {
  id: number;
  cashRegisterId: number;               // caja_id → FK cajas
  customerId: number | null;            // cliente_id → FK clientes (nullable)
  cashierId: number;                    // cajero_id → FK usuarios
  total: number;                        // total — DECIMAL(12,2)
  paymentMethod: 'cash' | 'card' | 'transfer';  // forma_pago
  status: 'paid' | 'pending';          // estado — default 'paid'
  createdAt: Date;                      // created_at — @CreateDateColumn

  // Relaciones
  cashRegister: CashRegister;           // ManyToOne → CashRegister
  customer: Customer | null;            // ManyToOne → Customer (nullable)
  cashier: User;                        // ManyToOne → User
  details: SaleDetail[];                // OneToMany → SaleDetail
  credit: Credit | null;                // OneToOne → Credit (inverso)
}
```

### SaleDetail (`detalle_ventas`)

```typescript
@Entity('detalle_ventas')
export class SaleDetail {
  id: number;
  saleId: number;                       // venta_id → FK ventas (CASCADE)
  productId: number;                    // producto_id → FK productos (RESTRICT)
  quantity: number;                     // cantidad — CHECK > 0
  unitPrice: number;                    // precio_unitario — DECIMAL(12,2), snapshot del precio
  subtotal: number;                     // subtotal — DECIMAL(12,2)

  // Relaciones
  sale: Sale;                           // ManyToOne → Sale
  product: Product;                     // ManyToOne → Product
}
```

### Credit (`creditos`)

```typescript
@Entity('creditos')
export class Credit {
  id: number;
  customerId: number;                   // cliente_id → FK clientes
  saleId: number;                       // venta_id → FK ventas (1:1)
  totalAmount: number;                  // monto_total — DECIMAL(12,2)
  pendingBalance: number;               // saldo_pendiente — DECIMAL(12,2)
  status: 'pending' | 'paid';          // estado — default 'pending'
  createdAt: Date;                      // created_at — @CreateDateColumn

  // Relaciones
  customer: Customer;                   // ManyToOne → Customer
  sale: Sale;                           // OneToOne → Sale (@JoinColumn aqui)
  payments: CreditPayment[];            // OneToMany → CreditPayment
}
```

### CreditPayment (`abonos`)

```typescript
@Entity('abonos')
export class CreditPayment {
  id: number;
  creditId: number;                     // credito_id → FK creditos
  customerId: number;                   // cliente_id → FK clientes (denormalizado)
  cashRegisterId: number;               // caja_id → FK cajas (agregado, no en SQL ref)
  amount: number;                       // monto — DECIMAL(12,2), CHECK > 0
  date: Date;                           // fecha — default NOW()
  notes: string | null;                 // notas — nullable

  // Relaciones
  credit: Credit;                       // ManyToOne → Credit
  customer: Customer;                   // ManyToOne → Customer
  cashRegister: CashRegister;           // ManyToOne → CashRegister
}
```

---

## Estructura de archivos actualizada (solo cambios)

```
backend/src/
├── entities/
│   ├── CashRegister.ts     ← NUEVO
│   ├── Credit.ts           ← NUEVO
│   ├── CreditPayment.ts    ← NUEVO
│   ├── Sale.ts             ← NUEVO
│   ├── SaleDetail.ts       ← NUEVO
│   ├── Customer.ts         ← MODIFICADO (3 OneToMany agregados)
│   ├── Product.ts          ← MODIFICADO (1 OneToMany agregado)
│   ├── User.ts             ← MODIFICADO (2 OneToMany agregados)
│   ├── index.ts            ← MODIFICADO (5 exports agregados)
│   ├── BusinessConfig.ts   (sin cambios)
│   ├── Category.ts         (sin cambios)
│   └── Subcategory.ts      (sin cambios)
├── migrations/
│   ├── 1775869362804-InitialSchema.ts   (Fase 1, sin cambios)
│   └── 1776000000000-Phase2Schema.ts    ← NUEVO
```

---

## Proximos pasos pendientes (Fase 2, pasos 3-12)

| Paso | Descripcion | Tipo |
|------|-------------|------|
| 3 | Control de Caja — Backend (DTOs, service, controller, routes) | Backend |
| 4 | Ventas/POS — Backend (transaccion atomica con QueryRunner) | Backend |
| 5 | Creditos/Fiado — Backend (abonos con validacion de caja abierta) | Backend |
| 6 | Reportes — Backend (endpoints read-only de agregacion) | Backend |
| 7 | Tickets PDF — Backend (pdf-lib, endpoint GET /ventas/:id/ticket) | Backend |
| 8 | Caja — Frontend (CashRegisterPage + CashRegisterContext) | Frontend |
| 9 | POS — Frontend (PosPage, ProductGrid, Cart, CheckoutDialog) | Frontend |
| 10 | Creditos — Frontend (CreditsPage, PaymentDialog) | Frontend |
| 11 | Reportes — Frontend (ReportsPage con tabs) | Frontend |
| 12 | WhatsApp + integracion final (wa.me deep links, frontend only) | Frontend |

### Dependencia critica para paso 4

El servicio de ventas introduce el primer uso de **TypeORM QueryRunner** para transacciones atomicas (crear venta + detalles + decrementar stock + crear credito en una sola transaccion). Esto es un patron nuevo que no existe en la Fase 1.

### Error factories ya disponibles en `AppError.ts`

```typescript
Errors.insufficientStock(productName, available, requested)  // 422
Errors.inactiveProduct(productName)                          // 422
Errors.cashRegisterClosed()                                  // 422
```

---

## Como ejecutar la migracion

```bash
cd backend
npm run migration:run
```

Esto creara las 5 tablas nuevas en la base de datos PostgreSQL (Neon).
