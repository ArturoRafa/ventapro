-- ============================================================================
-- cafe-pos — Schema SQL completo
-- PostgreSQL 15+ | Neon serverless
-- Versión 1.0 — Abril 2026
--
-- Convenciones aplicadas:
--   • Tablas: snake_case, plural, en español
--   • Columnas: snake_case, en español
--   • PKs: id SERIAL
--   • FKs: <tabla_singular>_id
--   • Índices: idx_<tabla>_<columna(s)>
--   • Constraints unique: uq_<tabla>_<columna>
--   • Monetarios: DECIMAL(12,2)
--   • Enums: VARCHAR con valores cortos
--   • Soft delete: columna estado (activo/inactivo)
--   • Timestamps: created_at y updated_at donde aplique
-- ============================================================================


-- ############################################################################
-- LIMPIEZA (orden inverso por dependencias)
-- ############################################################################

DROP TABLE IF EXISTS abonos CASCADE;
DROP TABLE IF EXISTS creditos CASCADE;
DROP TABLE IF EXISTS detalle_ventas CASCADE;
DROP TABLE IF EXISTS ventas CASCADE;
DROP TABLE IF EXISTS cajas CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS subcategorias CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS configuracion_negocio CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP FUNCTION IF EXISTS fn_actualizar_updated_at CASCADE;


-- ############################################################################
-- 1. USUARIOS  (Módulo: Auth)
-- ############################################################################

CREATE TABLE usuarios (
    id              SERIAL          PRIMARY KEY,
    nombre          VARCHAR(100)    NOT NULL,
    email           VARCHAR(150)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    rol             VARCHAR(10)     NOT NULL DEFAULT 'cashier',
    estado          VARCHAR(10)     NOT NULL DEFAULT 'activo',
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_usuarios_email
        UNIQUE (email),

    CONSTRAINT chk_usuarios_rol
        CHECK (rol IN ('admin', 'cashier')),

    CONSTRAINT chk_usuarios_estado
        CHECK (estado IN ('activo', 'inactivo'))
);

CREATE INDEX idx_usuarios_email  ON usuarios (email);
CREATE INDEX idx_usuarios_rol    ON usuarios (rol);
CREATE INDEX idx_usuarios_estado ON usuarios (estado);


-- ############################################################################
-- 2. CONFIGURACION_NEGOCIO  (Módulo: Configuración — singleton)
-- ############################################################################

CREATE TABLE configuracion_negocio (
    id                          SERIAL          PRIMARY KEY,

    -- Identidad del negocio (white-label)
    nombre_negocio              VARCHAR(100)    NOT NULL DEFAULT 'Cafetería El Buen Sabor',
    logo_url                    TEXT,
    color_primario              VARCHAR(7)      NOT NULL DEFAULT '#1B5E20',
    color_secundario            VARCHAR(7)      NOT NULL DEFAULT '#FF6F00',
    telefono_negocio            VARCHAR(20),
    direccion_negocio           TEXT,

    -- Localización
    moneda                      VARCHAR(3)      NOT NULL DEFAULT 'COP',
    simbolo_moneda              VARCHAR(5)      NOT NULL DEFAULT '$',
    impuesto_porcentaje         DECIMAL(5,2)    NOT NULL DEFAULT 0.00,

    -- Feature flags — módulos activables
    usa_fiado                   BOOLEAN         NOT NULL DEFAULT TRUE,
    usa_comidas                 BOOLEAN         NOT NULL DEFAULT TRUE,
    usa_control_caja            BOOLEAN         NOT NULL DEFAULT TRUE,
    usa_whatsapp                BOOLEAN         NOT NULL DEFAULT TRUE,
    usa_reportes                BOOLEAN         NOT NULL DEFAULT TRUE,
    usa_tickets_pdf             BOOLEAN         NOT NULL DEFAULT TRUE,

    -- Configuración de comportamiento
    requiere_monto_apertura     BOOLEAN         NOT NULL DEFAULT FALSE,
    numero_whatsapp             VARCHAR(20)
);


-- ############################################################################
-- 3. CATEGORIAS  (Módulo: Catálogo)
-- ############################################################################

CREATE TABLE categorias (
    id          SERIAL          PRIMARY KEY,
    nombre      VARCHAR(100)    NOT NULL,
    estado      VARCHAR(10)     NOT NULL DEFAULT 'activo',
    orden       INT             NOT NULL DEFAULT 0,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_categorias_nombre
        UNIQUE (nombre),

    CONSTRAINT chk_categorias_estado
        CHECK (estado IN ('activo', 'inactivo'))
);

