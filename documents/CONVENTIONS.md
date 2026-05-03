# Convenciones Técnicas del Proyecto

> Guía obligatoria para todo el equipo de desarrollo.  
> Cualquier excepción debe discutirse y aprobarse antes de implementarse.  
> Versión 1.0 — Marzo 2026

---

## Tabla de Contenido

1. [Naming Conventions](#1-naming-conventions)
2. [Git Workflow](#2-git-workflow)
3. [Estructura de Código y Patrones](#3-estructura-de-código-y-patrones)
4. [Estilo de Código](#4-estilo-de-código)
5. [Convenciones de API REST](#5-convenciones-de-api-rest)
6. [Base de Datos](#6-base-de-datos)
7. [Variables de Entorno](#7-variables-de-entorno)
8. [Testing](#8-testing)

---

## 1. Naming Conventions

### 1.1 Idioma

Todo el código, nombres de variables, funciones, clases, comentarios en código y mensajes de commit se escriben en **inglés**. La documentación de negocio, issues y PRs pueden escribirse en español.

**Excepción:** los términos de dominio que no tienen traducción clara se mantienen en español como constantes de negocio. Ejemplos: `fiado`, `abono`. En estos casos se documenta el término en un glosario dentro del README.

```
// ✅ Correcto
const pendingBalance = credit.saldoPendiente;
function registerAbono(clientId: string, amount: number) {}

// ❌ Incorrecto
const saldoPendiente = credito.saldo;
function registrarAbono(clienteId: string, monto: number) {}
```

### 1.2 Archivos y Carpetas

| Contexto              | Convención                         | Ejemplo                                    |
| --------------------- | ---------------------------------- | ------------------------------------------ |
| Componentes React     | PascalCase                         | `ProductForm.tsx`, `SaleDetail.tsx`        |
| Pages / Vistas        | PascalCase                         | `InventoryPage.tsx`, `PosPage.tsx`         |
| Hooks                 | camelCase con prefijo `use`        | `useAuth.ts`, `useProducts.ts`             |
| Services (frontend)   | camelCase con sufijo `.service`    | `product.service.ts`, `sale.service.ts`    |
| Context               | PascalCase con sufijo `Context`    | `AuthContext.tsx`, `CartContext.tsx`       |
| Utils / Helpers       | camelCase                          | `formatCurrency.ts`, `dateHelpers.ts`      |
| Controllers (backend) | camelCase con sufijo `.controller` | `product.controller.ts`                    |
| Services (backend)    | camelCase con sufijo `.service`    | `sale.service.ts`, `credit.service.ts`     |
| Routes (backend)      | camelCase con sufijo `.routes`     | `product.routes.ts`                        |
| Middlewares (backend) | camelCase con sufijo `.middleware` | `auth.middleware.ts`, `role.middleware.ts` |
| Entities (TypeORM)    | PascalCase, singular               | `Product.ts`, `Sale.ts`, `SaleDetail.ts`   |
| Migrations (TypeORM)  | Timestamp automático de TypeORM    | `1711900000000-CreateProductTable.ts`      |
| Tests                 | Mismo nombre del archivo + `.test` | `product.service.test.ts`                  |
| Carpetas              | kebab-case                         | `sale-detail/`, `stock-alert/`             |

### 1.3 Variables y Funciones

| Contexto             | Convención                           | Ejemplo                               |
| -------------------- | ------------------------------------ | ------------------------------------- |
| Variables locales    | camelCase                            | `totalAmount`, `isActive`             |
| Constantes           | UPPER_SNAKE_CASE                     | `MAX_STOCK_ALERT`, `DEFAULT_TAX_RATE` |
| Funciones            | camelCase, verbo + sustantivo        | `getProducts()`, `calculateTotal()`   |
| Booleanos            | prefijo `is`, `has`, `can`, `should` | `isActive`, `hasDebt`, `canSell`      |
| Arrays               | plural                               | `products`, `saleDetails`, `credits`  |
| Handlers de eventos  | prefijo `handle`                     | `handleSubmit`, `handleAddToCart`     |
| Callbacks como props | prefijo `on`                         | `onConfirm`, `onCancel`, `onChange`   |

### 1.4 Interfaces y Types (TypeScript)

```typescript
// Interfaces: prefijo "I" NO se usa. Nombre descriptivo en PascalCase.
interface Product {
  id: number;
  name: string;
  price: number;
  isActive: boolean;
}

// Types para unions o utilitarios
type PaymentMethod = 'cash' | 'card' | 'transfer';
type SaleStatus = 'paid' | 'pending';

// Props de componentes: sufijo "Props"
interface ProductFormProps {
  product?: Product;
  onSubmit: (data: Product) => void;
}

// DTOs del backend: sufijo "Dto"
interface CreateProductDto {
  name: string;
  code: string;
  category: string;
  price: number;
  stock: number;
}

// Respuestas de API: sufijo "Response"
interface ProductListResponse {
  data: Product[];
  total: number;
}
```

### 1.5 Enums

```typescript
// PascalCase para el enum, PascalCase para los valores
enum UserRole {
  Admin = 'admin',
  Cashier = 'cashier',
}

enum ProductType {
  Inventory = 'inventory',
  Food = 'food',
}

enum SaleStatus {
  Paid = 'paid',
  Pending = 'pending',
}

enum CashRegisterStatus {
  Open = 'open',
  Closed = 'closed',
}
```

### 1.6 Base de Datos (PostgreSQL + TypeORM)

| Elemento           | Convención                    | Ejemplo                                            |
| ------------------ | ----------------------------- | -------------------------------------------------- |
| Tablas             | snake_case, plural            | `productos`, `detalle_ventas`, `usuarios`          |
| Columnas           | snake_case                    | `stock_minimo`, `precio_unitario`, `created_at`    |
| Primary keys       | `id` (autoincremental o UUID) | `id`                                               |
| Foreign keys       | `<tabla_singular>_id`         | `producto_id`, `cajero_id`, `venta_id`             |
| Índices            | `idx_<tabla>_<columna(s)>`    | `idx_productos_categoria`, `idx_ventas_created_at` |
| Constraints unique | `uq_<tabla>_<columna>`        | `uq_productos_codigo`                              |
| Timestamps         | `created_at`, `updated_at`    | Siempre presentes en todas las tablas              |

**Nota importante:** Las tablas y columnas se nombran en **español** para mantener coherencia con el dominio de negocio (cafetería colombiana). Las entidades TypeORM mapean estos nombres:

```typescript
@Entity('productos')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nombre' })
  name: string;

  @Column({ name: 'stock_minimo' })
  minStock: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

---

## 2. Git Workflow

### 2.1 Estrategia de Branches

Se usa **GitHub Flow simplificado** con una rama principal y ramas de feature:

```
main                    ← Producción (deploy automático a Vercel + Railway)
 ├── dev                ← Integración / staging (deploy a Neon branch dev)
 │    ├── feat/auth-login
 │    ├── feat/pos-cart
 │    ├── fix/stock-deduction
 │    └── refactor/sale-service
 └── hotfix/critical-bug  ← Solo para emergencias en producción
```

| Tipo de rama | Prefijo     | Base   | Se mergea a    | Ejemplo                 |
| ------------ | ----------- | ------ | -------------- | ----------------------- |
| Feature      | `feat/`     | `dev`  | `dev`          | `feat/product-crud`     |
| Bugfix       | `fix/`      | `dev`  | `dev`          | `fix/stock-validation`  |
| Refactor     | `refactor/` | `dev`  | `dev`          | `refactor/sale-service` |
| Hotfix       | `hotfix/`   | `main` | `main` + `dev` | `hotfix/jwt-expiry`     |

### 2.2 Convención de Nombres de Branch

```
<tipo>/<módulo>-<descripción-corta>

feat/auth-jwt-login
feat/pos-add-to-cart
fix/inventory-stock-deduction
refactor/credit-abono-service
```

### 2.3 Conventional Commits

Todos los mensajes de commit siguen el formato de [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<alcance>): <descripción en imperativo>

feat(products): add product CRUD endpoints
fix(inventory): correct stock deduction on sale
refactor(pos): extract cart logic to custom hook
docs(readme): add setup instructions
style(frontend): fix eslint warnings in ProductForm
test(sales): add integration tests for credit flow
chore(deps): update TypeORM to 0.3.20
```

| Tipo       | Uso                                            |
| ---------- | ---------------------------------------------- |
| `feat`     | Nueva funcionalidad                            |
| `fix`      | Corrección de bug                              |
| `refactor` | Cambio de código sin cambio funcional          |
| `docs`     | Documentación                                  |
| `style`    | Formato, linting (sin cambio de lógica)        |
| `test`     | Agregar o corregir tests                       |
| `chore`    | Tareas de mantenimiento, dependencias, configs |
| `perf`     | Mejora de rendimiento                          |

**Alcance (scope):** usar el nombre del módulo en minúscula: `auth`, `products`, `inventory`, `pos`, `tickets`, `cash-register`, `credits`, `reports`.

### 2.4 Pull Requests

**Título:** mismo formato que un commit → `feat(products): add product CRUD endpoints`

**Descripción mínima del PR:**

```markdown
## Qué hace este PR

Breve descripción de los cambios.

## Módulo afectado

Productos / Inventario / POS / etc.

## Cómo probar

1. Paso para reproducir o verificar.
2. Endpoint o vista a revisar.

## Checklist

- [ ] El código compila sin errores (`npm run build`)
- [ ] Linting pasa sin warnings (`npm run lint`)
- [ ] Se agregaron/actualizaron tests si aplica
- [ ] La migración de DB está incluida si hay cambios en entidades
- [ ] Se actualizó la documentación si aplica
```

### 2.5 Reglas de Merge

- **Nunca** se hace push directo a `main`.
- Todo cambio a `main` pasa por PR desde `dev`.
- Todo cambio a `dev` pasa por PR desde rama de feature.
- Squash merge para features → mantiene el historial limpio en `dev`.
- Merge commit de `dev` a `main` → preserva la trazabilidad del release.
- Eliminar la rama de feature después del merge.

### 2.6 Versionado

Se usa **Semantic Versioning** (SemVer) con tags en `main`:

```
v1.0.0  → Primer release (MVP completo)
v1.1.0  → Nueva feature (ej: reportes mensuales)
v1.1.1  → Bugfix
v2.0.0  → Cambio breaking (ej: multi-tenant)
```

---

## 3. Estructura de Código y Patrones

### 3.1 Arquitectura por Capas (Backend)

Cada request sigue un flujo unidireccional estricto:

```
Request → Route → Middleware → Controller → Service → Entity/DB
                                                ↓
Response ← Controller ← Service (resultado o error)
```

| Capa            | Responsabilidad                                            | NO debe hacer                            |
| --------------- | ---------------------------------------------------------- | ---------------------------------------- |
| **Routes**      | Definir endpoint, método HTTP y middlewares                | Lógica de negocio                        |
| **Middlewares** | Auth, validación de roles, validación de body              | Queries a DB                             |
| **Controllers** | Recibir request, llamar al service, devolver response      | Lógica de negocio, queries directas a DB |
| **Services**    | Toda la lógica de negocio, transacciones                   | Acceder a `req` o `res` de Express       |
| **Entities**    | Definición del modelo, relaciones, validaciones de columna | Lógica de negocio                        |

```typescript
// ✅ Correcto: controller delega al service
export class SaleController {
  async create(req: Request, res: Response) {
    const result = await saleService.registerSale(req.body, req.user.id);
    res.status(201).json(result);
  }
}

// ❌ Incorrecto: controller con lógica de negocio
export class SaleController {
  async create(req: Request, res: Response) {
    const product = await productRepo.findOne(req.body.productId);
    if (product.stock < req.body.quantity) { ... } // Esto va en el service
  }
}
```

### 3.2 Estructura de un Módulo Backend

Cada módulo del sistema sigue la misma estructura de archivos:

```
backend/src/
├── controllers/
│   └── product.controller.ts      // Recibe HTTP, delega a service
├── services/
│   └── product.service.ts         // Lógica de negocio
├── routes/
│   └── product.routes.ts          // Define endpoints y middlewares
├── entities/
│   └── Product.ts                 // Entidad TypeORM
├── dtos/
│   ├── create-product.dto.ts      // Validación de entrada
│   └── update-product.dto.ts
└── middlewares/
    └── validate-product.middleware.ts  // Validación específica (si aplica)
```

### 3.3 Manejo de Errores (Backend)

Todas las respuestas de error siguen un formato estándar:

```typescript
// Formato de error estándar
interface ApiError {
  status: number;
  message: string;
  code: string;        // Código interno para el frontend
  details?: unknown;   // Detalles adicionales (validación, etc.)
}

// Ejemplo de respuesta de error
{
  "status": 422,
  "message": "Insufficient stock for product 'Café con leche'. Available: 3, requested: 5.",
  "code": "INSUFFICIENT_STOCK",
  "details": {
    "productId": 12,
    "available": 3,
    "requested": 5
  }
}
```

**Códigos de error internos del sistema:**

| Código                 | Significado                                |
| ---------------------- | ------------------------------------------ |
| `INSUFFICIENT_STOCK`   | Stock insuficiente para completar la venta |
| `INACTIVE_PRODUCT`     | El producto está inactivo                  |
| `CASH_REGISTER_CLOSED` | No hay caja abierta                        |
| `INVALID_CREDENTIALS`  | Login fallido                              |
| `UNAUTHORIZED`         | Token inválido o expirado                  |
| `FORBIDDEN`            | Rol sin permisos para esta acción          |
| `DUPLICATE_ENTRY`      | Ya existe un registro con ese código/email |
| `NOT_FOUND`            | Recurso no encontrado                      |
| `VALIDATION_ERROR`     | Error de validación del body               |

**Middleware global de errores:**

```typescript
// Toda excepción no capturada pasa por este middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      status: err.status,
      message: err.message,
      code: err.code,
      details: err.details,
    });
  }

  // Error no controlado → log + respuesta genérica
  console.error('Unhandled error:', err);
  return res.status(500).json({
    status: 500,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
});
```

### 3.4 Transacciones (Backend)

Las operaciones que modifican múltiples tablas usan `QueryRunner` de TypeORM:

```typescript
// ✅ Transacción atómica para registro de venta
async registerSale(data: CreateSaleDto, cashierId: number): Promise<Sale> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const sale = await queryRunner.manager.save(Sale, { ... });

    for (const item of data.items) {
      await queryRunner.manager.save(SaleDetail, { ... });

      if (item.productType === ProductType.Inventory) {
        await queryRunner.manager.decrement(Product, { id: item.productId }, 'stock', item.quantity);
      }
    }

    await queryRunner.commitTransaction();

    // Post-commit: alertas de stock (NO dentro de la transacción)
    await this.checkStockAlerts(data.items);

    return sale;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

### 3.5 Estructura de un Componente React (Frontend)

```
frontend/src/
├── components/
│   ├── ui/                       // Componentes genéricos reutilizables
│   │   ├── ConfirmDialog.tsx
│   │   ├── DataTable.tsx
│   │   └── LoadingSpinner.tsx
│   ├── product/                  // Componentes del módulo Producto
│   │   ├── ProductForm.tsx
│   │   ├── ProductList.tsx
│   │   └── ProductCard.tsx
│   └── pos/                      // Componentes del módulo POS
│       ├── CartItem.tsx
│       ├── CartSummary.tsx
│       └── PaymentDialog.tsx
├── pages/
│   ├── ProductsPage.tsx          // Vista completa del módulo
│   ├── PosPage.tsx
│   └── CreditsPage.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useProducts.ts
│   └── useCart.ts
├── services/
│   ├── api.ts                    // Instancia base de fetch/axios
│   ├── product.service.ts
│   └── sale.service.ts
├── context/
│   ├── AuthContext.tsx
│   └── CartContext.tsx
├── types/
│   ├── product.types.ts          // Interfaces compartidas del módulo
│   ├── sale.types.ts
│   └── api.types.ts              // Tipos genéricos de respuesta API
└── utils/
    ├── formatCurrency.ts
    └── dateHelpers.ts
```

### 3.6 Patrones de Componentes React

**Componentes funcionales siempre.** No se usan class components.

```typescript
// ✅ Componente con tipado de props
interface ProductCardProps {
  product: Product;
  onEdit: (id: number) => void;
  onToggleStatus: (id: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onToggleStatus }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{product.name}</Typography>
        <Typography color="text.secondary">{formatCurrency(product.price)}</Typography>
      </CardContent>
      <CardActions>
        <Button onClick={() => onEdit(product.id)}>Editar</Button>
        <Button onClick={() => onToggleStatus(product.id)}>
          {product.isActive ? 'Desactivar' : 'Activar'}
        </Button>
      </CardActions>
    </Card>
  );
};
```

**Custom hooks para lógica reutilizable:**

```typescript
// hooks/useProducts.ts
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      setError('Error loading products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}
```

### 3.7 Service Layer (Frontend)

Todas las llamadas a la API se centralizan en archivos `.service.ts`. Los componentes y hooks nunca llaman a `fetch` o `axios` directamente.

```typescript
// services/api.ts — Instancia base
const API_URL = import.meta.env.VITE_API_URL;

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error.message, error.code, error.status);
  }

  return response.json();
}

export const api = { get: request, post: ..., put: ..., patch: ..., delete: ... };

// services/product.service.ts
export const productService = {
  getAll: () => api.get<Product[]>('/api/productos'),
  getById: (id: number) => api.get<Product>(`/api/productos/${id}`),
  create: (data: CreateProductDto) => api.post<Product>('/api/productos', data),
  update: (id: number, data: UpdateProductDto) => api.put<Product>(`/api/productos/${id}`, data),
  toggleStatus: (id: number) => api.patch<Product>(`/api/productos/${id}/estado`),
};
```

---

## 4. Estilo de Código

### 4.1 TypeScript Estricto

El proyecto usa TypeScript en modo estricto tanto en frontend como en backend.

```jsonc
// tsconfig.json (base compartida)
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
  },
}
```

**Reglas de TypeScript:**

- **Nunca usar `any`.** Usar `unknown` si el tipo es desconocido y hacer type narrowing.
- **No usar `@ts-ignore`** sin un comentario que explique por qué.
- **Tipar todas las funciones:** parámetros y retorno explícito en funciones públicas.
- **No usar `!` (non-null assertion)** excepto en casos justificados con comentario.

```typescript
// ✅ Correcto
function calculateTotal(items: SaleDetail[]): number {
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}

// ❌ Incorrecto
function calculateTotal(items: any) {
  return items.reduce((sum: any, item: any) => sum + item.subtotal, 0);
}
```

### 4.2 ESLint

Configuración base para ambos proyectos (frontend y backend):

```jsonc
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": [
      "warn",
      {
        "allowExpressions": true,
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
      },
    ],
    "no-console": ["warn", { "allow": ["error", "warn"] }],
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"],
  },
}
```

**Frontend adicional:**

```jsonc
{
  "extends": ["plugin:react/recommended", "plugin:react-hooks/recommended"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
}
```

### 4.3 Prettier

Configuración unificada para todo el monorepo:

```jsonc
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
}
```

### 4.4 Imports

Los imports se organizan en bloques separados por una línea en blanco, en este orden:

```typescript
// 1. Dependencias externas (node_modules)
import express from 'express';
import { DataSource } from 'typeorm';

