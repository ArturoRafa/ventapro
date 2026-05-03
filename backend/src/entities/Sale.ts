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

import { CashRegister } from './CashRegister';
import { Customer } from './Customer';
import { User } from './User';
import { SaleDetail } from './SaleDetail';
import { Credit } from './Credit';

const decimalTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => parseFloat(value),
};

@Entity('ventas')
export class Sale {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'caja_id', type: 'int' })
  cashRegisterId!: number;

  @Column({ name: 'cliente_id', type: 'int', nullable: true })
  customerId!: number | null;

  @Column({ name: 'cajero_id', type: 'int' })
  cashierId!: number;

  @Column({
    name: 'total',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  total!: number;

  @Column({ name: 'forma_pago', type: 'varchar', length: 15 })
  paymentMethod!: 'cash' | 'card' | 'transfer';

  @Column({
    name: 'estado',
    type: 'varchar',
    length: 10,
    default: 'paid',
  })
  status!: 'paid' | 'pending';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => CashRegister, (register) => register.sales, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'caja_id' })
  cashRegister!: CashRegister;

  @ManyToOne(() => Customer, (customer) => customer.sales, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'cliente_id' })
  customer!: Customer | null;

  @ManyToOne(() => User, (user) => user.sales, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'cajero_id' })
  cashier!: User;

  @OneToMany(() => SaleDetail, (detail) => detail.sale)
  details!: SaleDetail[];

  @OneToOne(() => Credit, (credit) => credit.sale)
  credit!: Credit | null;
}
