import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase2Schema1776000000000 implements MigrationInterface {
    name = 'Phase2Schema1776000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ── Table: cajas ──────────────────────────────────────────────
        await queryRunner.query(`CREATE TABLE "cajas" ("id" SERIAL NOT NULL, "cajero_id" integer NOT NULL, "monto_inicial" numeric(12,2), "monto_cierre_real" numeric(12,2), "monto_cierre_sistema" numeric(12,2), "diferencia" numeric(12,2), "estado" character varying(10) NOT NULL DEFAULT 'abierta', "fecha_apertura" TIMESTAMP NOT NULL DEFAULT now(), "fecha_cierre" TIMESTAMP, "notas_cierre" text, CONSTRAINT "PK_cajas" PRIMARY KEY ("id"))`);

        // ── Table: ventas ─────────────────────────────────────────────
        await queryRunner.query(`CREATE TABLE "ventas" ("id" SERIAL NOT NULL, "caja_id" integer NOT NULL, "cliente_id" integer, "cajero_id" integer NOT NULL, "total" numeric(12,2) NOT NULL, "forma_pago" character varying(15) NOT NULL, "estado" character varying(10) NOT NULL DEFAULT 'paid', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ventas" PRIMARY KEY ("id"))`);

        // ── Table: detalle_ventas ─────────────────────────────────────
        await queryRunner.query(`CREATE TABLE "detalle_ventas" ("id" SERIAL NOT NULL, "venta_id" integer NOT NULL, "producto_id" integer NOT NULL, "cantidad" integer NOT NULL, "precio_unitario" numeric(12,2) NOT NULL, "subtotal" numeric(12,2) NOT NULL, CONSTRAINT "PK_detalle_ventas" PRIMARY KEY ("id"))`);

        // ── Table: creditos ───────────────────────────────────────────
        await queryRunner.query(`CREATE TABLE "creditos" ("id" SERIAL NOT NULL, "cliente_id" integer NOT NULL, "venta_id" integer NOT NULL, "monto_total" numeric(12,2) NOT NULL, "saldo_pendiente" numeric(12,2) NOT NULL, "estado" character varying(10) NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_creditos" PRIMARY KEY ("id"))`);

        // ── Table: abonos ─────────────────────────────────────────────
        await queryRunner.query(`CREATE TABLE "abonos" ("id" SERIAL NOT NULL, "credito_id" integer NOT NULL, "cliente_id" integer NOT NULL, "caja_id" integer NOT NULL, "monto" numeric(12,2) NOT NULL, "fecha" TIMESTAMP NOT NULL DEFAULT now(), "notas" text, CONSTRAINT "PK_abonos" PRIMARY KEY ("id"))`);

        // ── Foreign keys: cajas ───────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "cajas" ADD CONSTRAINT "fk_cajas_cajero" FOREIGN KEY ("cajero_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);

        // ── Foreign keys: ventas ──────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "ventas" ADD CONSTRAINT "fk_ventas_caja" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "ventas" ADD CONSTRAINT "fk_ventas_cliente" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "ventas" ADD CONSTRAINT "fk_ventas_cajero" FOREIGN KEY ("cajero_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);

        // ── Foreign keys: detalle_ventas ──────────────────────────────
        await queryRunner.query(`ALTER TABLE "detalle_ventas" ADD CONSTRAINT "fk_detalle_ventas_venta" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "detalle_ventas" ADD CONSTRAINT "fk_detalle_ventas_producto" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);

        // ── Foreign keys: creditos ────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "creditos" ADD CONSTRAINT "fk_creditos_cliente" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "creditos" ADD CONSTRAINT "fk_creditos_venta" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);

        // ── Foreign keys: abonos ──────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "abonos" ADD CONSTRAINT "fk_abonos_credito" FOREIGN KEY ("credito_id") REFERENCES "creditos"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "abonos" ADD CONSTRAINT "fk_abonos_cliente" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "abonos" ADD CONSTRAINT "fk_abonos_caja" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);

        // ── CHECK constraints: cajas ──────────────────────────────────
        await queryRunner.query(`ALTER TABLE "cajas" ADD CONSTRAINT "chk_cajas_estado" CHECK (estado IN ('abierta', 'cerrada'))`);

        // ── CHECK constraints: ventas ─────────────────────────────────
        await queryRunner.query(`ALTER TABLE "ventas" ADD CONSTRAINT "chk_ventas_forma_pago" CHECK (forma_pago IN ('cash', 'card', 'transfer'))`);
        await queryRunner.query(`ALTER TABLE "ventas" ADD CONSTRAINT "chk_ventas_estado" CHECK (estado IN ('paid', 'pending'))`);
        await queryRunner.query(`ALTER TABLE "ventas" ADD CONSTRAINT "chk_ventas_total_positivo" CHECK (total >= 0)`);

        // ── CHECK constraints: detalle_ventas ─────────────────────────
        await queryRunner.query(`ALTER TABLE "detalle_ventas" ADD CONSTRAINT "chk_detalle_ventas_cantidad_positiva" CHECK (cantidad > 0)`);
        await queryRunner.query(`ALTER TABLE "detalle_ventas" ADD CONSTRAINT "chk_detalle_ventas_precio_positivo" CHECK (precio_unitario >= 0)`);
        await queryRunner.query(`ALTER TABLE "detalle_ventas" ADD CONSTRAINT "chk_detalle_ventas_subtotal_positivo" CHECK (subtotal >= 0)`);

        // ── CHECK constraints: creditos ───────────────────────────────
        await queryRunner.query(`ALTER TABLE "creditos" ADD CONSTRAINT "chk_creditos_estado" CHECK (estado IN ('pending', 'paid'))`);
        await queryRunner.query(`ALTER TABLE "creditos" ADD CONSTRAINT "chk_creditos_monto_positivo" CHECK (monto_total >= 0)`);
        await queryRunner.query(`ALTER TABLE "creditos" ADD CONSTRAINT "chk_creditos_saldo_positivo" CHECK (saldo_pendiente >= 0)`);

        // ── CHECK constraints: abonos ─────────────────────────────────
        await queryRunner.query(`ALTER TABLE "abonos" ADD CONSTRAINT "chk_abonos_monto_positivo" CHECK (monto > 0)`);

        // ── Indexes: cajas ────────────────────────────────────────────
        await queryRunner.query(`CREATE INDEX "idx_cajas_cajero_id" ON "cajas" ("cajero_id")`);
        await queryRunner.query(`CREATE INDEX "idx_cajas_estado" ON "cajas" ("estado")`);
        await queryRunner.query(`CREATE INDEX "idx_cajas_fecha_apertura" ON "cajas" ("fecha_apertura")`);

        // ── Indexes: ventas ───────────────────────────────────────────
        await queryRunner.query(`CREATE INDEX "idx_ventas_caja_id" ON "ventas" ("caja_id")`);
        await queryRunner.query(`CREATE INDEX "idx_ventas_cliente_id" ON "ventas" ("cliente_id")`);
        await queryRunner.query(`CREATE INDEX "idx_ventas_cajero_id" ON "ventas" ("cajero_id")`);
        await queryRunner.query(`CREATE INDEX "idx_ventas_estado" ON "ventas" ("estado")`);
        await queryRunner.query(`CREATE INDEX "idx_ventas_forma_pago" ON "ventas" ("forma_pago")`);
        await queryRunner.query(`CREATE INDEX "idx_ventas_created_at" ON "ventas" ("created_at")`);

        // ── Indexes: detalle_ventas ───────────────────────────────────
        await queryRunner.query(`CREATE INDEX "idx_detalle_ventas_venta_id" ON "detalle_ventas" ("venta_id")`);
        await queryRunner.query(`CREATE INDEX "idx_detalle_ventas_producto_id" ON "detalle_ventas" ("producto_id")`);

        // ── Indexes: creditos ─────────────────────────────────────────
        await queryRunner.query(`CREATE INDEX "idx_creditos_cliente_id" ON "creditos" ("cliente_id")`);
        await queryRunner.query(`CREATE INDEX "idx_creditos_venta_id" ON "creditos" ("venta_id")`);
        await queryRunner.query(`CREATE INDEX "idx_creditos_estado" ON "creditos" ("estado")`);
        await queryRunner.query(`CREATE INDEX "idx_creditos_created_at" ON "creditos" ("created_at")`);

        // ── Indexes: abonos ───────────────────────────────────────────
        await queryRunner.query(`CREATE INDEX "idx_abonos_credito_id" ON "abonos" ("credito_id")`);
        await queryRunner.query(`CREATE INDEX "idx_abonos_cliente_id" ON "abonos" ("cliente_id")`);
        await queryRunner.query(`CREATE INDEX "idx_abonos_caja_id" ON "abonos" ("caja_id")`);
        await queryRunner.query(`CREATE INDEX "idx_abonos_fecha" ON "abonos" ("fecha")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_abonos_fecha"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_abonos_caja_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_abonos_cliente_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_abonos_credito_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_creditos_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_creditos_estado"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_creditos_venta_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_creditos_cliente_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_detalle_ventas_producto_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_detalle_ventas_venta_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_ventas_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_ventas_forma_pago"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_ventas_estado"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_ventas_cajero_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_ventas_cliente_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_ventas_caja_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_cajas_fecha_apertura"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_cajas_estado"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_cajas_cajero_id"`);

        // Drop foreign keys (reverse dependency order)
        await queryRunner.query(`ALTER TABLE "abonos" DROP CONSTRAINT "fk_abonos_caja"`);
        await queryRunner.query(`ALTER TABLE "abonos" DROP CONSTRAINT "fk_abonos_cliente"`);
        await queryRunner.query(`ALTER TABLE "abonos" DROP CONSTRAINT "fk_abonos_credito"`);
        await queryRunner.query(`ALTER TABLE "creditos" DROP CONSTRAINT "fk_creditos_venta"`);
        await queryRunner.query(`ALTER TABLE "creditos" DROP CONSTRAINT "fk_creditos_cliente"`);
        await queryRunner.query(`ALTER TABLE "detalle_ventas" DROP CONSTRAINT "fk_detalle_ventas_producto"`);
        await queryRunner.query(`ALTER TABLE "detalle_ventas" DROP CONSTRAINT "fk_detalle_ventas_venta"`);
        await queryRunner.query(`ALTER TABLE "ventas" DROP CONSTRAINT "fk_ventas_cajero"`);
        await queryRunner.query(`ALTER TABLE "ventas" DROP CONSTRAINT "fk_ventas_cliente"`);
        await queryRunner.query(`ALTER TABLE "ventas" DROP CONSTRAINT "fk_ventas_caja"`);
        await queryRunner.query(`ALTER TABLE "cajas" DROP CONSTRAINT "fk_cajas_cajero"`);

        // Drop tables (reverse dependency order)
        await queryRunner.query(`DROP TABLE "abonos"`);
        await queryRunner.query(`DROP TABLE "creditos"`);
        await queryRunner.query(`DROP TABLE "detalle_ventas"`);
        await queryRunner.query(`DROP TABLE "ventas"`);
        await queryRunner.query(`DROP TABLE "cajas"`);
    }

}
