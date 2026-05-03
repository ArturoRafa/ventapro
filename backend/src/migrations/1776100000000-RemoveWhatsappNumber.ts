import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveWhatsappNumber1776100000000 implements MigrationInterface {
    name = 'RemoveWhatsappNumber1776100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "configuracion_negocio" DROP COLUMN IF EXISTS "numero_whatsapp"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "configuracion_negocio" ADD COLUMN "numero_whatsapp" character varying(20)`);
    }
}
