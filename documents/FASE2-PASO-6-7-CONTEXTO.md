# Fase 2 — Pasos 6 y 7: Reportes Backend + Tickets PDF

## Resumen

Se implementaron dos modulos backend independientes:
- **Paso 6 (Reportes):** 5 endpoints read-only de agregacion para dashboard administrativo
- **Paso 7 (Tickets PDF):** 1 endpoint que genera ticket de venta en formato PDF estilo impresora termica 80mm

Ademas se corrigio un bug preexistente en 3 services anteriores (filtro de fecha `<= :to` que excluia el ultimo dia).

**Archivos nuevos: 6 | Archivos modificados: 5 | Bugs corregidos: 6**

---

## Archivos creados (6)

| Archivo | Descripcion |
|---------|-------------|
| `backend/src/dtos/report.dto.ts` | 3 interfaces + 3 funciones de validacion de filtros |
| `backend/src/services/report.service.ts` | 5 funciones de agregacion con QueryBuilder (getRawOne/getRawMany) |
| `backend/src/controllers/report.controller.ts` | 5 handlers Express + feature flag check |
| `backend/src/routes/report.routes.ts` | 5 rutas GET, todas admin-only |
| `backend/src/services/ticket.service.ts` | Generador de PDF con pdf-lib (layout termico 226pt) |
| `backend/src/controllers/ticket.controller.ts` | Handler que retorna application/pdf + IDOR protection |

## Archivos modificados (5)

| Archivo | Cambio |
|---------|--------|
| `backend/src/index.ts` | Import `reportRoutes` + registro en `/api/reportes` |
| `backend/src/routes/sale.routes.ts` | Import ticket controller + ruta `GET /:id/ticket` antes de `GET /:id` |
| `backend/src/services/sale.service.ts` | Fix filtro fecha: `<= :to` → `< :toNextDay` |
| `backend/src/services/credit.service.ts` | Fix filtro fecha: `<= :to` → `< :toNextDay` |
| `backend/src/services/cash-register.service.ts` | Fix filtro fecha: `<= :to` → `< :toNextDay` |

---

## Endpoints API implementados

### Paso 6 — Reportes (todos admin-only)

| Metodo | Ruta | Query Params | Descripcion |
|--------|------|-------------|-------------|
| GET | `/api/reportes/ventas` | `from`, `to` | Resumen de ventas: total, count, promedio, desglose por forma de pago y estado |
| GET | `/api/reportes/productos-top` | `from`, `to`, `sortBy`, `limit` | Top productos vendidos por cantidad o revenue |
| GET | `/api/reportes/ventas-por-cajero` | `from`, `to` | Ventas agrupadas por cajero: count + revenue |
| GET | `/api/reportes/creditos` | — | Resumen global de creditos + desglose por cliente |
| GET | `/api/reportes/cajas` | `from`, `to`, `cashierId` | Historial de cierres de caja con montos y diferencias |

### Paso 7 — Ticket PDF

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| GET | `/api/ventas/:id/ticket` | authenticate (any) | Genera PDF del ticket. Cajeros solo pueden ver sus propias ventas |

---

## DTOs (`dtos/report.dto.ts`)

### Interfaces

```typescript
interface ReportDateRangeDto { from?: string; to?: string; }
interface TopProductsFilters extends ReportDateRangeDto { sortBy: 'quantity' | 'revenue'; limit: number; }
interface CashRegisterReportFilters extends ReportDateRangeDto { cashierId?: number; }
```

### Validaciones

- `from` / `to`: ISO date strings, from <= to si ambos presentes
- `sortBy`: enum 'quantity' | 'revenue' (default: 'quantity')
- `limit`: entero positivo (Math.floor aplicado), max 50, default 10
- `cashierId`: numerico positivo si presente

---

## Service — Reportes (`services/report.service.ts`)

### Helpers compartidos

- `nextDay(dateStr)`: calcula el dia siguiente para filtro exclusivo `< toNextDay`
- `applyDateRange(qb, alias, column, filters)`: aplica filtros de fecha al QueryBuilder
- `pf(value)` / `pi(value)`: parseFloat/parseInt seguros para resultados raw de PostgreSQL

### `salesSummary(filters)` → Resumen de ventas

