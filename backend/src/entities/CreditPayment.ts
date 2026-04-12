import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Credit } from './Credit';
import { Customer } from './Customer';
import { CashRegister } from './CashRegister';

const decimalTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => parseFloat(value),
};

@Entity('abonos')
export class CreditPayment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'credito_id', type: 'int' })
  creditId!: number;

  @Column({ name: 'cliente_id', type: 'int' })
  customerId!: number;

  @Column({ name: 'caja_id', type: 'int' })
  cashRegisterId!: number;

  @Column({
    name: 'monto',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount!: number;

  @Column({ name: 'fecha', type: 'timestamp', default: () => 'NOW()' })
  date!: Date;

  @Column({ name: 'notas', type: 'text', nullable: true })
  notes!: string | null;

  @ManyToOne(() => Credit, (credit) => credit.payments, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'credito_id' })
  credit!: Credit;

  @ManyToOne(() => Customer, (customer) => customer.creditPayments, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'cliente_id' })
  customer!: Customer;

  @ManyToOne(() => CashRegister, (register) => register.creditPayments, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'caja_id' })
  cashRegister!: CashRegister;
}