// 2. Módulos internos absolutos (alias @/)
import { Product } from '@/entities/Product';
import { authMiddleware } from '@/middlewares/auth.middleware';

// 3. Módulos relativos
import { CreateProductDto } from '../dtos/create-product.dto';
import { validateStock } from './helpers';
```

**Alias de paths:**

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
    },
  },
}
```

### 4.5 Comentarios

- **No comentar código obvio.** El código debe ser autoexplicativo por nombres descriptivos.
- **Sí comentar el "por qué",** no el "qué".
- **JSDoc solo en funciones públicas de services y utils**, no en cada función.
- **TODO/FIXME** se permiten con formato: `// TODO(nombre): descripción — issue #123`

```typescript
// ✅ Correcto: explica una decisión no obvia
// Stock check runs outside the transaction to avoid long locks on high-traffic products
await this.checkStockAlerts(data.items);

// ❌ Incorrecto: comenta lo obvio
// Get the product by id
const product = await productRepo.findOne(id);
```

### 4.6 Scripts del Proyecto

Ambos proyectos (frontend y backend) deben tener estos scripts en su `package.json`:

```jsonc
{
  "scripts": {
    "dev": "...", // Servidor de desarrollo
    "build": "...", // Build de producción
    "start": "...", // Iniciar en producción
    "lint": "eslint src/", // Verificar linting
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/",
    "format:check": "prettier --check src/",
    "typecheck": "tsc --noEmit",
  },
}
```

