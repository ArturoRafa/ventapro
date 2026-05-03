import { AppDataSource } from '../config/database';
import { Subcategory } from '../entities/Subcategory';
import { Category } from '../entities/Category';
import { Product } from '../entities/Product';
import { CreateSubcategoryDto, UpdateSubcategoryDto } from '../dtos/category.dto';
import { Errors } from '../utils/AppError';

const repo = () => AppDataSource.getRepository(Subcategory);
const catRepo = () => AppDataSource.getRepository(Category);
const prodRepo = () => AppDataSource.getRepository(Product);

export async function findAll(categoryId?: number, includeInactive = false): Promise<Subcategory[]> {
  const qb = repo()
    .createQueryBuilder('sub')
    .leftJoinAndSelect('sub.category', 'cat')
    .orderBy('sub.order', 'ASC')
    .addOrderBy('sub.name', 'ASC');

  if (categoryId) {
    qb.where('sub.categoryId = :categoryId', { categoryId });
  }
  if (!includeInactive) {
    qb.andWhere('sub.status = :status', { status: 'activo' });
  }

  return qb.getMany();
}

export async function findById(id: number): Promise<Subcategory> {
  const sub = await repo().findOne({
    where: { id },
    relations: ['category'],
  });
  if (!sub) throw Errors.notFound(`Subcategory ${id} not found`);
  return sub;
}

export async function create(dto: CreateSubcategoryDto): Promise<Subcategory> {
  const category = await catRepo().findOne({ where: { id: dto.categoryId } });
  if (!category) throw Errors.notFound(`Category ${dto.categoryId} not found`);
  if (category.status === 'inactivo') throw Errors.validation('Cannot add subcategory to inactive category');

  const existing = await repo().findOne({
    where: { categoryId: dto.categoryId, name: dto.name },
  });
  if (existing) throw Errors.conflict('Subcategory name already exists in this category');

  const sub = repo().create({
    categoryId: dto.categoryId,
    name: dto.name,
    order: dto.order ?? 0,
  });
  return repo().save(sub);
}

export async function update(id: number, dto: UpdateSubcategoryDto): Promise<Subcategory> {
  const sub = await findById(id);

  if (dto.categoryId && dto.categoryId !== sub.categoryId) {
    const cat = await catRepo().findOne({ where: { id: dto.categoryId } });
    if (!cat) throw Errors.notFound(`Category ${dto.categoryId} not found`);
  }

  const targetCategoryId = dto.categoryId ?? sub.categoryId;
  const targetName = dto.name ?? sub.name;

  if (dto.name || dto.categoryId) {
    const existing = await repo().findOne({
      where: { categoryId: targetCategoryId, name: targetName },
    });
    if (existing && existing.id !== id) {
      throw Errors.conflict('Subcategory name already exists in this category');
    }
  }

  Object.assign(sub, dto);
  return repo().save(sub);
}

export async function toggleStatus(id: number): Promise<Subcategory> {
  const sub = await findById(id);
  sub.status = sub.status === 'activo' ? 'inactivo' : 'activo';
  return repo().save(sub);
}

export async function remove(id: number): Promise<void> {
  const productCount = await prodRepo().count({ where: { subcategoryId: id } });
  if (productCount > 0) {
    throw Errors.conflict('Cannot delete subcategory with associated products. Deactivate it instead.');
  }
  await repo().delete(id);
}
