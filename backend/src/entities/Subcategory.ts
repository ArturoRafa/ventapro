import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';

import { Category } from './Category';
import { Product } from './Product';

@Entity('subcategorias')
@Unique('uq_subcategorias_categoria_nombre', ['categoryId', 'name'])
export class Subcategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'categoria_id', type: 'int' })
  categoryId!: number;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  name!: string;

  @Column({
    name: 'estado',
    type: 'varchar',
    length: 10,
    default: 'activo',
  })
  status!: 'activo' | 'inactivo';

  @Column({ name: 'orden', type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => Category, (cat) => cat.subcategories, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'categoria_id' })
  category!: Category;

  @OneToMany(() => Product, (prod) => prod.subcategory)
  products!: Product[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
