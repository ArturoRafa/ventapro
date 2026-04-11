# Decisión: Categorías y Subcategorías de Productos

> Complemento al documento de decisiones técnicas de cafe-pos.  
> Fecha: Abril 2026

---

## Contexto

En el diseño original, la categoría del producto era un campo de texto libre (`categoria VARCHAR`) dentro de la tabla `productos`. Esto limitaba la capacidad de:

- Organizar el catálogo en el POS por grupos visuales.
- Filtrar y agrupar productos en reportes.
- Permitir que cada cliente white-label defina su propia estructura de categorías.
- Mantener consistencia (errores de tipeo, duplicados con diferente escritura).

---

## Decisión

Se implementa un esquema de **dos niveles fijos: Categoría → Subcategoría**, administrable desde el panel Admin.

- Cada **categoría** agrupa subcategorías relacionadas.
- Cada **subcategoría** pertenece a una sola categoría.
- Cada **producto** se asocia a una subcategoría (y a través de ella, a su categoría padre).

No se implementan niveles adicionales de profundidad. Dos niveles cubren el 90% de los casos en negocios pequeños con mostrador.

---

## Ejemplos por Tipo de Negocio

### Cafetería

| Categoría | Subcategorías                                       |
| --------- | --------------------------------------------------- |
| Bebidas   | Café caliente, Café frío, Jugos naturales, Gaseosas |
| Comidas   | Desayunos, Almuerzos, Empanadas, Hamburguesas       |
| Snacks    | Galletas, Papas, Dulces                             |
| Panadería | Pan, Pasteles, Tortas                               |

### Papelería

| Categoría  | Subcategorías                   |
| ---------- | ------------------------------- |
| Escritura  | Lápices, Bolígrafos, Marcadores |
| Papel      | Cuadernos, Resmas, Cartulinas   |
| Tecnología | USB, Audífonos, Cargadores      |

### Tienda de barrio

| Categoría | Subcategorías                      |
| --------- | ---------------------------------- |
| Bebidas   | Gaseosas, Jugos, Agua, Cerveza     |
| Lácteos   | Leche, Yogur, Queso                |
| Abarrotes | Arroz, Aceite, Enlatados           |
| Aseo      | Jabón, Detergente, Papel higiénico |

---

## Modelo de Datos

### Tabla: categorias

| Campo      | Tipo         | Requerido | Notas                                       |
| ---------- | ------------ | --------- | ------------------------------------------- |
| id         | INT (PK)     | Auto      | Autoincremental                             |
| nombre     | VARCHAR(100) | Sí        | Nombre de la categoría                      |
| estado     | VARCHAR(10)  | Sí        | activo / inactivo (default: activo)         |
| orden      | INT          | No        | Orden de visualización en el POS y catálogo |
| created_at | TIMESTAMP    | Auto      | Fecha de creación                           |
| updated_at | TIMESTAMP    | Auto      | Última actualización                        |

### Tabla: subcategorias

| Campo        | Tipo         | Requerido | Notas                                         |
| ------------ | ------------ | --------- | --------------------------------------------- |
| id           | INT (PK)     | Auto      | Autoincremental                               |
| categoria_id | INT (FK)     | Sí        | Referencia a la categoría padre               |
| nombre       | VARCHAR(100) | Sí        | Nombre de la subcategoría                     |
| estado       | VARCHAR(10)  | Sí        | activo / inactivo (default: activo)           |
| orden        | INT          | No        | Orden de visualización dentro de su categoría |
| created_at   | TIMESTAMP    | Auto      | Fecha de creación                             |
| updated_at   | TIMESTAMP    | Auto      | Última actualización                          |

### Cambio en tabla: productos

Se reemplaza la columna `categoria VARCHAR` por:

| Campo           | Tipo     | Requerido | Notas                                     |
| --------------- | -------- | --------- | ----------------------------------------- |
| subcategoria_id | INT (FK) | Sí        | Referencia a la subcategoría del producto |

La categoría del producto se obtiene a través de la subcategoría (`producto → subcategoría → categoría`).

---

## Reglas de Negocio