**Antes de cada commit, verificar:**

```bash
npm run lint
npm run typecheck
npm run build
```

Se recomienda configurar **lint-staged + husky** para automatizarlo:

```jsonc
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  },
}
```

---

## 5. Convenciones de API REST

### 5.1 Formato de URLs

```
/api/<recurso>                  → Colección
/api/<recurso>/:id              → Elemento individual
/api/<recurso>/:id/<sub-recurso> → Recurso anidado
/api/<recurso>/:id/<acción>     → Acción sobre recurso
```

- URLs en **español** (coherencia con el dominio): `/api/productos`, `/api/ventas`, `/api/creditos`.
- Siempre en **plural**: `/api/productos`, no `/api/producto`.
- Verbos HTTP determinan la acción, no la URL: `POST /api/ventas` (no `POST /api/crear-venta`).

### 5.2 Métodos HTTP

| Método   | Uso                            | Ejemplo                           |
| -------- | ------------------------------ | --------------------------------- |
| `GET`    | Leer recurso(s)                | `GET /api/productos`              |
| `POST`   | Crear recurso                  | `POST /api/productos`             |
| `PUT`    | Reemplazar recurso completo    | `PUT /api/productos/:id`          |
| `PATCH`  | Actualización parcial          | `PATCH /api/productos/:id/estado` |
| `DELETE` | Eliminar recurso (soft delete) | `DELETE /api/productos/:id`       |

