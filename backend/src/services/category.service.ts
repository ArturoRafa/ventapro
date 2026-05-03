import { AppDataSource } from '../config/database';
import { Category } from '../entities/Category';
import { Subcategory } from '../entities/Subcategory';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { Errors } from '../utils/AppError';

const repo = () => AppDataSource.getRepository(Category);
const subRepo = () => AppDataSource.getRepository(Subcategory);

export async function findAll(includeInactive = false): Promise<Category[]> {
  const where = includeInactive ? {} : { status: 'activo' as const };
  return repo().find({
    where,
    order: { order: 'ASC', name: 'ASC' },
    relations: ['subcategories'],
  });
}

export async function findById(id: number): Promise<Category> {
  const category = await repo().findOne({
    where: { id },
    relations: ['subcategories'],
  });
  if (!category) throw Errors.notFound(`Category ${id} not found`);
  return category;
}

export async function create(dto: CreateCategoryDto): Promise<Category> {
  const existing = await repo().findOne({ where: { name: dto.name } });
  if (existing) throw Errors.conflict('Category name already exists');

  const category = repo().create({
    name: dto.name,
    order: dto.order ?? 0,
  });
  return repo().save(category);
}

export async function update(id: number, dto: UpdateCategoryDto): Promise<Category> {
  const category = await findById(id);

  if (dto.name && dto.name !== category.name) {
    const existing = await repo().findOne({ where: { name: dto.name } });
    if (existing) throw Errors.conflict('Category name already exists');
  }

  Object.assign(category, dto);
  return repo().save(category);
}

export async function toggleStatus(id: number): Promise<Category> {
  const category = await findById(id);
  const newStatus = category.status === 'activo' ? 'inactivo' : 'activo';

  category.status = newStatus;
  await repo().save(category);

  // Cascade: deactivating a category deactivates all subcategories
  if (newStatus === 'inactivo') {
    await subRepo()
      .createQueryBuilder()
      .update(Subcategory)
      .set({ status: 'inactivo' })
      .where('categoryId = :id', { id })
      .execute();
  }

  return findById(id);
}
