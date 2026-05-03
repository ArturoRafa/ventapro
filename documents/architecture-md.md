# Arquitectura del Sistema — Cafetería

> Documento técnico de referencia para el equipo de desarrollo.  
> Versión 1.0 — Marzo 2026

---

## 1. Visión General

Sistema web para gestión de inventario, ventas, caja y créditos de una cafetería. Arquitectura de tres capas desacopladas: frontend estático, API REST y base de datos relacional, desplegadas en servicios cloud especializados.

```
Usuario (Cajero / Admin)
        │
        ▼
  React SPA (Vercel)
        │ HTTPS / JWT
        ▼
  Node.js REST API (Railway)
        │
        ▼
  PostgreSQL (Neon)
```

---

## 2. Stack Tecnológico

| Capa           | Tecnología                     | Versión recomendada |
| -------------- | ------------------------------ | ------------------- |
| Frontend       | React + TypeScript             | React 18+           |
| Estilos        | Material UI (MUI)              | v5+                 |
| Backend        | Node.js + Express + TypeScript | Node 20 LTS         |
| ORM            | TypeORM                        | v0.3+               |
| Base de datos  | PostgreSQL                     | v15+                |
| Autenticación  | JWT (jsonwebtoken)             | —                   |
| Generación PDF | pdf-lib                        | v1.17+              |

---

## 3. Infraestructura Cloud

| Servicio                   | Proveedor | Plan             | Costo/mes         |
| -------------------------- | --------- | ---------------- | ----------------- |
| Frontend (React)           | Vercel    | Hobby (gratuito) | $0                |
| Backend (Node.js API)      | Railway   | Starter          | ~$5 USD           |
| Base de datos (PostgreSQL) | Neon      | Free (0.5 GB)    | $0                |
| Dominio                    | Namecheap | .com anual       | ~$1 USD           |
| **Total**                  |           |                  | **~$6–7 USD/mes** |

### 3.1 Justificación por servicio

**Vercel — Frontend**  
React produce una aplicación estática tras el build. Vercel sirve estos archivos desde un CDN global con SSL automático, sin cold starts y con deploys automáticos desde Git. No requiere servidor de aplicaciones.

**Railway — Backend**  
Simplicidad operativa equivalente a Heroku pero sin sleep en dynos. Deploy desde Git, variables de entorno por interfaz, logs persistentes y escalado sin migración.

**Neon — PostgreSQL**  
PostgreSQL serverless 100% compatible con TypeORM. Sin límite de filas (límite por almacenamiento: 0.5 GB free). Soporta branching de base de datos para separar entornos de desarrollo y producción.

---

## 4. Módulos del Sistema

| #   | Módulo               | Descripción                                    |
| --- | -------------------- | ---------------------------------------------- |
| 1   | Autenticación        | Login, JWT, roles Admin/Cajero                 |
| 2   | Productos            | CRUD, categorías, estado activo/inactivo       |
| 3   | Inventario           | Stock, alertas de mínimo, ajustes manuales     |
| 4   | Punto de Venta (POS) | Venta con y sin inventario, formas de pago     |
| 5   | Tickets              | Generación PDF por venta                       |
| 6   | Control de Caja      | Apertura, cierre, movimientos, reportes        |
| 7   | Créditos y Abonos    | Ventas pendientes, abonos parciales, historial |
| 8   | Comidas              | Venta sin descuento de inventario              |

---

## 5. Estructura de Carpetas

```
/
├── frontend/                  # React + TypeScript
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── pages/             # Vistas por módulo
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # Llamadas a la API (fetch/axios)
│   │   ├── context/           # AuthContext, RoleContext
│   │   └── utils/             # Helpers, formatters
│   └── public/
│
└── backend/                   # Node.js + Express + TypeScript
    ├── src/
    │   ├── controllers/       # Lógica por módulo
    │   ├── routes/            # Definición de endpoints
    │   ├── middlewares/       # Auth, roles, manejo de errores
    │   ├── entities/          # Entidades TypeORM (modelos DB)
    │   ├── services/          # Lógica de negocio
    │   │   └── ticket/        # Generación de PDF
    │   ├── migrations/        # Migraciones de base de datos
    │   └── config/            # DB, JWT, variables de entorno
    └── tests/
```

---

## 6. Modelo de Datos (Entidades Principales)

```
usuario          producto         venta
────────         ────────         ────────
id               id               id
nombre           nombre           caja_id
email            codigo           cliente_id
password_hash    categoria        cajero_id
rol              tipo             total
created_at       precio           forma_pago
                 stock            estado (pagado | pendiente)
                 stock_minimo     created_at
                 estado

detalle_venta    caja             credito
─────────────    ────────         ────────
id               id               id
venta_id         cajero_id        cliente_id
producto_id      monto_inicial    venta_id
cantidad         monto_cierre     monto_total
precio_unitario  estado           saldo_pendiente
subtotal         fecha_apertura   created_at
                 fecha_cierre
                                  abono
                                  ────────
                                  id
                                  cliente_id
                                  monto
                                  fecha
```

