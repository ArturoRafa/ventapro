import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1775869362804 implements MigrationInterface {
    name = 'InitialSchema1775869362804'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "usuarios" ("id" SERIAL NOT NULL, "nombre" character varying(100) NOT NULL, "email" character varying(150) NOT NULL, "password_hash" character varying(255) NOT NULL, "rol" character varying(10) NOT NULL DEFAULT 'cashier', "estado" character varying(10) NOT NULL DEFAULT 'activo', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categorias" ("id" SERIAL NOT NULL, "nombre" character varying(100) NOT NULL, "estado" character varying(10) NOT NULL DEFAULT 'activo', "orden" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ccdf6cd1a34ea90a7233325063d" UNIQUE ("nombre"), CONSTRAINT "PK_3886a26251605c571c6b4f861fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "subcategorias" ("id" SERIAL NOT NULL, "categoria_id" integer NOT NULL, "nombre" character varying(100) NOT NULL, "estado" character varying(10) NOT NULL DEFAULT 'activo', "orden" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "uq_subcategorias_categoria_nombre" UNIQUE ("categoria_id", "nombre"), CONSTRAINT "PK_9bbef90f7112e787d4e4b23d455" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "productos" ("id" SERIAL NOT NULL, "codigo" character varying(50) NOT NULL, "nombre" character varying(100) NOT NULL, "subcategoria_id" integer NOT NULL, "tipo" character varying(10) NOT NULL DEFAULT 'inventory', "precio" numeric(12,2) NOT NULL, "stock" integer NOT NULL DEFAULT '0', "stock_minimo" integer NOT NULL DEFAULT '0', "estado" character varying(10) NOT NULL DEFAULT 'activo', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2da210b34325c2319d784a32d49" UNIQUE ("codigo"), CONSTRAINT "PK_04f604609a0949a7f3b43400766" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "configuracion_negocio" ("id" SERIAL NOT NULL, "nombre_negocio" character varying(100) NOT NULL DEFAULT 'Cafeteria El Buen Sabor', "logo_url" text, "color_primario" character varying(7) NOT NULL DEFAULT '#1B5E20', "color_secundario" character varying(7) NOT NULL DEFAULT '#FF6F00', "telefono_negocio" character varying(20), "direccion_negocio" text, "moneda" character varying(3) NOT NULL DEFAULT 'COP', "simbolo_moneda" character varying(5) NOT NULL DEFAULT '$', "impuesto_porcentaje" numeric(5,2) NOT NULL DEFAULT '0', "usa_fiado" boolean NOT NULL DEFAULT true, "usa_comidas" boolean NOT NULL DEFAULT true, "usa_control_caja" boolean NOT NULL DEFAULT true, "usa_whatsapp" boolean NOT NULL DEFAULT true, "usa_reportes" boolean NOT NULL DEFAULT true, "usa_tickets_pdf" boolean NOT NULL DEFAULT true, "requiere_monto_apertura" boolean NOT NULL DEFAULT false, "numero_whatsapp" character varying(20), CONSTRAINT "PK_bc2fd85731bbf516bcf33f2ec75" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "clientes" ("id" SERIAL NOT NULL, "nombre" character varying(100) NOT NULL, "telefono" character varying(20) NOT NULL, "telefono_alternativo" character varying(20), "direccion" text, "estado" character varying(10) NOT NULL DEFAULT 'activo', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d76bf3571d906e4e86470482c08" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "subcategorias" ADD CONSTRAINT "FK_b15fe98fc00a27b01420611b73b" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "productos" ADD CONSTRAINT "FK_bbe10e43f73d5d1033b61a3a389" FOREIGN KEY ("subcategoria_id") REFERENCES "subcategorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);

        // CHECK constraints
        await queryRunner.query(`ALTER TABLE "usuarios" ADD CONSTRAINT "chk_usuarios_rol" CHECK (rol IN ('admin', 'cashier'))`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD CONSTRAINT "chk_usuarios_estado" CHECK (estado IN ('activo', 'inactivo'))`);
        await queryRunner.query(`ALTER TABLE "categorias" ADD CONSTRAINT "chk_categorias_estado" CHECK (estado IN ('activo', 'inactivo'))`);
        await queryRunner.query(`ALTER TABLE "subcategorias" ADD CONSTRAINT "chk_subcategorias_estado" CHECK (estado IN ('activo', 'inactivo'))`);
        await queryRunner.query(`ALTER TABLE "productos" ADD CONSTRAINT "chk_productos_tipo" CHECK (tipo IN ('inventory', 'food'))`);
        await queryRunner.query(`ALTER TABLE "productos" ADD CONSTRAINT "chk_productos_estado" CHECK (estado IN ('activo', 'inactivo'))`);
        await queryRunner.query(`ALTER TABLE "productos" ADD CONSTRAINT "chk_productos_precio_positivo" CHECK (precio >= 0)`);
        await queryRunner.query(`ALTER TABLE "productos" ADD CONSTRAINT "chk_productos_stock_positivo" CHECK (stock >= 0)`);
        await queryRunner.query(`ALTER TABLE "productos" ADD CONSTRAINT "chk_productos_stock_minimo_positivo" CHECK (stock_minimo >= 0)`);
        await queryRunner.query(`ALTER TABLE "clientes" ADD CONSTRAINT "chk_clientes_estado" CHECK (estado IN ('activo', 'inactivo'))`);

        // Indexes
        await queryRunner.query(`CREATE INDEX "idx_usuarios_email" ON "usuarios" ("email")`);
        await queryRunner.query(`CREATE INDEX "idx_usuarios_rol" ON "usuarios" ("rol")`);
        await queryRunner.query(`CREATE INDEX "idx_usuarios_estado" ON "usuarios" ("estado")`);
        await queryRunner.query(`CREATE INDEX "idx_categorias_estado" ON "categorias" ("estado")`);
        await queryRunner.query(`CREATE INDEX "idx_categorias_orden" ON "categorias" ("orden")`);
        await queryRunner.query(`CREATE INDEX "idx_subcategorias_categoria_id" ON "subcategorias" ("categoria_id")`);
        await queryRunner.query(`CREATE INDEX "idx_subcategorias_estado" ON "subcategorias" ("estado")`);
        await queryRunner.query(`CREATE INDEX "idx_productos_subcategoria_id" ON "productos" ("subcategoria_id")`);
        await queryRunner.query(`CREATE INDEX "idx_productos_tipo" ON "productos" ("tipo")`);
        await queryRunner.query(`CREATE INDEX "idx_productos_estado" ON "productos" ("estado")`);
        await queryRunner.query(`CREATE INDEX "idx_productos_created_at" ON "productos" ("created_at")`);
        await queryRunner.query(`CREATE INDEX "idx_clientes_nombre" ON "clientes" ("nombre")`);
        await queryRunner.query(`CREATE INDEX "idx_clientes_estado" ON "clientes" ("estado")`);

        // Trigger function for updated_at
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION fn_actualizar_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `);
        await queryRunner.query(`CREATE TRIGGER trg_usuarios_updated_at BEFORE UPDATE ON "usuarios" FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at()`);
        await queryRunner.query(`CREATE TRIGGER trg_categorias_updated_at BEFORE UPDATE ON "categorias" FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at()`);
        await queryRunner.query(`CREATE TRIGGER trg_subcategorias_updated_at BEFORE UPDATE ON "subcategorias" FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at()`);
        await queryRunner.query(`CREATE TRIGGER trg_productos_updated_at BEFORE UPDATE ON "productos" FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at()`);
        await queryRunner.query(`CREATE TRIGGER trg_clientes_updated_at BEFORE UPDATE ON "clientes" FOR EACH ROW EXECUTE FUNCTION fn_actualizar_updated_at()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "productos" DROP CONSTRAINT "FK_bbe10e43f73d5d1033b61a3a389"`);
        await queryRunner.query(`ALTER TABLE "subcategorias" DROP CONSTRAINT "FK_b15fe98fc00a27b01420611b73b"`);
        await queryRunner.query(`DROP TABLE "clientes"`);
        await queryRunner.query(`DROP TABLE "configuracion_negocio"`);
        await queryRunner.query(`DROP TABLE "productos"`);
        await queryRunner.query(`DROP TABLE "subcategorias"`);
        await queryRunner.query(`DROP TABLE "categorias"`);
        await queryRunner.query(`DROP TABLE "usuarios"`);
    }

}
