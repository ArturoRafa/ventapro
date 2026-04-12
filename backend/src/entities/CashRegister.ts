import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

import { User } from './User';
import { Sale } from './Sale';
import { CreditPayment } from './CreditPayment';

const decimalTransformer = {
  to: (value: number | null): number | null => value,
  from: (value: string | null): number | null => (value === null ? null : parseFloat(value)),
};

@Entity('cajas')
export class CashRegister {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'cajero_id', type: 'int' })
  cashierId!: number;

  @Column({
    name: 'monto_inicial',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  initialAmount!: number | null;

  @Column({
    name: 'monto_cierre_real',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  actualCloseAmount!: number | null;

  @Column({
    name: 'monto_cierre_sistema',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  systemCloseAmount!: number | null;

  @Column({
    name: 'diferencia',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  difference!: number | null;

  @Column({
    name: 'estado',
    type: 'varchar',
    length: 10,
    default: 'abierta',
  })
  status!: 'abierta' | 'cerrada';

  @Column({ name: 'fecha_apertura', type: 'timestamp', default: () => 'NOW()' })
  openedAt!: Date;

  @Column({ name: 'fecha_cierre', type: 'timestamp', nullable: true })
  closedAt!: Date | null;

  @Column({ name: 'notas_cierre', type: 'text', nullable: true })
  closingNotes!: string | null;

  @ManyToOne(() => User, (user) => user.cashRegisters, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'cajero_id' })
  cashier!: User;

  @OneToMany(() => Sale, (sale) => sale.cashRegister)
  sales!: Sale[];

  @OneToMany(() => CreditPayment, (payment) => payment.cashRegister)
  creditPayments!: CreditPayment[];
}
