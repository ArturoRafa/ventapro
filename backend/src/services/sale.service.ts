import { In } from 'typeorm';

import { AppDataSource } from '../config/database';
import { Sale } from '../entities/Sale';
import { SaleDetail } from '../entities/SaleDetail';
import { Credit } from '../entities/Credit';
import { Product } from '../entities/Product';
import { CashRegister } from '../entities/CashRegister';
import { Customer } from '../entities/Customer';
import { CreateSaleDto } from '../dtos/sale.dto';
import { Errors } from '../utils/AppError';

const repo = () => AppDataSource.getRepository(Sale);

interface SaleFilters {
  page?: number;
  limit?: number;
  cashRegisterId?: number;
  cashierId?: number;
  paymentMethod?: 'cash' | 'card' | 'transfer';
  status?: 'paid' | 'pending';
  from?: string;
  to?: string;
}

function stripCashierPassword(sale: Sale): Sale {
  if (sale.cashier) {
    delete (sale.cashier as unknown as Record<string, unknown>).passwordHash;
  }
  return sale;
}

export async function create(cashierId: number, dto: CreateSaleDto): Promise<Sale> {
  const runner = AppDataSource.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();

  let savedSaleId: number;

  try {
    // 1. Verify open cash register
    const register = await runner.manager.findOne(CashRegister, {
      where: { cashierId, status: 'abierta' },
    });
    if (!register) throw Errors.cashRegisterClosed();

    // 2. Verify customer exists if provided
    if (dto.customerId) {
      const customer = await runner.manager.findOne(Customer, {
        where: { id: dto.customerId },
      });
      if (!customer) throw Errors.notFound(`Customer ${dto.customerId} not found`);
    }

    // 3. Load all products in one query
    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await runner.manager.find(Product, {
      where: { id: In(productIds) },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Verify all products exist
    for (const pid of productIds) {
      if (!productMap.has(pid)) {
        throw Errors.notFound(`Product ${pid} not found`);
      }
    }

    // 4. Aggregate quantities per product (handle duplicates in items)
    const quantityByProduct = new Map<number, number>();
    for (const item of dto.items) {
      const current = quantityByProduct.get(item.productId) ?? 0;
      quantityByProduct.set(item.productId, current + item.quantity);
    }

    // 5-6. Validate each product: active + stock
    for (const [productId, totalQty] of quantityByProduct) {
      const product = productMap.get(productId)!;
      if (product.status === 'inactivo') {
        throw Errors.inactiveProduct(product.name);
      }
      if (product.type === 'inventory' && product.stock < totalQty) {
        throw Errors.insufficientStock(product.name, product.stock, totalQty);
      }
    }

    // 7. Calculate total
    let total = 0;
    for (const item of dto.items) {
      const product = productMap.get(item.productId)!;
      total += product.price * item.quantity;
    }
    total = Math.round(total * 100) / 100;

    // 8. Create Sale
    const sale = runner.manager.create(Sale, {
      cashRegisterId: register.id,
      cashierId,
      customerId: dto.customerId ?? null,
      total,
      paymentMethod: dto.paymentMethod,
      status: dto.status,
    });
    const savedSale = await runner.manager.save(sale);
    savedSaleId = savedSale.id;

    // 9. Create SaleDetails
    const details = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      return runner.manager.create(SaleDetail, {
        saleId: savedSale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: Math.round(product.price * item.quantity * 100) / 100,
      });
    });
    await runner.manager.save(details);

    // 10. Decrement stock for inventory products
    for (const [productId, totalQty] of quantityByProduct) {
      const product = productMap.get(productId)!;
      if (product.type === 'inventory') {
        await runner.manager.decrement(Product, { id: productId }, 'stock', totalQty);
      }
    }

    // 11. Create Credit if pending (credit sale)
    if (dto.status === 'pending') {
      const credit = runner.manager.create(Credit, {
        customerId: dto.customerId!,
        saleId: savedSale.id,
        totalAmount: total,
        pendingBalance: total,
        status: 'pending',
      });
      await runner.manager.save(credit);
    }

    // 12. Commit
    await runner.commitTransaction();
  } catch (error) {
    await runner.rollbackTransaction();
    throw error;
  } finally {
    await runner.release();
  }

  // Re-fetch with all relations after commit
  const completeSale = await repo().findOne({
    where: { id: savedSaleId },
    relations: ['details', 'details.product', 'cashier', 'customer', 'credit'],
  });

  return stripCashierPassword(completeSale!);
}

export async function findAll(
  filters: SaleFilters = {},
): Promise<{ data: Sale[]; meta: { total: number; page: number; limit: number } }> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const skip = (page - 1) * limit;

  const qb = repo()
    .createQueryBuilder('s')
    .leftJoinAndSelect('s.cashier', 'cashier')
    .leftJoinAndSelect('s.customer', 'customer')
    .orderBy('s.createdAt', 'DESC');

  if (filters.cashRegisterId) {
    qb.andWhere('s.cashRegisterId = :cashRegisterId', { cashRegisterId: filters.cashRegisterId });
  }
  if (filters.cashierId) {
    qb.andWhere('s.cashierId = :cashierId', { cashierId: filters.cashierId });
  }
  if (filters.paymentMethod) {
    qb.andWhere('s.paymentMethod = :paymentMethod', { paymentMethod: filters.paymentMethod });
  }
  if (filters.status) {
    qb.andWhere('s.status = :status', { status: filters.status });
  }
  if (filters.from) {
    qb.andWhere('s.createdAt >= :from', { from: filters.from });
  }
  if (filters.to) {
    qb.andWhere('s.createdAt <= :to', { to: filters.to });
  }

  const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
  data.forEach(stripCashierPassword);
  return { data, meta: { total, page, limit } };
}

export async function findById(id: number): Promise<Sale> {
  const sale = await repo().findOne({
    where: { id },
    relations: ['details', 'details.product', 'cashier', 'customer', 'credit'],
  });
  if (!sale) throw Errors.notFound(`Sale ${id} not found`);
  return stripCashierPassword(sale);
}