Query unica con `getRawOne()` usando CASE WHEN condicional:
- SUM(total), COUNT(id), AVG(total) global
- Desglose por forma_pago: cash/card/transfer (total + count cada uno)
- Desglose por estado: paid/pending (total + count cada uno)
- COALESCE en todas las agregaciones para evitar NULLs

### `topProducts(filters)` → Top productos

- JOIN detalle_ventas → productos + ventas (para filtro fecha)
- SUM(cantidad), SUM(subtotal) GROUP BY producto
- ORDER BY configurable (quantity o revenue), LIMIT configurable (max 50)

### `salesByCashier(filters)` → Ventas por cajero

- JOIN ventas → usuarios
- COUNT(id), SUM(total) GROUP BY cajero
- LIMIT 100

### `creditSummary()` → Resumen de creditos

2 queries:
1. Global: COUNT, SUM(monto_total), SUM(saldo_pendiente), SUM(pagado)
2. Por cliente: GROUP BY cliente, ORDER BY saldo_pendiente DESC, LIMIT 100

### `cashRegisterSummary(filters)` → Cierres de caja

- Solo cajas cerradas (estado = 'cerrada')
- JOIN cashier para nombre del cajero
- Filtros: fecha_apertura range, cashierId
- LIMIT 100

---

## Service — Ticket PDF (`services/ticket.service.ts`)

### Dependencias

- `pdf-lib` v1.17.1 (ya instalado): PDFDocument, StandardFonts, PDFPage, PDFFont
- `saleService.findById()`: reutilizado para obtener venta con todas las relaciones
- `configService.getConfig()`: reutilizado para datos del negocio (nombre, direccion, telefono, simbolo moneda)

### Layout del ticket (estilo impresora termica 80mm)

| Propiedad | Valor |
|-----------|-------|
| Ancho pagina | 226pt (~80mm) |
| Margenes | 10pt cada lado (area util 206pt) |
| Fuentes | Helvetica + HelveticaBold (WinAnsiEncoding) |
| Altura | Calculada dinamicamente por seccion |

### Secciones del PDF

| Seccion | Contenido | Font/Size |
|---------|-----------|-----------|
| Header negocio | Nombre (bold centrado), direccion, telefono | 10pt / 7pt |
| Separador | Linea de guiones centrada | 7pt |
| Info venta | Venta #ID, fecha DD/MM/YYYY HH:mm, cajero, cliente (si aplica) | 8pt |
| Tabla items | Producto (truncado 16 chars) / Cant / P.Unit / Subtotal | 8pt |
| Total | TOTAL: $XX.XXX (bold, derecha) | 10pt |
| Forma de pago | cash→Efectivo, card→Tarjeta, transfer→Transferencia | 8pt |
| Credito (condicional) | ** VENTA A CREDITO ** + saldo pendiente (si status='pending') | 8pt |
| Footer | Gracias por su compra! (centrado) | 7pt |

### Helpers internos

- `formatDate(date)` → DD/MM/YYYY HH:mm (manual, sin dependencias de locale)
- `formatCurrency(amount, symbol)` → formato colombiano manual: `$50.000` (sin dependencia ICU)
- `truncate(text, maxLen)` → recorta con `..` (ASCII, compatible WinAnsiEncoding)
- `drawCentered()`, `drawRight()`, `drawSeparator()` → primitivas de dibujo PDF
- `calculateHeight(sale, config)` → calculo preciso por seccion con alturas reales

---

## Bugs encontrados y corregidos (6)

### Revision critica — 6 issues corregidos

| # | Severidad | Archivo(s) | Bug | Fix |
|---|-----------|-----------|-----|-----|
| 1 | **CRITICAL** | `sale.service.ts`, `credit.service.ts`, `cash-register.service.ts`, `report.service.ts` | Filtro `<= :to` con TIMESTAMP: `to=2025-01-31` comparaba con `2025-01-31 00:00:00`, excluyendo todo el dia | Cambiado a `< :toNextDay` donde toNextDay = to + 1 dia. Ahora `to=2025-01-31` genera `< 2025-02-01` |
| 2 | **MEDIUM** | `ticket.controller.ts` | Endpoint `/ventas/:id/ticket` sin control de acceso — cualquier cajero podia ver tickets de cualquier venta (IDOR) | Cajeros no-admin solo pueden generar tickets de sus propias ventas (`sale.cashierId !== req.user.id` → 403) |
| 3 | **MEDIUM** | `ticket.service.ts` | `toLocaleString('es-CO')` depende de ICU completo en Node.js — formato incorrecto si el build tiene small-icu | Formateador manual con regex para separadores de miles (`.`) y coma decimal colombiana |
| 4 | **LOW** | `report.dto.ts` | `limit` aceptaba valores float (ej: 10.5) que se pasaban a `.limit()` de TypeORM | Agregado `Math.floor()` antes de validar |
| 5 | **MEDIUM** | `report.service.ts` | `salesByCashier`, `creditSummary.byCustomer`, `cashRegisterSummary` retornaban resultados sin limite | Agregado `.limit(100)` a las 3 queries |
| 6 | **MEDIUM** | `ticket.service.ts` | Calculo de altura usaba `lines * LINE_MD + 60` (uniforme) cuando las secciones usan LINE_LG/LINE_SM/SEPARATOR_GAP diferentes | Calculo preciso por seccion sumando las alturas reales de cada elemento |