1. **Categoría obligatoria** — Toda subcategoría debe pertenecer a una categoría.
2. **Subcategoría obligatoria** — Todo producto debe tener una subcategoría asignada.
3. **Desactivación en cascada** — Si se desactiva una categoría, todas sus subcategorías quedan inactivas automáticamente. Los productos asociados a esas subcategorías no aparecen en el POS.
4. **No eliminar con productos asociados** — No se puede eliminar una subcategoría que tenga productos asociados. Solo se puede desactivar.
5. **No eliminar con subcategorías asociadas** — No se puede eliminar una categoría que tenga subcategorías. Primero se deben reasignar o eliminar las subcategorías.
6. **Nombre único por nivel** — No pueden existir dos categorías con el mismo nombre. No pueden existir dos subcategorías con el mismo nombre dentro de la misma categoría (pero sí en categorías diferentes).
7. **Orden personalizable** — El campo `orden` permite al Admin definir cómo se muestran las categorías y subcategorías en el POS y en el catálogo.

---

## Funcionalidad en el Admin

### CRUD de Categorías (panel dedicado)

- Crear categoría (nombre, orden).
- Editar nombre y orden.
- Activar / desactivar categoría (con cascada a subcategorías).
- Ver listado de categorías con cantidad de subcategorías y productos.

### CRUD de Subcategorías (panel dedicado)

- Crear subcategoría dentro de una categoría (nombre, orden).
- Editar nombre, orden y reasignar a otra categoría.
- Activar / desactivar subcategoría.
- Ver listado con cantidad de productos asociados.

### Creación rápida desde el formulario de producto

Además del panel dedicado, el usuario puede crear categorías y subcategorías **directamente desde el formulario de creación/edición de producto**, sin salir de la pantalla.

**Flujo de experiencia:**

1. El usuario está creando un producto nuevo.
2. En el campo de **categoría** (selector desplegable), al final de la lista aparece la opción **"+ Crear nueva categoría"**.
3. Al seleccionarla, se abre un campo de texto inline (o un mini diálogo) donde escribe el nombre de la nueva categoría y la confirma.
4. La categoría se crea inmediatamente y queda seleccionada en el formulario.
5. El mismo comportamiento aplica para **subcategoría**: al seleccionar una categoría, el selector de subcategorías muestra las existentes más la opción **"+ Crear nueva subcategoría"**.
6. La subcategoría se crea asociada a la categoría ya seleccionada.

**Reglas de la creación rápida:**

- Se aplica la misma validación de nombre único que en el CRUD dedicado.
- Las categorías y subcategorías creadas por esta vía nacen con estado **activo** y orden **automático** (último de la lista).
- Si el usuario necesita editar orden, desactivar o reorganizar, lo hace desde el panel dedicado de categorías.
- Esta funcionalidad está disponible tanto para el rol **Admin** como para el rol **Cajero** (si el cajero tiene permiso de crear productos).

---

## Impacto en el POS

- El catálogo del POS muestra los productos agrupados por categoría y subcategoría.
- El cajero puede filtrar rápidamente por categoría (ej: "Bebidas") y luego por subcategoría (ej: "Café caliente").
- Solo se muestran categorías, subcategorías y productos activos.

---

## Impacto en Reportes

- Los reportes de ventas pueden agruparse por categoría o subcategoría.
- Ejemplo en el reporte diario: "Hoy se vendieron 12 bebidas, 8 comidas y 5 snacks."
- Producto estrella por categoría: "La bebida más vendida fue el café con leche."

---

## Impacto en Fases del Proyecto

Esta funcionalidad se incorpora en la **Fase 1** (Auth + Productos + Inventario + Config), ya que las categorías son prerequisito para el CRUD de productos.

| Tarea nueva         | Descripción                                                | Prioridad |
| ------------------- | ---------------------------------------------------------- | --------- |
| CRUD Categorías     | API + UI para gestionar categorías                         | Crítica   |
| CRUD Subcategorías  | API + UI para gestionar subcategorías dentro de categorías | Crítica   |
| Migración productos | Reemplazar campo `categoria` por `subcategoria_id` (FK)    | Crítica   |
| Filtro en POS       | Navegación por categoría/subcategoría en el catálogo       | Alta      |

---