### 5.3 Códigos de Respuesta HTTP

| Código | Uso en el sistema                                                                    |
| ------ | ------------------------------------------------------------------------------------ |
| `200`  | GET exitoso, PATCH exitoso                                                           |
| `201`  | POST exitoso (recurso creado)                                                        |
| `204`  | DELETE exitoso (sin body)                                                            |
| `400`  | Bad request (body mal formado)                                                       |
| `401`  | No autenticado (JWT faltante o inválido)                                             |
| `403`  | Sin permisos (rol insuficiente)                                                      |
| `404`  | Recurso no encontrado                                                                |
| `409`  | Conflicto (duplicado)                                                                |
| `422`  | Error de validación de negocio (stock insuficiente, caja cerrada, producto inactivo) |
| `500`  | Error interno del servidor                                                           |

### 5.4 Formato de Respuestas

**Éxito con datos:**

```jsonc
// GET /api/productos
{
  "data": [
    { "id": 1, "name": "Café con leche", "price": 5000, ... }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20
  }
}

// POST /api/ventas
{
  "data": {
    "id": 123,
    "total": 15000,
    "status": "paid",
    ...
  }
}
```

**Éxito sin datos:**

```jsonc
// DELETE → 204 sin body
```

**Error:**

```jsonc
{
  "status": 422,
  "message": "Insufficient stock for 'Café con leche'",
  "code": "INSUFFICIENT_STOCK",
  "details": { ... }
}
```