### Bug adicional corregido durante implementacion

| # | Severidad | Archivo | Bug | Fix |
|---|-----------|---------|-----|-----|
| 7 | **MEDIUM** | `ticket.service.ts` | Caracter Unicode ellipsis `…` (U+2026) no soportado por WinAnsiEncoding de pdf-lib | Cambiado a `..` (ASCII) |

---

## Reglas de negocio

| Regla | Implementacion |
|-------|---------------|
| Reportes solo para admin | `authorize('admin')` en todas las rutas de reportes |
| Feature flag `usesReports` | Verificado en cada handler via `configService.getConfig()` → 403 si deshabilitado |
| Feature flag `usesTicketsPdf` | Verificado en ticket controller → 403 si deshabilitado |
| Ticket: cajeros solo sus ventas | `sale.cashierId !== req.user.id` → 403 para no-admin |
| Filtro fecha inclusivo | `>= from` y `< toNextDay` (dia siguiente) para incluir todo el ultimo dia |
| Resultados limitados | Todas las queries tienen LIMIT (50 para productos, 100 para el resto) |
| Formato moneda colombiano | Manual: separador miles `.`, decimal `,`, sin decimales si son `00` |

---

## Patrones aplicados

| Patron | Detalle |
|--------|---------|
| DTO | Interfaces + funciones `validate*()` con `Errors.validation()` |
| Service | `const repo = () => AppDataSource.getRepository(Entity)`, funciones exportadas |
| Controller | `async (req, res, next) => { try { ... } catch(e) { next(e) } }` |
| Routes | `Router()` con `authenticate` + `authorize('admin')` |
| Feature flags | `configService.getConfig()` → verificar boolean → `Errors.forbidden()` |
| QueryBuilder raw | `.select()` / `.addSelect()` con COALESCE, CASE WHEN, SUM, COUNT, AVG |
| Raw result parsing | `parseFloat()` / `parseInt()` con fallback `?? '0'` para NULLs de PostgreSQL |
| IDOR protection | Verificar ownership (`cashierId === req.user.id`) para usuarios no-admin |
| PDF generation | pdf-lib con StandardFonts, cursor `y` descendente, helpers de alineacion |
| **NUEVO: Filtro fecha exclusivo** | `< toNextDay` en vez de `<= to` para TIMESTAMP vs DATE (aplicado retroactivamente a pasos 3-5) |

---

## Estructura de archivos actualizada (cambios de pasos 6 y 7)

```
backend/src/
├── controllers/
│   ├── report.controller.ts            ← NUEVO (paso 6)
│   └── ticket.controller.ts            ← NUEVO (paso 7)
├── dtos/
│   └── report.dto.ts                   ← NUEVO (paso 6)
├── routes/
│   ├── report.routes.ts                ← NUEVO (paso 6)
│   └── sale.routes.ts                  ← MODIFICADO (paso 7: ruta ticket)
├── services/
│   ├── report.service.ts               ← NUEVO (paso 6)
│   ├── ticket.service.ts               ← NUEVO (paso 7)
│   ├── sale.service.ts                 ← MODIFICADO (fix fecha)
│   ├── credit.service.ts               ← MODIFICADO (fix fecha)
│   └── cash-register.service.ts        ← MODIFICADO (fix fecha)
└── index.ts                            ← MODIFICADO (import + ruta /api/reportes)
```

---

## Proximos pasos pendientes (Fase 2, pasos 8-12)

