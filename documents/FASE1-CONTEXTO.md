# Fase 1 — Contexto completo de implementacion

## Descripcion del proyecto

**VentaPro / InventarioCaja** es un sistema POS (Point of Sale) web para cafeterias y negocios pequenos. Permite gestionar productos, inventario, categorias, clientes y creditos (fiado), con control de caja y reportes.

- **Repositorio:** https://github.com/ArturoRafa/ventapro.git
- **Rama principal:** `main`
- **Rama de desarrollo:** `dev`
- **Base de datos:** PostgreSQL (Neon serverless)

---

## Stack tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Backend runtime | Node.js | 20.19.0 |
| Backend framework | Express | 4.x |
| ORM | TypeORM | 0.3.x |
| Base de datos | PostgreSQL (Neon) | 15+ |
| Frontend framework | React | 18.x |
| UI Library | Material UI (MUI) | 5.x |
| Build tool | Vite | 5.x |
| Lenguaje | TypeScript | 5.x |
| Autenticacion | JWT (jsonwebtoken + bcryptjs) |

---

## Plan de implementacion — 10 pasos secuenciales

La Fase 1 se implemento siguiendo estos 10 pasos en orden:

1. **Entidades TypeORM** — 6 tablas: usuarios, configuracion_negocio, categorias, subcategorias, productos, clientes
2. **Migracion + Seed** — Esquema completo con CHECK constraints, indices, triggers + datos iniciales (admin, config, 4 categorias con 14 subcategorias)
3. **Auth backend** — JWT login + middlewares `authenticate` / `authorize`
4. **Config backend** — CRUD singleton para configuracion del negocio
5. **Categorias/Subcategorias backend** — CRUD + desactivacion en cascada
6. **Productos/Inventario backend** — CRUD + stock + alertas de bajo stock
7. **Clientes backend** — CRUD preparatorio para modulo de creditos
8. **Frontend Auth + Layout** — Login, contextos (Auth, Config, Snackbar), sidebar, rutas protegidas, componentes UI base
9. **Frontend paginas** — Productos, Categorias, Inventario, Clientes
10. **Config page + integracion final** — Pagina de configuracion con feature flags

---

## Estructura del proyecto

