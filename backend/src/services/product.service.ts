import { AppDataSource } from '../config/database';
import { Product } from '../entities/Product';
import { Subcategory } from '../entities/Subcategory';
import { CreateProductDto, UpdateProductDto } from '../dtos/product.dto';
import { Errors } from '../utils/AppError';

const repo = () => AppDataSource.getRepository(Product);
const subRepo = () => AppDataSource.getRepository(Subcategory);

interface ProductFilters {
  page?: number;
  limit?: number;
  subcategoryId?: number;
  type?: 'inventory' | 'food';
  status?: 'activo' | 'inactivo';
  search?: string;
}

export async function findAll(filters: ProductFilters = {}): Promise<{ data: Product[]; meta: { total: number; page: number; limit: number } }> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const skip = (page - 1) * limit;

  const qb = repo()
    .createQueryBuilder('p')
    .leftJoinAndSelect('p.subcategory', 'sub')
    .leftJoinAndSelect('sub.category', 'cat')
    .orderBy('p.name', 'ASC');

  if (filters.subcategoryId) {
    qb.andWhere('p.subcategoryId = :subId', { subId: filters.subcategoryId });
  }
  if (filters.type) {
    qb.andWhere('p.type = :type', { type: filters.type });
  }
  if (filters.status) {
    qb.andWhere('p.status = :status', { status: filters.status });
  } else {
    qb.andWhere('p.status = :status', { status: 'activo' });
  }
  if (filters.search) {
    qb.andWhere('(p.name ILIKE :search OR p.code ILIKE :search)', { search: `%${filters.search}%` });
  }

  const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
  return { data, meta: { total, page, limit } };
}

export async function findById(id: number): Promise<Product> {
  const product = await repo().findOne({
    where: { id },
    relations: ['subcategory', 'subcategory.category'],
  });
  if (!product) throw Errors.notFound(`Product ${id} not found`);
  return product;
}

export async function create(dto: CreateProductDto): Promise<Product> {
  const existingCode = await repo().findOne({ where: { code: dto.code } });
  if (existingCode) throw Errors.conflict('Product code already exists');

  const sub = await subRepo().findOne({ where: { id: dto.subcategoryId } });
  if (!sub) throw Errors.notFound(`Subcategory ${dto.subcategoryId} not found`);
  if (sub.status === 'inactivo') throw Errors.validation('Cannot assign product to inactive subcategory');

  const product = repo().create(dto);
  return repo().save(product);
}

export async function update(id: number, dto: UpdateProductDto): Promise<Product> {
  const product = await findById(id);

  if (dto.code && dto.code !== product.code) {
    const existing = await repo().findOne({ where: { code: dto.code } });
    if (existing) throw Errors.conflict('Product code already exists');
  }

  if (dto.subcategoryId && dto.subcategoryId !== product.subcategoryId) {
    const sub = await subRepo().findOne({ where: { id: dto.subcategoryId } });
    if (!sub) throw Errors.notFound(`Subcategory ${dto.subcategoryId} not found`);
    if (sub.status === 'inactivo') throw Errors.validation('Cannot assign product to inactive subcategory');
  }

  Object.assign(product, dto);
  return repo().save(product);
}

export async function toggleStatus(id: number): Promise<Product> {
  const product = await findById(id);
  product.status = product.status === 'activo' ? 'inactivo' : 'activo';
  return repo().save(product);
}

export async function getLowStockProducts(): Promise<Product[]> {
  return repo()
    .createQueryBuilder('p')
    .leftJoinAndSelect('p.subcategory', 'sub')
    .leftJoinAndSelect('sub.category', 'cat')
    .where('p.type = :type', { type: 'inventory' })
    .andWhere('p.status = :status', { status: 'activo' })
    .andWhere('p.stock <= p.minStock')
    .orderBy('p.stock', 'ASC')
    .getMany();
}
