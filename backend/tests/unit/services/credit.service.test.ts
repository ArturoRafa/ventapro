jest.mock('@/config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    createQueryRunner: jest.fn(),
  },
}));

import { AppDataSource } from '@/config/database';
import * as creditService from '@/services/credit.service';
import { createMockRepository, createMockQueryRunner } from '../../helpers/mock-repository';
import { buildCredit, buildCashRegister } from '../../helpers/fixtures';

let creditRepo: ReturnType<typeof createMockRepository>;
let mockRunner: ReturnType<typeof createMockQueryRunner>;

beforeEach(() => {
  jest.clearAllMocks();
  creditRepo = createMockRepository();
  mockRunner = createMockQueryRunner();
  (AppDataSource.getRepository as jest.Mock).mockReturnValue(creditRepo);
  (AppDataSource.createQueryRunner as jest.Mock).mockReturnValue(mockRunner);
});

describe('credit.service', () => {
  describe('findAll', () => {
    it('should apply default pagination', async () => {
      creditRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);
      const result = await creditService.findAll();
      expect(result.meta).toEqual({ total: 0, page: 1, limit: 20 });
    });
  });

  describe('findById', () => {
    it('should return credit when found', async () => {
      const credit = buildCredit();
      creditRepo.findOne.mockResolvedValue(credit);
      const result = await creditService.findById(1);
      expect(result.id).toBe(1);
    });

    it('should throw NOT_FOUND when not found', async () => {
      creditRepo.findOne.mockResolvedValue(null);
      await expect(creditService.findById(99)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('createPayment', () => {
    const cashierId = 1;
    const dto = { amount: 2000 };

    it('should create payment and keep status pending (partial)', async () => {
      const credit = buildCredit({ id: 1, pendingBalance: 5000, status: 'pending', customerId: 1 });
      const updatedCredit = { ...credit, pendingBalance: 3000 };

      mockRunner.manager.findOne
        .mockResolvedValueOnce(credit)
        .mockResolvedValueOnce(buildCashRegister())
        .mockResolvedValueOnce(updatedCredit);
      mockRunner.manager.save.mockResolvedValue({});

      creditRepo.findOne.mockResolvedValue(updatedCredit);

      const result = await creditService.createPayment(1, cashierId, dto);
      expect(mockRunner.commitTransaction).toHaveBeenCalled();
      expect(mockRunner.manager.decrement).toHaveBeenCalled();
      expect(result.pendingBalance).toBe(3000);
    });

    it('should set status to paid when balance reaches 0', async () => {
      const credit = buildCredit({ id: 1, pendingBalance: 2000, status: 'pending', customerId: 1 });
      const fullyPaid = { ...credit, pendingBalance: 0 };

      mockRunner.manager.findOne
        .mockResolvedValueOnce(credit)
        .mockResolvedValueOnce(buildCashRegister())
        .mockResolvedValueOnce(fullyPaid);
      mockRunner.manager.save.mockResolvedValue({});

      creditRepo.findOne.mockResolvedValue({ ...fullyPaid, status: 'paid' });

      const result = await creditService.createPayment(1, cashierId, { amount: 2000 });
      expect(mockRunner.manager.update).toHaveBeenCalled();
      expect(result.status).toBe('paid');
    });

    it('should throw NOT_FOUND when credit not found', async () => {
      mockRunner.manager.findOne.mockResolvedValueOnce(null);
      await expect(creditService.createPayment(99, cashierId, dto)).rejects.toMatchObject({ code: 'NOT_FOUND' });
      expect(mockRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw CREDIT_ALREADY_PAID when credit is paid', async () => {
      mockRunner.manager.findOne.mockResolvedValueOnce(buildCredit({ status: 'paid' }));
      await expect(creditService.createPayment(1, cashierId, dto)).rejects.toMatchObject({ code: 'CREDIT_ALREADY_PAID' });
      expect(mockRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw CASH_REGISTER_CLOSED when no open register', async () => {
      mockRunner.manager.findOne
        .mockResolvedValueOnce(buildCredit())
        .mockResolvedValueOnce(null);

      await expect(creditService.createPayment(1, cashierId, dto)).rejects.toMatchObject({ code: 'CASH_REGISTER_CLOSED' });
    });

    it('should throw PAYMENT_EXCEEDS_BALANCE when amount exceeds balance', async () => {
      mockRunner.manager.findOne
        .mockResolvedValueOnce(buildCredit({ pendingBalance: 1000 }))
        .mockResolvedValueOnce(buildCashRegister());

      await expect(creditService.createPayment(1, cashierId, { amount: 2000 })).rejects.toMatchObject({ code: 'PAYMENT_EXCEEDS_BALANCE' });
    });
  });
});