```
InventarioCaja/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts          # DataSource con SSL para Neon, path.join para globs
│   │   │   ├── env.ts               # Variables de entorno
│   │   │   └── seed.ts              # Seed: admin + config + categorias + subcategorias
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── category.controller.ts
│   │   │   ├── config.controller.ts
│   │   │   ├── customer.controller.ts
│   │   │   ├── inventory.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   └── subcategory.controller.ts
│   │   ├── dtos/
│   │   │   ├── auth.dto.ts
│   │   │   ├── category.dto.ts
│   │   │   ├── config.dto.ts
│   │   │   ├── customer.dto.ts
│   │   │   └── product.dto.ts
│   │   ├── entities/
│   │   │   ├── BusinessConfig.ts     # configuracion_negocio (singleton)
│   │   │   ├── Category.ts           # categorias
│   │   │   ├── Customer.ts           # clientes
│   │   │   ├── Product.ts            # productos
│   │   │   ├── Subcategory.ts        # subcategorias
│   │   │   ├── User.ts               # usuarios
│   │   │   └── index.ts
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts     # authenticate + authorize
│   │   │   └── error.middleware.ts    # Error handler global
│   │   ├── migrations/
│   │   │   └── 1775869362804-InitialSchema.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── category.routes.ts
│   │   │   ├── config.routes.ts
│   │   │   ├── customer.routes.ts
│   │   │   ├── inventory.routes.ts
│   │   │   ├── product.routes.ts
│   │   │   └── subcategory.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── category.service.ts
│   │   │   ├── config.service.ts
│   │   │   ├── customer.service.ts
│   │   │   ├── inventory.service.ts
│   │   │   ├── product.service.ts
│   │   │   └── subcategory.service.ts
│   │   ├── types/
│   │   │   └── express.d.ts          # Augmenta Request con user
│   │   ├── utils/
│   │   │   └── AppError.ts           # Errores custom con factory methods
│   │   └── index.ts                  # Entry point del servidor
│   ├── .env                          # Variables de entorno (NO commitear)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.tsx    # AppBar + Sidebar + Outlet
│   │   │   │   └── Sidebar.tsx       # Navegacion filtrada por rol y feature flags
│   │   │   └── ui/
│   │   │       ├── ConfirmDialog.tsx  # Dialog reutilizable de confirmacion
│   │   │       ├── ProtectedRoute.tsx # Wrapper de ruta protegida por auth/rol
│   │   │       └── StatusChip.tsx     # Chip activo/inactivo
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # Estado de auth + JWT + login/logout
│   │   │   ├── ConfigContext.tsx      # Config del negocio + feature flags
│   │   │   └── SnackbarContext.tsx    # Notificaciones globales
│   │   ├── hooks/
│   │   │   └── useDebounce.ts        # Hook de debounce generico
│   │   ├── pages/
│   │   │   ├── CategoriesPage.tsx    # CRUD categorias + subcategorias (2 paneles)
│   │   │   ├── ConfigPage.tsx        # Configuracion del negocio
│   │   │   ├── CustomersPage.tsx     # CRUD clientes
│   │   │   ├── InventoryPage.tsx     # Vista de stock + ajuste manual
│   │   │   ├── LoginPage.tsx         # Login
│   │   │   └── ProductsPage.tsx      # CRUD productos completo
│   │   ├── services/
│   │   │   ├── api.ts                # Cliente HTTP base con JWT y interceptor 401
│   │   │   ├── auth.service.ts
│   │   │   ├── category.service.ts
│   │   │   ├── config.service.ts
│   │   │   ├── customer.service.ts
│   │   │   ├── inventory.service.ts
│   │   │   └── product.service.ts
│   │   ├── types/
│   │   │   ├── api.types.ts
│   │   │   ├── auth.types.ts
│   │   │   ├── category.types.ts
│   │   │   ├── config.types.ts
│   │   │   ├── customer.types.ts
│   │   │   └── product.types.ts
│   │   ├── utils/
│   │   │   ├── dateHelpers.ts
│   │   │   └── formatCurrency.ts
│   │   ├── App.tsx                   # Router + providers
│   │   ├── main.tsx                  # Entry point React
│   │   └── theme.ts                  # Tema MUI
│   ├── package.json
│   └── tsconfig.json
│
├── documents/                        # Documentacion del proyecto
│   ├── CONVENTIONS.md
│   ├── architecture-md.md
│   ├── decision-categorias-subcategorias.md
│   ├── decisiones tecnicas.txt
│   └── scrips_proyecto.sql
│
├── .gitignore
├── .prettierrc
└── README.md
```

---

## Detalle de modulos implementados

### Backend

#### Autenticacion (`/api/auth`)
- **POST /login** — Recibe email + password, valida contra usuario activo en DB, retorna JWT
- JWT contiene: `{ id, email, role }`, expira en 24h
- Middleware `authenticate`: verifica Bearer token, inyecta `req.user`
- Middleware `authorize(...roles)`: verifica que `req.user.role` este en la lista permitida
- Usa `return next(error)` para manejo consistente de errores

