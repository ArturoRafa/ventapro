# cafe-pos

Sistema web de inventario, punto de venta y gestión de créditos para cafeterías y negocios pequeños con mostrador.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript + Material UI v5 |
| Backend | Node.js 20 + Express + TypeScript + TypeORM |
| Base de datos | PostgreSQL 15+ (Neon) |
| Auth | JWT + bcrypt |
| Tickets | HTML imprimible + pdf-lib |

## Estructura del Monorepo

```
cafe-pos/
├── frontend/    # React SPA (Vercel)
├── backend/     # Node.js REST API (Railway)
└── docs/        # Documentación del proyecto
```

## Requisitos

- Node.js 20 LTS
- npm 10+
- PostgreSQL 15+ (o cuenta en Neon)

## Setup rápido

```bash
# Backend
cd backend
cp .env.example .env    # Configurar variables
npm install
npm run dev

# Frontend (otra terminal)
cd frontend
cp .env.example .env    # Configurar VITE_API_URL
npm install
npm run dev
```

## Scripts disponibles

Cada proyecto (frontend/backend) incluye:

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar en producción |
| `npm run lint` | Verificar linting |
| `npm run lint:fix` | Corregir linting |
| `npm run format` | Formatear código |
| `npm run format:check` | Verificar formato |
| `npm run typecheck` | Verificar tipos TypeScript |

## Glosario de Dominio

Términos del negocio usados en el código que se mantienen en español:

| Término (ES) | Variable (EN) | Significado |
|--------------|---------------|-------------|
| Fiado | `credit` | Venta a crédito sin pago inmediato |
| Abono | `payment` / `abono` | Pago parcial de una deuda |
| Caja | `cashRegister` | Apertura/cierre de caja del día |
| Cajero | `cashier` | Rol con permisos limitados |
| Venta | `sale` | Transacción de venta |
| Detalle de venta | `saleDetail` | Línea individual de una venta |
| Stock mínimo | `minStock` | Umbral para alerta de reposición |
| Forma de pago | `paymentMethod` | Efectivo, tarjeta, transferencia |

## Documentación

- [Convenciones Técnicas](docs/CONVENTIONS.md)
- [Arquitectura](docs/architecture.md)
- [Decisiones Técnicas](docs/technical-decisions.md)

## Infraestructura

| Servicio | Proveedor | Costo/mes |
|----------|-----------|-----------|
| Frontend | Vercel (Hobby) | $0 |
| Backend | Railway (Starter) | ~$5 USD |
| Base de datos | Neon (Free) | $0 |

---

*Metodología: Desarrollo asistido con IA (Claude Code)*
