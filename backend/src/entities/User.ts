import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { CashRegister } from './CashRegister';
import { Sale } from './Sale';

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'email', type: 'varchar', length: 150, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({
    name: 'rol',
    type: 'varchar',
    length: 10,
    default: 'cashier',
  })
  role!: 'admin' | 'cashier';

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

  @OneToMany(() => CashRegister, (register) => register.cashier)
  cashRegisters!: CashRegister[];

  @OneToMany(() => Sale, (sale) => sale.cashier)
  sales!: Sale[];
}
