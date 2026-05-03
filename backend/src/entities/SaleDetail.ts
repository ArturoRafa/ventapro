import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Sale } from './Sale';
import { Product } from './Product';

const decimalTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => parseFloat(value),
};

@Entity('detalle_ventas')
export class SaleDetail {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'venta_id', type: 'int' })
  saleId!: number;

  @Column({ name: 'producto_id', type: 'int' })
  productId!: number;

  @Column({ name: 'cantidad', type: 'int' })
  quantity!: number;

  @Column({
    name: 'precio_unitario',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  unitPrice!: number;

  @Column({
    name: 'subtotal',
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  subtotal!: number;

  @ManyToOne(() => Sale, (sale) => sale.details, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'venta_id' })
  sale!: Sale;

  @ManyToOne(() => Product, (product) => product.saleDetails, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'producto_id' })
  product!: Product;
}