---

## 7. API REST — Endpoints Principales

### Autenticación

| Método | Endpoint           | Descripción              | Rol     |
| ------ | ------------------ | ------------------------ | ------- |
| POST   | `/api/auth/login`  | Login y obtención de JWT | Público |
| POST   | `/api/auth/logout` | Invalidar sesión         | Todos   |

### Caja

| Método | Endpoint                | Descripción        | Rol            |
| ------ | ----------------------- | ------------------ | -------------- |
| POST   | `/api/caja/apertura`    | Abrir caja del día | Cajero / Admin |
| POST   | `/api/caja/cierre`      | Cerrar caja        | Cajero / Admin |
| GET    | `/api/caja/:id/reporte` | Reporte de caja    | Admin          |

### Ventas

| Método | Endpoint                 | Descripción                        | Rol            |
| ------ | ------------------------ | ---------------------------------- | -------------- |
| POST   | `/api/ventas`            | Registrar venta (pagada o crédito) | Cajero / Admin |
| GET    | `/api/ventas`            | Historial de ventas                | Admin          |
| GET    | `/api/ventas/:id/ticket` | Regenerar ticket PDF               | Cajero / Admin |

### Productos e Inventario

| Método | Endpoint                    | Descripción              | Rol   |
| ------ | --------------------------- | ------------------------ | ----- |
| GET    | `/api/productos`            | Listar productos activos | Todos |
| POST   | `/api/productos`            | Crear producto           | Admin |
| PUT    | `/api/productos/:id`        | Editar producto          | Admin |
| PATCH  | `/api/productos/:id/estado` | Activar / desactivar     | Admin |
| GET    | `/api/inventario`           | Ver stock actual         | Admin |
| PATCH  | `/api/inventario/:id`       | Ajuste manual de stock   | Admin |

### Créditos

| Método | Endpoint                          | Descripción                | Rol            |
| ------ | --------------------------------- | -------------------------- | -------------- |
| GET    | `/api/creditos/:cliente_id`       | Deuda y abonos del cliente | Cajero / Admin |
| POST   | `/api/creditos/:cliente_id/abono` | Registrar abono            | Cajero / Admin |

---

## 8. Seguridad

| Aspecto             | Implementación                                            |
| ------------------- | --------------------------------------------------------- |
| Autenticación       | JWT firmado con secret en variable de entorno             |
| Autorización        | Middleware de rol por ruta (`requireRole(['admin'])`)     |
| Contraseñas         | Hash con bcrypt (salt rounds: 12)                         |
| Transporte          | HTTPS en todos los servicios (SSL automático)             |
| Variables sensibles | `.env` local, variables de entorno en Railway/Vercel      |
| Stock visible       | Solo Admin — el cajero no recibe ese dato en la respuesta |

---

## 9. Reglas de Negocio Críticas

1. **Caja abierta como precondición** — Ninguna venta puede registrarse si no existe una caja en estado `abierta` para el día.
2. **Producto activo obligatorio** — Si algún producto del carrito tiene `estado='inactivo'`, la venta se rechaza con `422` antes de iniciar transacción.
3. **Verificación de stock antes del commit** — Solo para productos tipo `inventario`. Productos tipo `comida` omiten esta validación.
4. **Transacciones atómicas** — Venta, detalle, descuento de stock y movimiento de caja ocurren en una sola transacción. Si falla cualquier paso se hace `ROLLBACK` completo.
5. **Crédito no bloquea nuevas compras** — Un cliente con deuda pendiente puede seguir comprando.
6. **Alerta de stock mínimo post-venta** — Después del `COMMIT`, el API evalúa si algún producto quedó por debajo de su `stock_minimo` y notifica al administrador.
7. **Ticket independiente de la venta** — Si el Ticket Service falla, la venta no se revierte. El ticket puede regenerarse en cualquier momento desde `GET /api/ventas/:id/ticket`.

---

## 10. Flujos Principales

Referirse al **Diagrama de Secuencia** para el detalle de cada flujo:

- Autenticación y control de roles
- Apertura de caja
- Venta pagada con inventario (happy path)
- Venta de comida sin inventario
- Venta a crédito
- Abono a crédito
- Fallo por base de datos caída
- Fallo por error en Ticket Service

---

## 11. Entornos

| Entorno    | Frontend                  | Backend          | Base de datos      |
| ---------- | ------------------------- | ---------------- | ------------------ |
| Desarrollo | `localhost:5173`          | `localhost:3000` | Neon branch `dev`  |
| Producción | `Vercel` (dominio propio) | `Railway`        | Neon branch `main` |

