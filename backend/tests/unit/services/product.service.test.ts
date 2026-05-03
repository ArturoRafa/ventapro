jest.mock('@/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}));

import { AppDataSource } from '@/config/database';
import * as productService from '@/services/product.service';
import { createMockRepository } from '../../helpers/mock-repository';
import { buildProduct, buildSubcategory } from '../../helpers/fixtures';

let productRepo: ReturnType<typeof createMockRepository>;
let subRepo: ReturnType<typeof createMockRepository>;

beforeEach(() => {
  jest.clearAllMocks();
  productRepo = createMockRepository();
  subRepo = createMockRepository();
  (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: { name: string }) => {
    if (entity.name === 'Product') return productRepo;
    if (entity.name === 'Subcategory') return subRepo;
    return createMockRepository();
  });
});

describe('product.service', () => {
  describe('findAll', () => {
    it('should apply default pagination and active status', async () => {
      productRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);
      await productService.findAll();
      expect(productRepo._qb.andWhere).toHaveBeenCalledWith('p.status = :status', { status: 'activo' });
      expect(productRepo._qb.skip).toHaveBeenCalledWith(0);
      expect(productRepo._qb.take).toHaveBeenCalledWith(20);
    });

    it('should clamp pagination values', async () => {
      productRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);
      await productService.findAll({ page: -5, limit: 200 });
      expect(productRepo._qb.skip).toHaveBeenCalledWith(0);
      expect(productRepo._qb.take).toHaveBeenCalledWith(100);
    });
  });

  describe('findById', () => {
    it('should return product when found', async () => {
      const product = buildProduct();
      productRepo.findOne.mockResolvedValue(product);
      const result = await productService.findById(1);
      expect(result).toEqual(product);
    });

    it('should throw NOT_FOUND when not found', async () => {
      productRepo.findOne.mockResolvedValue(null);
      await expect(productService.findById(99)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('create', () => {
    const dto = { code: 'P001', name: 'Coffee', subcategoryId: 1, type: 'inventory' as const, price: 5000, stock: 10, minStock: 2 };

    it('should create product when code is unique and subcategory is active', async () => {
      productRepo.findOne.mockResolvedValue(null);
      subRepo.findOne.mockResolvedValue(buildSubcategory());
      productRepo.create.mockReturnValue(dto);
      productRepo.save.mockResolvedValue({ id: 1, ...dto });

      const result = await productService.create(dto);
      expect(result).toHaveProperty('id');
      expect(productRepo.save).toHaveBeenCalled();
    });

    it('should throw DUPLICATE_ENTRY when code exists', async () => {
      productRepo.findOne.mockResolvedValue(buildProduct());
      await expect(productService.create(dto)).rejects.toMatchObject({ code: 'DUPLICATE_ENTRY' });
    });

    it('should throw NOT_FOUND when subcategory does not exist', async () => {
      productRepo.findOne.mockResolvedValue(null);
      subRepo.findOne.mockResolvedValue(null);
      await expect(productService.create(dto)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('should throw VALIDATION_ERROR when subcategory is inactive', async () => {
      productRepo.findOne.mockResolvedValue(null);
      subRepo.findOne.mockResolvedValue(buildSubcategory({ status: 'inactivo' }));
      await expect(productService.create(dto)).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    });
  });

  describe('update', () => {
    it('should update product successfully', async () => {
      const product = buildProduct();
      productRepo.findOne.mockResolvedValue(product);
      productRepo.save.mockResolvedValue({ ...product, name: 'Updated' });

      const result = await productService.update(1, { name: 'Updated' });
      expect(productRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated');
    });

    it('should throw DUPLICATE_ENTRY when updating to existing code', async () => {
      productRepo.findOne
        .mockResolvedValueOnce(buildProduct({ code: 'OLD' }))
        .mockResolvedValueOnce(buildProduct({ id: 2, code: 'NEW' }));

      await expect(productService.update(1, { code: 'NEW' })).rejects.toMatchObject({ code: 'DUPLICATE_ENTRY' });
    });
  });

  describe('toggleStatus', () => {
    it('should toggle active to inactive', async () => {
      const product = buildProduct({ status: 'activo' });
      productRepo.findOne.mockResolvedValue(product);
      productRepo.save.mockImplementation((p: Record<string, unknown>) => Promise.resolve(p));

      const result = await productService.toggleStatus(1);
      expect(result.status).toBe('inactivo');
    });

    it('should toggle inactive to active', async () => {
      const product = buildProduct({ status: 'inactivo' });
      productRepo.findOne.mockResolvedValue(product);
      productRepo.save.mockImplementation((p: Record<string, unknown>) => Promise.resolve(p));

      const result = await productService.toggleStatus(1);
      expect(result.status).toBe('activo');
    });
  });

  describe('getLowStockProducts', () => {
    it('should query for inventory products with low stock', async () => {
      productRepo._qb.getMany.mockResolvedValue([]);
      await productService.getLowStockProducts();
      expect(productRepo._qb.where).toHaveBeenCalledWith('p.type = :type', { type: 'inventory' });
      expect(productRepo._qb.andWhere).toHaveBeenCalledWith('p.status = :status', { status: 'activo' });
      expect(productRepo._qb.andWhere).toHaveBeenCalledWith('p.stock <= p.minStock');
    });
  });
});
