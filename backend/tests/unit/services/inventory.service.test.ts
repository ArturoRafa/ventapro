jest.mock('@/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}));

import { AppDataSource } from '@/config/database';
import * as inventoryService from '@/services/inventory.service';
import { createMockRepository } from '../../helpers/mock-repository';
import { buildProduct } from '../../helpers/fixtures';

let productRepo: ReturnType<typeof createMockRepository>;

beforeEach(() => {
  jest.clearAllMocks();
  productRepo = createMockRepository();
  (AppDataSource.getRepository as jest.Mock).mockReturnValue(productRepo);
});

describe('inventory.service', () => {
  describe('getStockView', () => {
    it('should apply default filters for inventory products', async () => {
      productRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);
      await inventoryService.getStockView();
      expect(productRepo._qb.where).toHaveBeenCalledWith('p.type = :type', { type: 'inventory' });
      expect(productRepo._qb.andWhere).toHaveBeenCalledWith('p.status = :status', { status: 'activo' });
    });

    it('should apply search filter', async () => {
      productRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);
      await inventoryService.getStockView({ search: 'coffee' });
      expect(productRepo._qb.andWhere).toHaveBeenCalledWith(
        '(p.name ILIKE :search OR p.code ILIKE :search)',
        { search: '%coffee%' },
      );
    });

    it('should apply lowStockOnly filter', async () => {
      productRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);
      await inventoryService.getStockView({ lowStockOnly: true });
      expect(productRepo._qb.andWhere).toHaveBeenCalledWith('p.stock <= p.minStock');
    });
  });

  describe('adjustStock', () => {
    it('should add stock with positive adjustment', async () => {
      const product = buildProduct({ stock: 10, type: 'inventory' });
      productRepo.findOne.mockResolvedValue(product);
      productRepo.save.mockImplementation((p: unknown) => Promise.resolve(p));

      const result = await inventoryService.adjustStock(1, { adjustment: 5 });
      expect(result.stock).toBe(15);
    });

    it('should subtract stock with negative adjustment', async () => {
      const product = buildProduct({ stock: 10, type: 'inventory' });
      productRepo.findOne.mockResolvedValue(product);
      productRepo.save.mockImplementation((p: unknown) => Promise.resolve(p));

      const result = await inventoryService.adjustStock(1, { adjustment: -3 });
      expect(result.stock).toBe(7);
    });

    it('should throw NOT_FOUND when product not found', async () => {
      productRepo.findOne.mockResolvedValue(null);
      await expect(inventoryService.adjustStock(99, { adjustment: 5 }))
        .rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('should throw VALIDATION_ERROR for non-inventory product', async () => {
      productRepo.findOne.mockResolvedValue(buildProduct({ type: 'food' }));
      await expect(inventoryService.adjustStock(1, { adjustment: 5 }))
        .rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    });

    it('should throw VALIDATION_ERROR when result would be negative', async () => {
      productRepo.findOne.mockResolvedValue(buildProduct({ stock: 3, type: 'inventory' }));
      await expect(inventoryService.adjustStock(1, { adjustment: -5 }))
        .rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    });
  });
});