### 5.5 Paginación

Se usa paginación basada en offset para listados:

```
GET /api/productos?page=1&limit=20&sort=name&order=asc
```

| Parámetro | Default      | Descripción                          |
| --------- | ------------ | ------------------------------------ |
| `page`    | `1`          | Número de página                     |
| `limit`   | `20`         | Elementos por página (máximo 100)    |
| `sort`    | `created_at` | Campo por el que ordenar             |
| `order`   | `desc`       | Dirección del orden (`asc` / `desc`) |

### 5.6 Filtros

Los filtros van como query params con el nombre del campo:

```
GET /api/productos?category=coffee&isActive=true
GET /api/ventas?status=pending&from=2026-03-01&to=2026-03-31
GET /api/creditos/:clienteId?from=2026-03-01&to=2026-03-31
```

---

## 6. Base de Datos

### 6.1 Migraciones

- **Nunca** modificar la base de datos manualmente. Todo cambio pasa por migraciones de TypeORM.
- Cada cambio en una entidad genera una migración: `npm run typeorm migration:generate -- -n DescriptiveName`.
- Las migraciones son **inmutables** una vez se ejecutan en `dev` o `main`. Si hay un error, se crea una nueva migración correctiva.
- El nombre de la migración describe el cambio: `AddMinStockToProductos`, `CreateCreditTable`.