#### Configuracion (`/api/configuracion`)
- **GET /** — Retorna la configuracion singleton (id=1)
- **PUT /** — Actualiza campos de configuracion (admin only)
- Tabla singleton `configuracion_negocio` con: identidad del negocio, localizacion (moneda, impuesto), feature flags (usesCredit, usesFood, usesCashRegister, usesWhatsapp, usesReports, usesTicketsPdf, requiresOpeningAmount)

#### Categorias (`/api/categorias`)
- **GET /** — Lista todas las categorias (opcionalmente con subcategorias via `?include=subcategories`)
- **GET /:id** — Detalle de categoria con subcategorias
- **POST /** — Crear categoria (admin only)
- **PUT /:id** — Actualizar categoria (admin only)
- **PATCH /:id/toggle** — Activar/desactivar (admin only). **Cascade:** desactivar una categoria desactiva todas sus subcategorias

#### Subcategorias (`/api/subcategorias`)
- CRUD completo con validacion de categoria padre activa
- Toggle status individual

#### Productos (`/api/productos`)
- **GET /** — Listado paginado con filtros: `subcategoryId`, `type`, `status`, `search`
- **GET /low-stock** — Productos con stock <= minStock
- **POST /** — Crear producto (valida codigo unico + subcategoria activa)
- **PUT /:id** — Actualizar producto (valida subcategoria activa en reasignacion)
- **PATCH /:id/toggle** — Activar/desactivar
- Dos tipos: `inventory` (controla stock) y `food` (sin stock)
- Transformer decimal para columna `precio` (PostgreSQL DECIMAL retorna string)

#### Inventario (`/api/inventario`)
- **GET /** — Vista de stock paginada (solo productos tipo `inventory` activos), con filtro `lowStockOnly`
- **POST /adjust/:id** — Ajuste manual de stock con validacion de stock no negativo

#### Clientes (`/api/clientes`)
- CRUD completo con busqueda por nombre o telefono
- Toggle status (activo/inactivo)
- Preparatorio para modulo de creditos (Fase 2+)

### Frontend

#### Contextos
- **AuthContext** — Maneja estado de autenticacion, JWT en localStorage, decode de token para verificar expiracion al montar
- **ConfigContext** — Carga config del negocio despues de auth, provee feature flags consumidos por Sidebar
- **SnackbarContext** — Sistema de notificaciones global con MUI Snackbar + Alert

#### Layout
- **MainLayout** — AppBar con nombre del negocio + info usuario + logout, Drawer permanente con Sidebar, Outlet para contenido
- **Sidebar** — Items de navegacion filtrados por: rol del usuario (`adminOnly`) y feature flags de config (`featureFlag`)

#### Paginas
- **LoginPage** — Formulario email + password, redirige a `/productos` al autenticarse
- **ProductsPage** — Tabla con paginacion, busqueda debounced, filtros. Dialog para crear/editar con selects cascada categoria→subcategoria. Muestra subcategoria inactiva al editar producto existente
- **CategoriesPage** — Layout de 2 paneles: categorias (izquierda), subcategorias de la seleccionada (derecha). CRUD con dialogs para ambas
- **InventoryPage** — Vista de stock con resaltado de bajo stock (rojo), filtro solo-bajo-stock, dialog de ajuste manual
- **CustomersPage** — Tabla CRUD con busqueda, paginacion, toggle de estado
- **ConfigPage** — Formulario organizado en secciones: identidad, localizacion, modulos (switches de feature flags), WhatsApp

#### Componentes UI reutilizables
- **ProtectedRoute** — Wrapper que verifica auth + rol, redirige a `/login` si no cumple
- **ConfirmDialog** — Dialog generico de confirmacion con `onConfirm` / `onCancel`
- **StatusChip** — MUI Chip que muestra "Activo" (verde) o "Inactivo" (gris)

#### API Client (`api.ts`)
- Cliente HTTP base con inyeccion automatica de JWT
- Interceptor 401: si el token expira, limpia localStorage y redirige a `/login`
- Fallback para errores no-JSON (ej: 502 HTML del proxy)

---

## Patrones y convenciones

### Naming
- **Entidades TypeORM:** PascalCase en ingles → tablas snake_case en espanol via `@Entity('tabla')` y `{ name: 'columna' }`
- **QueryBuilder:** Siempre usar nombres de propiedades de la entidad (camelCase ingles), NO nombres de columnas SQL
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`)

### Base de datos
- **Soft delete:** Campo `estado` con valores `'activo'` / `'inactivo'` (no se borran registros)
- **Timestamps:** `created_at` y `updated_at` con trigger `fn_actualizar_updated_at()` en todas las tablas (excepto `configuracion_negocio`)
- **SSL siempre activo** por requisito de Neon: `ssl: { rejectUnauthorized: false }`
- **synchronize: false** — Solo migraciones, nunca sync automatico
- **Entity/migration globs** con `path.join()` para compatibilidad TSX/produccion

### Backend
- Patron Controller → Service → Repository
- Todos los controllers usan `try-catch-next` para delegacion de errores
- Middleware de error centralizado en `error.middleware.ts`
- DTOs con validacion manual (funciones `validateXxxDto`)
- Paginacion validada: `page >= 1`, `limit entre 1 y 100`
- Enum query params validados contra listas permitidas

### Frontend
- React Context para estado global (no Redux)
- `useCallback` + `useEffect` para data fetching
- `useDebounce(300ms)` en todos los inputs de busqueda
- Loading states con `CircularProgress` en todas las paginas de listado
- try-catch en todas las funciones de fetch con `showSnackbar` para errores
- Rutas protegidas anidadas con `ProtectedRoute`

---

## Revision critica — 12 issues encontrados y corregidos

Despues de completar la implementacion, se realizo una revision critica exhaustiva con analisis de: calidad de codigo backend, calidad de codigo frontend, y compliance del schema. Se identificaron 12 issues reales:

### Bloque 1 — Bugs funcionales (HIGH) ✅

| # | Issue | Archivo | Fix aplicado |
|---|-------|---------|-------------|
| 1 | Update de producto no validaba subcategoria activa | `backend/src/services/product.service.ts` | Agregado check `sub.status === 'inactivo'` en funcion `update()` |
| 2 | Sin interceptor global para 401 | `frontend/src/services/api.ts` | Auto-logout + redirect a `/login` cuando respuesta es 401 |
| 3 | Fetch functions sin error handling | 4 paginas frontend | try-catch con `showSnackbar('Error al cargar...', 'error')` |
| 4 | Subcategoria inactiva desaparece del dropdown al editar | `frontend/src/pages/ProductsPage.tsx` | Incluye subcategoria actual del producto aunque este inactiva |

### Bloque 2 — Robustez (MEDIUM) ✅

| # | Issue | Archivo | Fix aplicado |
|---|-------|---------|-------------|
| 5 | Auth middleware usa `throw` en vez de `next(error)` | `backend/src/middlewares/auth.middleware.ts` | Reemplazado por `return next(Errors.xxx())` |
| 6 | Migration `down()` no limpia triggers ni funcion | `backend/src/migrations/...InitialSchema.ts` | Agregado DROP TRIGGER x5 + DROP FUNCTION |
| 7 | `response.json()` falla con errores no-JSON | `frontend/src/services/api.ts` | try-catch con mensaje fallback |
| 8 | Sin loading state en paginas de listado | 4 paginas frontend | Estado `loading` con `CircularProgress` |
| 9 | Seed data sin acentos correctos | `backend/src/config/seed.ts` | Corregido: Panaderia→Panaderia, Cafe→Cafe |

### Bloque 3 — Nice-to-have (LOW) ✅

| # | Issue | Archivo | Fix aplicado |
|---|-------|---------|-------------|
| 10 | Paginacion sin limites | 3 services backend | `Math.max(1, page)`, `Math.min(100, limit)` |
| 11 | Query params sin validacion de enum | 2 controllers backend | Validacion contra lista de valores permitidos |
| 12 | Sin debounce en busquedas | 3 paginas frontend | Hook `useDebounce(300ms)` aplicado |

---

## Endpoints de la API

| Metodo | Ruta | Auth | Rol | Descripcion |
|--------|------|------|-----|-------------|
| POST | `/api/auth/login` | No | - | Login, retorna JWT |
| GET | `/api/configuracion` | Si | any | Obtener config del negocio |
| PUT | `/api/configuracion` | Si | admin | Actualizar config |
| GET | `/api/categorias` | Si | any | Listar categorias |
| GET | `/api/categorias/:id` | Si | any | Detalle categoria + subcategorias |
| POST | `/api/categorias` | Si | admin | Crear categoria |
| PUT | `/api/categorias/:id` | Si | admin | Actualizar categoria |
| PATCH | `/api/categorias/:id/toggle` | Si | admin | Toggle estado (cascade) |
| GET | `/api/subcategorias` | Si | any | Listar subcategorias |
| POST | `/api/subcategorias` | Si | admin | Crear subcategoria |
| PUT | `/api/subcategorias/:id` | Si | admin | Actualizar subcategoria |
| PATCH | `/api/subcategorias/:id/toggle` | Si | admin | Toggle estado |
| GET | `/api/productos` | Si | any | Listar productos (paginado + filtros) |
| GET | `/api/productos/:id` | Si | any | Detalle producto |
| GET | `/api/productos/low-stock` | Si | admin | Productos bajo stock |
| POST | `/api/productos` | Si | admin | Crear producto |
| PUT | `/api/productos/:id` | Si | admin | Actualizar producto |
| PATCH | `/api/productos/:id/toggle` | Si | admin | Toggle estado |
| GET | `/api/inventario` | Si | admin | Vista de stock (paginada) |
| POST | `/api/inventario/adjust/:id` | Si | admin | Ajustar stock manualmente |
| GET | `/api/clientes` | Si | any | Listar clientes (paginado) |
| GET | `/api/clientes/:id` | Si | any | Detalle cliente |
| POST | `/api/clientes` | Si | admin | Crear cliente |
| PUT | `/api/clientes/:id` | Si | admin | Actualizar cliente |
| PATCH | `/api/clientes/:id/toggle` | Si | admin | Toggle estado |

---

## Rutas del frontend

| Ruta | Componente | Acceso |
|------|-----------|--------|
| `/login` | LoginPage | Publico |
| `/productos` | ProductsPage | Autenticado |
| `/categorias` | CategoriesPage | Autenticado |
| `/inventario` | InventoryPage | Admin only |
| `/clientes` | CustomersPage | Autenticado (visible si `usesCredit` activo) |
| `/configuracion` | ConfigPage | Admin only |
| `/reportes` | (Fase 2+) | Admin only (visible si `usesReports` activo) |

---

## Variables de entorno (backend/.env)

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require
JWT_SECRET=tu-secret-aqui
JWT_EXPIRES_IN=24h
ADMIN_EMAIL=admin@cafepos.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Administrador
```

## Variables de entorno (frontend/.env)

```env
VITE_API_URL=http://localhost:3000
```

---

## Como levantar el proyecto

### Prerequisitos
- Node.js 20.x (`nvm use 20.19.0`)
- PostgreSQL (Neon o local)

### Backend
```bash
cd backend
npm install
# Configurar .env con DATABASE_URL
npm run migration:run    # Crear tablas
npm run seed             # Seed datos iniciales
npm run dev              # Inicia en http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
npm run dev              # Inicia en http://localhost:5173
```

### Verificar
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cafepos.com","password":"admin123"}'

# Usar el token retornado en los demas endpoints
curl http://localhost:3000/api/productos \
  -H "Authorization: Bearer <token>"
```

---

## Historial de commits (Fase 1)

```
152ddf4  test: verify push access
b2285b4  chore: bootstrap monorepo with backend and frontend scaffolding
8be5027  feat(phase1): implement auth, products, inventory, categories, customers and config
e56feee  fix(phase1): address 12 bugs and improvements from critical review
```

---

## Estado actual

- **Fase 1: COMPLETADA** — Todos los modulos implementados y corregidos
- **TypeScript:** 0 errores en backend y frontend
- **Rama:** `dev` (push realizado a `origin/dev`)
- **Pendiente:** Fases 2+ (ventas/POS, creditos/fiado, control de caja, reportes, WhatsApp, tickets PDF)

---

## Esquema de la base de datos (6 tablas)

| Tabla | Columnas principales | Relaciones |
|-------|---------------------|------------|
| `usuarios` | id, nombre, email, password_hash, rol (admin/cashier), estado | - |
| `configuracion_negocio` | id, nombre_negocio, colores, moneda, impuesto, feature flags | Singleton (id=1) |
| `categorias` | id, nombre (unique), estado, orden | 1:N → subcategorias |
| `subcategorias` | id, categoria_id, nombre, estado, orden | N:1 → categorias, 1:N → productos |
| `productos` | id, codigo (unique), nombre, subcategoria_id, tipo, precio, stock, stock_minimo, estado | N:1 → subcategorias |
| `clientes` | id, nombre, telefono, telefono_alternativo, direccion, estado | - |

### Constraints adicionales
- 10 CHECK constraints (roles, estados, tipo producto, precio/stock >= 0)
- 13 indices (email, estado, tipo, categoria_id, subcategoria_id, created_at)
- 5 triggers `trg_*_updated_at` con funcion `fn_actualizar_updated_at()`
- 2 foreign keys con ON DELETE RESTRICT, ON UPDATE CASCADE
