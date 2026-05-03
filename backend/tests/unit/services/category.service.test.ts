jest.mock('@/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}));

import { AppDataSource } from '@/config/database';
import * as categoryService from '@/services/category.service';
import { createMockRepository } from '../../helpers/mock-repository';
import { buildCategory } from '../../helpers/fixtures';

let categoryRepo: ReturnType<typeof createMockRepository>;
let subRepo: ReturnType<typeof createMockRepository>;

beforeEach(() => {
  jest.clearAllMocks();
  categoryRepo = createMockRepository();
  subRepo = createMockRepository();
  (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: { name: string }) => {
    if (entity.name === 'Category') return categoryRepo;
    if (entity.name === 'Subcategory') return subRepo;
    return createMockRepository();
  });
});

describe('category.service', () => {
  describe('findAll', () => {
    it('should filter active categories by default', async () => {
      categoryRepo.find.mockResolvedValue([]);
      await categoryService.findAll();
      expect(categoryRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { status: 'activo' },
      }));
    });

    it('should include inactive when requested', async () => {
      categoryRepo.find.mockResolvedValue([]);
      await categoryService.findAll(true);
      expect(categoryRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: {},
      }));
    });
  });

  describe('findById', () => {
    it('should return category when found', async () => {
      categoryRepo.findOne.mockResolvedValue(buildCategory());
      const result = await categoryService.findById(1);
      expect(result.id).toBe(1);
    });

    it('should throw NOT_FOUND when not found', async () => {
      categoryRepo.findOne.mockResolvedValue(null);
      await expect(categoryService.findById(99)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('create', () => {
    it('should create category with default order', async () => {
      categoryRepo.findOne.mockResolvedValue(null);
      categoryRepo.create.mockReturnValue({ name: 'Drinks', order: 0 });
      categoryRepo.save.mockResolvedValue({ id: 1, name: 'Drinks', order: 0 });

      const result = await categoryService.create({ name: 'Drinks' });
      expect(result.name).toBe('Drinks');
      expect(categoryRepo.create).toHaveBeenCalledWith({ name: 'Drinks', order: 0 });
    });

    it('should throw DUPLICATE_ENTRY when name exists', async () => {
      categoryRepo.findOne.mockResolvedValue(buildCategory());
      await expect(categoryService.create({ name: 'Existing' })).rejects.toMatchObject({ code: 'DUPLICATE_ENTRY' });
    });
  });

  describe('update', () => {
    it('should update category name', async () => {
      categoryRepo.findOne
        .mockResolvedValueOnce(buildCategory({ name: 'Old' }))
        .mockResolvedValueOnce(null); // no conflict
      categoryRepo.save.mockImplementation((c: unknown) => Promise.resolve(c));

      const result = await categoryService.update(1, { name: 'New' });
      expect(result.name).toBe('New');
    });

    it('should throw DUPLICATE_ENTRY when new name conflicts', async () => {
      categoryRepo.findOne
        .mockResolvedValueOnce(buildCategory({ name: 'Old' }))
        .mockResolvedValueOnce(buildCategory({ id: 2, name: 'Taken' }));

      await expect(categoryService.update(1, { name: 'Taken' })).rejects.toMatchObject({ code: 'DUPLICATE_ENTRY' });
    });
  });

  describe('toggleStatus', () => {
    it('should deactivate and cascade to subcategories', async () => {
      categoryRepo.findOne.mockResolvedValue(buildCategory({ status: 'activo' }));
      categoryRepo.save.mockImplementation((c: unknown) => Promise.resolve(c));
      subRepo._qb.execute.mockResolvedValue({ affected: 2 });

      await categoryService.toggleStatus(1);

      expect(subRepo.createQueryBuilder).toHaveBeenCalled();
      expect(subRepo._qb.execute).toHaveBeenCalled();
    });

    it('should reactivate without cascading', async () => {
      categoryRepo.findOne.mockResolvedValue(buildCategory({ status: 'inactivo' }));
      categoryRepo.save.mockImplementation((c: unknown) => Promise.resolve(c));

      await categoryService.toggleStatus(1);

      expect(subRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });
});
