import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { Sale } from './Sale';
import { Credit } from './Credit';
import { CreditPayment } from './CreditPayment';

@Entity('clientes')
export class Customer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'telefono', type: 'varchar', length: 20 })
  phone!: string;

  @Column({ name: 'telefono_alternativo', type: 'varchar', length: 20, nullable: true })
  alternatePhone!: string | null;

  @Column({ name: 'direccion', type: 'text', nullable: true })
  address!: string | null;

  @Column({
    name: 'estado',
    type: 'varchar',
    length: 10,
    default: 'activo',
  })
  status!: 'activo' | 'inactivo';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Sale, (sale) => sale.customer)
  sales!: Sale[];

  @OneToMany(() => Credit, (credit) => credit.customer)
  credits!: Credit[];

  @OneToMany(() => CreditPayment, (payment) => payment.customer)
  creditPayments!: CreditPayment[];
}