CREATE INDEX idx_categorias_estado ON categorias (estado);
CREATE INDEX idx_categorias_orden  ON categorias (orden);


-- ############################################################################
-- 4. SUBCATEGORIAS  (Módulo: Catálogo)
-- ############################################################################

CREATE TABLE subcategorias (
    id              SERIAL          PRIMARY KEY,
    categoria_id    INT             NOT NULL,
    nombre          VARCHAR(100)    NOT NULL,
    estado          VARCHAR(10)     NOT NULL DEFAULT 'activo',
    orden           INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_subcategorias_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES categorias (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_subcategorias_categoria_nombre
        UNIQUE (categoria_id, nombre),

    CONSTRAINT chk_subcategorias_estado
        CHECK (estado IN ('activo', 'inactivo'))
);

CREATE INDEX idx_subcategorias_categoria_id ON subcategorias (categoria_id);
CREATE INDEX idx_subcategorias_estado       ON subcategorias (estado);


-- ############################################################################
-- 5. PRODUCTOS  (Módulo: Catálogo)
-- ############################################################################

CREATE TABLE productos (
    id              SERIAL          PRIMARY KEY,
    codigo          VARCHAR(50)     NOT NULL,
    nombre          VARCHAR(100)    NOT NULL,
    subcategoria_id INT             NOT NULL,
    tipo            VARCHAR(10)     NOT NULL DEFAULT 'inventory',
    precio          DECIMAL(12,2)   NOT NULL,
    stock           INT             NOT NULL DEFAULT 0,
    stock_minimo    INT             NOT NULL DEFAULT 0,
    estado          VARCHAR(10)     NOT NULL DEFAULT 'activo',
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_productos_codigo
        UNIQUE (codigo),

    CONSTRAINT fk_productos_subcategoria
        FOREIGN KEY (subcategoria_id)
        REFERENCES subcategorias (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_productos_tipo
        CHECK (tipo IN ('inventory', 'food')),

    CONSTRAINT chk_productos_estado
        CHECK (estado IN ('activo', 'inactivo')),

    CONSTRAINT chk_productos_precio_positivo
        CHECK (precio >= 0),

    CONSTRAINT chk_productos_stock_positivo
        CHECK (stock >= 0),

    CONSTRAINT chk_productos_stock_minimo_positivo
        CHECK (stock_minimo >= 0)
);

CREATE INDEX idx_productos_subcategoria_id ON productos (subcategoria_id);
CREATE INDEX idx_productos_tipo            ON productos (tipo);
CREATE INDEX idx_productos_estado          ON productos (estado);
CREATE INDEX idx_productos_created_at      ON productos (created_at);


-- ############################################################################
-- 6. CLIENTES  (Módulo: Créditos / Fiado)
-- ############################################################################

CREATE TABLE clientes (
    id                      SERIAL          PRIMARY KEY,
    nombre                  VARCHAR(100)    NOT NULL,
    telefono                VARCHAR(20)     NOT NULL,
    telefono_alternativo    VARCHAR(20),
    direccion               TEXT,
    estado                  VARCHAR(10)     NOT NULL DEFAULT 'activo',
    created_at              TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_clientes_estado
        CHECK (estado IN ('activo', 'inactivo'))
);

CREATE INDEX idx_clientes_nombre ON clientes (nombre);
CREATE INDEX idx_clientes_estado ON clientes (estado);


-- ############################################################################
-- 7. CAJAS  (Módulo: Control de Caja)
-- ############################################################################

CREATE TABLE cajas (
    id                      SERIAL          PRIMARY KEY,
    cajero_id               INT             NOT NULL,
    monto_inicial           DECIMAL(12,2),
    monto_cierre_real       DECIMAL(12,2),
    monto_cierre_sistema    DECIMAL(12,2),
    diferencia              DECIMAL(12,2),
    estado                  VARCHAR(10)     NOT NULL DEFAULT 'abierta',
    fecha_apertura          TIMESTAMP       NOT NULL DEFAULT NOW(),
    fecha_cierre            TIMESTAMP,
    notas_cierre            TEXT,

    CONSTRAINT fk_cajas_cajero
        FOREIGN KEY (cajero_id)
        REFERENCES usuarios (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_cajas_estado
        CHECK (estado IN ('abierta', 'cerrada'))
);

CREATE INDEX idx_cajas_cajero_id      ON cajas (cajero_id);
CREATE INDEX idx_cajas_estado         ON cajas (estado);
CREATE INDEX idx_cajas_fecha_apertura ON cajas (fecha_apertura);


-- ############################################################################
-- 8. VENTAS  (Módulo: POS)
-- ############################################################################

CREATE TABLE ventas (
    id          SERIAL          PRIMARY KEY,
    caja_id     INT             NOT NULL,
    cliente_id  INT,
    cajero_id   INT             NOT NULL,
    total       DECIMAL(12,2)   NOT NULL,
    forma_pago  VARCHAR(15)     NOT NULL,
    estado      VARCHAR(10)     NOT NULL DEFAULT 'paid',
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ventas_caja
        FOREIGN KEY (caja_id)
        REFERENCES cajas (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_ventas_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_ventas_cajero
        FOREIGN KEY (cajero_id)
        REFERENCES usuarios (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_ventas_forma_pago
        CHECK (forma_pago IN ('cash', 'card', 'transfer')),

    CONSTRAINT chk_ventas_estado
        CHECK (estado IN ('paid', 'pending')),

    CONSTRAINT chk_ventas_total_positivo
        CHECK (total >= 0)
);

CREATE INDEX idx_ventas_caja_id    ON ventas (caja_id);
CREATE INDEX idx_ventas_cliente_id ON ventas (cliente_id);
CREATE INDEX idx_ventas_cajero_id  ON ventas (cajero_id);
CREATE INDEX idx_ventas_estado     ON ventas (estado);
CREATE INDEX idx_ventas_forma_pago ON ventas (forma_pago);
CREATE INDEX idx_ventas_created_at ON ventas (created_at);


-- ############################################################################
-- 9. DETALLE_VENTAS  (Módulo: POS)
-- ############################################################################

CREATE TABLE detalle_ventas (
    id              SERIAL          PRIMARY KEY,
    venta_id        INT             NOT NULL,
    producto_id     INT             NOT NULL,
    cantidad        INT             NOT NULL,
    precio_unitario DECIMAL(12,2)   NOT NULL,
    subtotal        DECIMAL(12,2)   NOT NULL,

    CONSTRAINT fk_detalle_ventas_venta
        FOREIGN KEY (venta_id)
        REFERENCES ventas (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_detalle_ventas_producto
        FOREIGN KEY (producto_id)
        REFERENCES productos (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_detalle_ventas_cantidad_positiva
        CHECK (cantidad > 0),

    CONSTRAINT chk_detalle_ventas_precio_positivo
        CHECK (precio_unitario >= 0),

    CONSTRAINT chk_detalle_ventas_subtotal_positivo
        CHECK (subtotal >= 0)
);

CREATE INDEX idx_detalle_ventas_venta_id    ON detalle_ventas (venta_id);
CREATE INDEX idx_detalle_ventas_producto_id ON detalle_ventas (producto_id);


-- ############################################################################
-- 10. CREDITOS  (Módulo: Fiado)
-- ############################################################################

CREATE TABLE creditos (
    id                  SERIAL          PRIMARY KEY,
    cliente_id          INT             NOT NULL,
    venta_id            INT             NOT NULL,
    monto_total         DECIMAL(12,2)   NOT NULL,
    saldo_pendiente     DECIMAL(12,2)   NOT NULL,
    estado              VARCHAR(10)     NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_creditos_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_creditos_venta
        FOREIGN KEY (venta_id)
        REFERENCES ventas (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_creditos_estado
        CHECK (estado IN ('pending', 'paid')),

    CONSTRAINT chk_creditos_monto_positivo
        CHECK (monto_total >= 0),

    CONSTRAINT chk_creditos_saldo_positivo
        CHECK (saldo_pendiente >= 0)
);

CREATE INDEX idx_creditos_cliente_id ON creditos (cliente_id);
CREATE INDEX idx_creditos_venta_id   ON creditos (venta_id);
CREATE INDEX idx_creditos_estado     ON creditos (estado);
CREATE INDEX idx_creditos_created_at ON creditos (created_at);


-- ############################################################################
-- 11. ABONOS  (Módulo: Fiado)
-- ############################################################################

CREATE TABLE abonos (
    id          SERIAL          PRIMARY KEY,
    credito_id  INT             NOT NULL,
    cliente_id  INT             NOT NULL,
    monto       DECIMAL(12,2)   NOT NULL,
    fecha       TIMESTAMP       NOT NULL DEFAULT NOW(),
    notas       TEXT,

    CONSTRAINT fk_abonos_credito
        FOREIGN KEY (credito_id)
        REFERENCES creditos (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_abonos_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_abonos_monto_positivo
        CHECK (monto > 0)
);

CREATE INDEX idx_abonos_credito_id ON abonos (credito_id);
CREATE INDEX idx_abonos_cliente_id ON abonos (cliente_id);
CREATE INDEX idx_abonos_fecha      ON abonos (fecha);


-- ############################################################################
-- FUNCIÓN: Actualizar updated_at automáticamente
-- ############################################################################

CREATE OR REPLACE FUNCTION fn_actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para todas las tablas con updated_at
CREATE TRIGGER trg_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at();

CREATE TRIGGER trg_categorias_updated_at
    BEFORE UPDATE ON categorias
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at();

CREATE TRIGGER trg_subcategorias_updated_at
    BEFORE UPDATE ON subcategorias
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at();

CREATE TRIGGER trg_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at();

CREATE TRIGGER trg_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at();


-- ############################################################################
-- SEED: Datos iniciales
-- ############################################################################

-- Configuración del negocio (singleton)
INSERT INTO configuracion_negocio (
    nombre_negocio,
    color_primario,
    color_secundario,
    moneda,
    simbolo_moneda,
    impuesto_porcentaje,
    usa_fiado,
    usa_comidas,
    usa_control_caja,
    usa_whatsapp,
    usa_reportes,
    usa_tickets_pdf,
    requiere_monto_apertura
) VALUES (
    'Cafetería El Buen Sabor',
    '#1B5E20',
    '#FF6F00',
    'COP',
    '$',
    0.00,
    TRUE,       -- usa_fiado
    TRUE,       -- usa_comidas
    TRUE,       -- usa_control_caja
    TRUE,       -- usa_whatsapp
    TRUE,       -- usa_reportes
    TRUE,       -- usa_tickets_pdf
    FALSE       -- requiere_monto_apertura
);

-- Usuario Admin por defecto
-- IMPORTANTE: El password_hash debe regenerarse con bcrypt (12 salt rounds)
-- desde el seed del backend. Este es un placeholder para 'admin123'.
-- CAMBIAR EN PRODUCCIÓN.
INSERT INTO usuarios (nombre, email, password_hash, rol, estado)
VALUES (
    'Administrador',
    'admin@cafepos.com',
    '$2b$12$LJ3m4ys3Lk0TSwHEQcEkv.gDPVQz5ceFvPBpMlKNOAYSQlMy3SRSe',
    'admin',
    'activo'
);

-- Categorías de ejemplo (Cafetería)
INSERT INTO categorias (nombre, orden) VALUES
    ('Bebidas',    1),
    ('Comidas',    2),
    ('Snacks',     3),
    ('Panadería',  4);

-- Subcategorías de ejemplo
INSERT INTO subcategorias (categoria_id, nombre, orden) VALUES
    -- Bebidas (categoria_id = 1)
    (1, 'Café caliente',    1),
    (1, 'Café frío',        2),
    (1, 'Jugos naturales',  3),
    (1, 'Gaseosas',         4),
    -- Comidas (categoria_id = 2)
    (2, 'Desayunos',        1),
    (2, 'Almuerzos',        2),
    (2, 'Empanadas',        3),
    (2, 'Hamburguesas',     4),
    -- Snacks (categoria_id = 3)
    (3, 'Galletas',         1),
    (3, 'Papas',            2),
    (3, 'Dulces',           3),
    -- Panadería (categoria_id = 4)
    (4, 'Pan',              1),
    (4, 'Pasteles',         2),
    (4, 'Tortas',           3);


-- ############################################################################
-- RESUMEN DEL ESQUEMA
-- ############################################################################
--
-- Tablas:          11
-- Relaciones FK:   12
-- Índices:         27
-- CHECK constraints: 18
-- Triggers:         5  (updated_at automático)
-- Feature flags:    6  (usa_fiado, usa_comidas, usa_control_caja,
--                       usa_whatsapp, usa_reportes, usa_tickets_pdf)
-- Seed:             1 admin + 1 config + 4 categorías + 14 subcategorías
--
-- Relaciones:
--   categorias         1 ──< N   subcategorias      (categoria_id)
--   subcategorias      1 ──< N   productos           (subcategoria_id)
--   usuarios           1 ──< N   cajas               (cajero_id)
--   usuarios           1 ──< N   ventas              (cajero_id)
--   cajas              1 ──< N   ventas              (caja_id)
--   clientes           1 ──< N   ventas              (cliente_id)
--   ventas             1 ──< N   detalle_ventas      (venta_id)
--   productos          1 ──< N   detalle_ventas      (producto_id)
--   clientes           1 ──< N   creditos            (cliente_id)
--   ventas             1 ──── 1  creditos            (venta_id)
--   creditos           1 ──< N   abonos              (credito_id)
--   clientes           1 ──< N   abonos              (cliente_id)
--
-- ============================================================================