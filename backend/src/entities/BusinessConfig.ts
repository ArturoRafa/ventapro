import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('configuracion_negocio')
export class BusinessConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'nombre_negocio', type: 'varchar', length: 100, default: 'Cafeteria El Buen Sabor' })
  businessName!: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl!: string | null;

  @Column({ name: 'color_primario', type: 'varchar', length: 7, default: '#1B5E20' })
  primaryColor!: string;

  @Column({ name: 'color_secundario', type: 'varchar', length: 7, default: '#FF6F00' })
  secondaryColor!: string;

  @Column({ name: 'telefono_negocio', type: 'varchar', length: 20, nullable: true })
  businessPhone!: string | null;

  @Column({ name: 'direccion_negocio', type: 'text', nullable: true })
  businessAddress!: string | null;

  @Column({ name: 'moneda', type: 'varchar', length: 3, default: 'COP' })
  currency!: string;

  @Column({ name: 'simbolo_moneda', type: 'varchar', length: 5, default: '$' })
  currencySymbol!: string;

  @Column({
    name: 'impuesto_porcentaje',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
  })
  taxPercentage!: number;

  @Column({ name: 'usa_fiado', type: 'boolean', default: true })
  usesCredit!: boolean;

  @Column({ name: 'usa_comidas', type: 'boolean', default: true })
  usesFood!: boolean;

  @Column({ name: 'usa_control_caja', type: 'boolean', default: true })
  usesCashRegister!: boolean;

  @Column({ name: 'usa_whatsapp', type: 'boolean', default: true })
  usesWhatsapp!: boolean;

  @Column({ name: 'usa_reportes', type: 'boolean', default: true })
  usesReports!: boolean;

  @Column({ name: 'usa_tickets_pdf', type: 'boolean', default: true })
  usesTicketsPdf!: boolean;

  @Column({ name: 'requiere_monto_apertura', type: 'boolean', default: false })
  requiresOpeningAmount!: boolean;

}
