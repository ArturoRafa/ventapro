import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Subcategory } from './Subcategory';

const decimalTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => parseFloat(value),
};

@Entity('productos')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'codigo', type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'subcategoria_id', type: 'int' })
  subcategoryId!: number;

  @Column({
    name: 'tipo',
    type: 'varchar',
    length: 10,
    default: 'inventory',
  })
  type!: 'inventory' | 'food';

  @Column({
    name: 'precio',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  price!: number;

  @Column({ name: 'stock', type: 'int', default: 0 })
  stock!: number;

  @Column({ name: 'stock_minimo', type: 'int', default: 0 })
  minStock!: number;

  @Column({
    name: 'estado',
    type: 'varchar',
    length: 10,
    default: 'activo',
  })
  status!: 'activo' | 'inactivo';

  @ManyToOne(() => Subcategory, (sub) => sub.products, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'subcategoria_id' })
  subcategory!: Subcategory;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
