jest.mock('@/config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    createQueryRunner: jest.fn(),
  },
}));

import { AppDataSource } from '@/config/database';
import * as saleService from '@/services/sale.service';
import { createMockRepository, createMockQueryRunner } from '../../helpers/mock-repository';
import { buildProduct, buildCashRegister, buildCustomer, buildSale } from '../../helpers/fixtures';

let saleRepo: ReturnType<typeof createMockRepository>;
let mockRunner: ReturnType<typeof createMockQueryRunner>;

beforeEach(() => {
  jest.clearAllMocks();
  saleRepo = createMockRepository();
  mockRunner = createMockQueryRunner();
  (AppDataSource.getRepository as jest.Mock).mockReturnValue(saleRepo);
  (AppDataSource.createQueryRunner as jest.Mock).mockReturnValue(mockRunner);
});

describe('sale.service', () => {
  const cashierId = 1;
  const baseDto = {
    items: [{ productId: 1, quantity: 2 }],
    paymentMethod: 'cash' as const,
    status: 'paid' as const,
  };

  describe('create', () => {
    function setupSuccessScenario(productOverrides = {}) {
      const register = buildCashRegister();
      const product = buildProduct({ id: 1, price: 1500, stock: 50, ...productOverrides });

      mockRunner.manager.findOne
        .mockResolvedValueOnce(register)   // CashRegister
        .mockResolvedValueOnce(undefined); // Customer (not needed for cash)
      mockRunner.manager.find.mockResolvedValue([product]);
      mockRunner.manager.save
        .mockResolvedValueOnce({ id: 10, ...baseDto, total: 3000 })  // Sale
        .mockResolvedValueOnce([{}]);  // SaleDetails

      saleRepo.findOne.mockResolvedValue(buildSale({ id: 10, total: 3000 }));
    }

    it('should create a sale and commit transaction', async () => {
      setupSuccessScenario();
      const result = await saleService.create(cashierId, baseDto);
      expect(mockRunner.commitTransaction).toHaveBeenCalled();
      expect(mockRunner.release).toHaveBeenCalled();
      expect(result.id).toBe(10);
    });

    it('should rollback when no open cash register', async () => {
      mockRunner.manager.findOne.mockResolvedValueOnce(null);
      await expect(saleService.create(cashierId, baseDto)).rejects.toMatchObject({ code: 'CASH_REGISTER_CLOSED' });
      expect(mockRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockRunner.release).toHaveBeenCalled();
    });

    it('should rollback when customer not found', async () => {
      mockRunner.manager.findOne
        .mockResolvedValueOnce(buildCashRegister())
        .mockResolvedValueOnce(null);

      const dto = { ...baseDto, customerId: 99, status: 'pending' as const };
      await expect(saleService.create(cashierId, dto)).rejects.toMatchObject({ code: 'NOT_FOUND' });
      expect(mockRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should rollback when product not found', async () => {
      mockRunner.manager.findOne.mockResolvedValueOnce(buildCashRegister());
      mockRunner.manager.find.mockResolvedValue([]);

      await expect(saleService.create(cashierId, baseDto)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('should rollback when product is inactive', async () => {
      mockRunner.manager.findOne.mockResolvedValueOnce(buildCashRegister());
      mockRunner.manager.find.mockResolvedValue([buildProduct({ id: 1, status: 'inactivo' })]);

      await expect(saleService.create(cashierId, baseDto)).rejects.toMatchObject({ code: 'INACTIVE_PRODUCT' });
    });

    it('should rollback when insufficient stock for inventory product', async () => {
      mockRunner.manager.findOne.mockResolvedValueOnce(buildCashRegister());
      mockRunner.manager.find.mockResolvedValue([buildProduct({ id: 1, stock: 1, type: 'inventory' })]);

      await expect(saleService.create(cashierId, baseDto)).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });
    });

    it('should skip stock check for food products', async () => {
      setupSuccessScenario({ type: 'food', stock: 0 });
      const result = await saleService.create(cashierId, baseDto);
      expect(result).toBeDefined();
      expect(mockRunner.manager.decrement).not.toHaveBeenCalled();
    });

    it('should aggregate duplicate product quantities', async () => {
      const dto = {
        ...baseDto,
        items: [
          { productId: 1, quantity: 3 },
          { productId: 1, quantity: 2 },
        ],
      };

      mockRunner.manager.findOne.mockResolvedValueOnce(buildCashRegister());
      mockRunner.manager.find.mockResolvedValue([buildProduct({ id: 1, price: 1000, stock: 100 })]);
      mockRunner.manager.save
        .mockResolvedValueOnce({ id: 11 })
        .mockResolvedValueOnce([{}]);
      saleRepo.findOne.mockResolvedValue(buildSale({ id: 11 }));

      await saleService.create(cashierId, dto);

      expect(mockRunner.manager.decrement).toHaveBeenCalledWith(
        expect.anything(), { id: 1 }, 'stock', 5,
      );
    });

    it('should create credit record when status is pending', async () => {
      const dto = { ...baseDto, status: 'pending' as const, customerId: 1 };
      mockRunner.manager.findOne
        .mockResolvedValueOnce(buildCashRegister())
        .mockResolvedValueOnce(buildCustomer());
      mockRunner.manager.find.mockResolvedValue([buildProduct({ id: 1, price: 2000, stock: 50 })]);
      mockRunner.manager.save
        .mockResolvedValueOnce({ id: 12, total: 4000 })
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce({}); // Credit save
      saleRepo.findOne.mockResolvedValue(buildSale({ id: 12 }));

      await saleService.create(cashierId, dto);

      const creditCreateCall = mockRunner.manager.create.mock.calls.find(
        (call: unknown[]) => (call[0] as { name?: string })?.name === 'Credit',
      );
      expect(creditCreateCall).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should apply default pagination', async () => {
      saleRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);
      const result = await saleService.findAll();
      expect(result.meta).toEqual({ total: 0, page: 1, limit: 20 });
    });
  });

  describe('findById', () => {
    it('should throw NOT_FOUND when sale not found', async () => {
      saleRepo.findOne.mockResolvedValue(null);
      await expect(saleService.findById(999)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('should return sale when found', async () => {
      const sale = buildSale();
      saleRepo.findOne.mockResolvedValue(sale);
      const result = await saleService.findById(1);
      expect(result.id).toBe(1);
    });
  });
});