---

## 12. CI/CD

| Paso            | Herramienta            | Trigger        |
| --------------- | ---------------------- | -------------- |
| Deploy frontend | Vercel (automático)    | Push a `main`  |
| Deploy backend  | Railway (automático)   | Push a `main`  |
| Migraciones DB  | TypeORM CLI en startup | Deploy backend |

---

## 13. Plan de Trabajo por Fases

El sistema está diseñado en módulos desacoplados. El módulo de **Inventario es funcional de forma independiente** sin requerir el módulo de Caja. Esto permite entregar valor incremental y habilitar cada módulo cuando el negocio lo necesite.

### Dependencias entre módulos

```
[Auth + Roles]          ← Base de todo
      │
      ├── [Productos]   ← Independiente
      │       │
      │       └── [Inventario]   ← Funciona sin Caja
      │
      └── [Caja / POS]  ← Depende de Productos e Inventario
              │
              ├── [Tickets PDF]
              ├── [Créditos y Abonos]
              └── [Comidas]
```

### Fase 1 — Core independiente de inventario

> Entregable: sistema de inventario 100% operativo sin módulo de caja.

| Tarea              | Descripción                                                  |
| ------------------ | ------------------------------------------------------------ |
| Setup del proyecto | Monorepo, TypeScript, ESLint, variables de entorno           |
| Auth + Roles       | Login, JWT, middleware de roles Admin/Cajero                 |
| Módulo Productos   | CRUD, categorías, tipos (inventario / comida), estado activo |
| Módulo Inventario  | Stock, ajustes manuales, alertas de stock mínimo             |
| UI Inventario      | Vistas MUI: listado, edición, alertas                        |

**Duración estimada: 1.5 semanas**

---

### Fase 2 — Módulo de Caja y POS

> Entregable: punto de venta conectado al inventario existente.

| Tarea                      | Descripción                                       |
| -------------------------- | ------------------------------------------------- |
| Control de Caja            | Apertura, cierre, movimientos                     |
| POS — Venta con inventario | Carrito, validación stock, transacción atómica    |
| POS — Venta de comidas     | Sin descuento de inventario                       |
| Generación de tickets PDF  | pdf-lib, plantilla con datos de la cafetería      |
| UI POS                     | Vista de caja MUI, carrito, confirmación de venta |

**Duración estimada: 1.5 semanas**

---

### Fase 3 — Créditos, Abonos y Reportes

> Entregable: gestión financiera completa.

| Tarea                          | Descripción                                 |
| ------------------------------ | ------------------------------------------- |
| Ventas a crédito               | Estado pendiente, registro en tabla crédito |
| Abonos                         | Registro parcial, actualización de saldo    |
| Historial de deuda por cliente | Consulta con filtro por fecha y hora        |
| Reportes diarios y mensuales   | Ventas, caja, créditos pendientes           |
| UI Créditos y Reportes         | Vistas MUI con tablas y resúmenes           |

**Duración estimada: 1 semana**

---

### Fase 4 — Testing y Despliegue

> Entregable: sistema en producción.

| Tarea                                 | Descripción                            |
| ------------------------------------- | -------------------------------------- |
| Pruebas de integración                | Flujos críticos: venta, stock, crédito |
| Configuración Railway + Vercel + Neon | Producción y entorno dev               |
| Migraciones de base de datos          | TypeORM en entorno productivo          |
| Configuración de dominio              | Namecheap + DNS en Vercel y Railway    |
| QA final                              | Revisión de reglas de negocio y roles  |

**Duración estimada: 1 semana**

---

### Resumen de tiempos

| Fase      | Módulos                       | Duración      |
| --------- | ----------------------------- | ------------- |
| 1         | Auth + Productos + Inventario | 1.5 semanas   |
| 2         | Caja + POS + Tickets          | 1.5 semanas   |
| 3         | Créditos + Abonos + Reportes  | 1 semana      |
| 4         | Testing + Despliegue          | 1 semana      |
| **Total** |                               | **5 semanas** |

> La Fase 1 puede entregarse y usarse en producción de forma independiente antes de iniciar la Fase 2.

---

## 14. Próximos Pasos

- [ ] Crear repositorio Git (monorepo o repos separados)
- [ ] Configurar proyecto en Railway y conectar repo
- [ ] Conectar repo frontend a Vercel
- [ ] Crear proyecto en Neon y obtener `DATABASE_URL`
- [ ] Configurar variables de entorno en Railway y Vercel
- [ ] Desarrollar Fase 1: Auth + Roles + Productos
- [ ] Ejecutar migraciones iniciales de TypeORM

---
