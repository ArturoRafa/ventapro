import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { Customer } from './Customer';
import { Sale } from './Sale';
import { CreditPayment } from './CreditPayment';

const decimalTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => parseFloat(value),
};

@Entity('creditos')
export class Credit {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'cliente_id', type: 'int' })
  customerId!: number;

  @Column({ name: 'venta_id', type: 'int' })
  saleId!: number;

  @Column({
    name: 'monto_total',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  totalAmount!: number;

  @Column({
    name: 'saldo_pendiente',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  pendingBalance!: number;

  @Column({
    name: 'estado',
    type: 'varchar',
    length: 10,
    default: 'pending',
  })
  status!: 'pending' | 'paid';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Customer, (customer) => customer.credits, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'cliente_id' })
  customer!: Customer;

  @OneToOne(() => Sale, (sale) => sale.credit, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'venta_id' })
  sale!: Sale;

  @OneToMany(() => CreditPayment, (payment) => payment.credit)
  payments!: CreditPayment[];
}