### 6.2 Reglas de Esquema

- Todas las tablas tienen `id` como primary key (autoincremental integer).
- Todas las tablas tienen `created_at` (timestamp, default `now()`).
- Tablas que se actualizan frecuentemente también llevan `updated_at`.
- **No se eliminan registros.** Se usa soft delete con columna `estado` o `is_active`.
- Los campos monetarios usan tipo `DECIMAL(12,2)`, nunca `FLOAT`.
- Los enums se almacenan como `VARCHAR` con valores cortos (`'paid'`, `'pending'`, `'open'`, `'closed'`).

### 6.3 Entornos de Base de Datos

| Entorno          | Branch Neon | Uso                                      |
| ---------------- | ----------- | ---------------------------------------- |
| Desarrollo local | `dev`       | Desarrollo diario, migraciones de prueba |
| Producción       | `main`      | Datos reales del negocio                 |

Las migraciones se ejecutan automáticamente al iniciar el backend (`synchronize: false`, migraciones manuales).

---

## 7. Variables de Entorno

### 7.1 Naming

Todas las variables de entorno usan `UPPER_SNAKE_CASE` con prefijo del contexto:

```bash
# Base de datos
DATABASE_URL=postgresql://user:pass@host:5432/db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Servidor
PORT=3000
NODE_ENV=development

# Frontend (Vite usa prefijo VITE_)
VITE_API_URL=http://localhost:3000
```

