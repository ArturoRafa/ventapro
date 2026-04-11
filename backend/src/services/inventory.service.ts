import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';
import { AdjustStockDto } from '../dtos/product.dto';
import { Errors } from '../utils/AppError';

const repo = () => AppDataSource.getRepository(Product);

interface StockFilters {
  page?: number;
  limit?: number;
  search?: string;
  lowStockOnly?: boolean;
}

export async function getStockView(filters: StockFilters = {}): Promise<{ data: Product[]; meta: { total: number; page: number; limit: number } }> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const qb = repo()
    .createQueryBuilder('p')
    .leftJoinAndSelect('p.subcategory', 'sub')
    .leftJoinAndSelect('sub.category', 'cat')
    .where('p.type = :type', { type: 'inventory' })
    .andWhere('p.status = :status', { status: 'activo' })
    .orderBy('p.stock', 'ASC');

  if (filters.search) {
    qb.andWhere('(p.name ILIKE :search OR p.code ILIKE :search)', { search: `%${filters.search}%` });
  }
  if (filters.lowStockOnly) {
    qb.andWhere('p.stock <= p.minStock');
  }

  const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
  return { data, meta: { total, page, limit } };
}

export async function adjustStock(productId: number, dto: AdjustStockDto): Promise<Product> {
  const product = await repo().findOne({
    where: { id: productId },
    relations: ['subcategory', 'subcategory.category'],
  });
  if (!product) throw Errors.notFound(`Product ${productId} not found`);
  if (product.type !== 'inventory') throw Errors.validation('Stock adjustment only applies to inventory products');

  const newStock = product.stock + dto.adjustment;
  if (newStock < 0) {
    throw Errors.validation(`Adjustment would result in negative stock (current: ${product.stock}, adjustment: ${dto.adjustment})`);
  }

  product.stock = newStock;
  return repo().save(product);
}