| Paso | Descripcion | Tipo | Dependencia |
|------|-------------|------|-------------|
| 8 | Caja — Frontend (CashRegisterPage + CashRegisterContext) | Frontend | Backend caja (paso 3 ✅) |
| 9 | POS — Frontend (PosPage, ProductGrid, Cart, CheckoutDialog) | Frontend | Backend ventas (paso 4 ✅) |
| 10 | Creditos — Frontend (CreditsPage, PaymentDialog) | Frontend | Backend creditos (paso 5 ✅) |
| 11 | Reportes — Frontend (ReportsPage con tabs) | Frontend | Backend reportes (paso 6 ✅) |
| 12 | WhatsApp + integracion final (wa.me deep links, frontend only) | Frontend | — |

### Dependencias actualizadas

- Pasos 8, 9 y 10 pueden ejecutarse en paralelo (frontend independiente, backends completos)
- Paso 11 ya tiene su backend completo (paso 6)
- Paso 12 es independiente

---

## Estado actual

- **Rama:** `dev`
- **TypeScript:** 0 errores en backend (`npx tsc --noEmit`)
- **Pasos 6 y 7:** COMPLETADOS
- **Backend Fase 2:** 100% completo (pasos 1-7)
- **Pendiente:** Pasos 8-12 (todos frontend)

---

## Como probar

```bash
cd backend
npm run dev

# 1. Login para obtener token admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cafepos.com","password":"admin123"}'

# ─── PASO 6: REPORTES ───

# 2. Resumen de ventas (sin filtro de fecha — todas)
curl http://localhost:3000/api/reportes/ventas \
  -H "Authorization: Bearer <token>"

# 3. Resumen de ventas con rango de fecha
curl "http://localhost:3000/api/reportes/ventas?from=2025-01-01&to=2026-12-31" \
  -H "Authorization: Bearer <token>"

# 4. Top productos por cantidad vendida
curl "http://localhost:3000/api/reportes/productos-top?limit=5&sortBy=quantity" \
  -H "Authorization: Bearer <token>"

# 5. Top productos por revenue
curl "http://localhost:3000/api/reportes/productos-top?sortBy=revenue" \
  -H "Authorization: Bearer <token>"

# 6. Ventas por cajero
curl http://localhost:3000/api/reportes/ventas-por-cajero \
  -H "Authorization: Bearer <token>"

# 7. Ventas por cajero con rango de fecha
curl "http://localhost:3000/api/reportes/ventas-por-cajero?from=2025-01-01&to=2026-12-31" \
  -H "Authorization: Bearer <token>"

# 8. Resumen de creditos
curl http://localhost:3000/api/reportes/creditos \
  -H "Authorization: Bearer <token>"

# 9. Cierres de caja
curl http://localhost:3000/api/reportes/cajas \
  -H "Authorization: Bearer <token>"

# 10. Cierres de caja filtrado por cajero
curl "http://localhost:3000/api/reportes/cajas?cashierId=1" \
  -H "Authorization: Bearer <token>"

# 11. Error: cashier intenta acceder a reportes → 403
curl http://localhost:3000/api/reportes/ventas \
  -H "Authorization: Bearer <token_cashier>"

# 12. Error: fecha invalida → 400
curl "http://localhost:3000/api/reportes/ventas?from=invalid" \
  -H "Authorization: Bearer <token>"

# 13. Error: from > to → 400
curl "http://localhost:3000/api/reportes/ventas?from=2026-12-31&to=2025-01-01" \
  -H "Authorization: Bearer <token>"

# ─── PASO 7: TICKET PDF ───

# 14. Generar ticket PDF (guardar en archivo)
curl http://localhost:3000/api/ventas/1/ticket \
  -H "Authorization: Bearer <token>" \
  --output ticket-venta-1.pdf

# 15. Venta inexistente → 404
curl http://localhost:3000/api/ventas/99999/ticket \
  -H "Authorization: Bearer <token>"

# 16. ID invalido → 400
curl http://localhost:3000/api/ventas/abc/ticket \
  -H "Authorization: Bearer <token>"

# 17. Cajero intenta ver ticket de otra venta → 403
curl http://localhost:3000/api/ventas/1/ticket \
  -H "Authorization: Bearer <token_otro_cajero>"

# 18. Sin token → 401
curl http://localhost:3000/api/ventas/1/ticket
```