### 7.2 Reglas

- **Nunca** commitear archivos `.env`. El `.gitignore` debe incluirlos.
- Mantener un archivo `.env.example` con todas las variables (sin valores reales).
- En Railway y Vercel, las variables se configuran por interfaz.
- Las variables sensibles (`JWT_SECRET`, `DATABASE_URL`) nunca se logean ni se incluyen en respuestas de error.

---

## 8. Testing

### 8.1 Estrategia

| Tipo                           | Prioridad       | Alcance                                                                                 |
| ------------------------------ | --------------- | --------------------------------------------------------------------------------------- |
| **Integration tests (API)**    | Alta            | Flujos críticos: venta con descuento de stock, crédito + abono, apertura/cierre de caja |
| **Unit tests (Services)**      | Media           | Lógica de negocio aislada: cálculo de totales, validación de stock, permisos            |
| **Component tests (Frontend)** | Media           | Formularios críticos: ProductForm, CartSummary, PaymentDialog                           |
| **E2E**                        | Baja (post-MVP) | Flujo completo de venta de punta a punta                                                |

### 8.2 Naming de Tests

```typescript
describe('SaleService', () => {
  describe('registerSale', () => {
    it('should deduct stock when selling inventory products', async () => { ... });
    it('should NOT deduct stock when selling food products', async () => { ... });
    it('should throw INSUFFICIENT_STOCK when stock is not enough', async () => { ... });
    it('should throw CASH_REGISTER_CLOSED when no open register exists', async () => { ... });
    it('should create credit record when sale status is pending', async () => { ... });
  });
});
```

**Patrón de nombre:** `should <resultado esperado> when <condición>`.

### 8.3 Herramientas

| Herramienta           | Uso                                             |
| --------------------- | ----------------------------------------------- |
| Jest                  | Test runner para backend                        |
| Supertest             | Tests de integración HTTP                       |
| React Testing Library | Tests de componentes frontend                   |
| Vitest                | Test runner para frontend (compatible con Vite) |

---

## Apéndice: Glosario de Dominio

Términos del negocio usados en el código que se mantienen en español:

| Término en español | Variable en código  | Significado                        |
| ------------------ | ------------------- | ---------------------------------- |
| Fiado              | `credit`            | Venta a crédito sin pago inmediato |
| Abono              | `payment` / `abono` | Pago parcial de una deuda          |
| Caja               | `cashRegister`      | Apertura/cierre de caja del día    |
| Cajero             | `cashier`           | Rol con permisos limitados         |
| Venta              | `sale`              | Transacción de venta               |
| Detalle de venta   | `saleDetail`        | Línea individual de una venta      |
| Stock mínimo       | `minStock`          | Umbral para alerta de reposición   |
| Forma de pago      | `paymentMethod`     | Efectivo, tarjeta, transferencia   |

---

_Este documento se actualiza conforme evoluciona el proyecto. Toda modificación requiere PR con revisión._
