jest.mock('@/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}));

import { AppDataSource } from '@/config/database';
import * as cashRegisterService from '@/services/cash-register.service';
import { createMockRepository } from '../../helpers/mock-repository';
import { buildCashRegister, buildBusinessConfig } from '../../helpers/fixtures';

let registerRepo: ReturnType<typeof createMockRepository>;
let saleRepo: ReturnType<typeof createMockRepository>;
let paymentRepo: ReturnType<typeof createMockRepository>;
let configRepo: ReturnType<typeof createMockRepository>;

beforeEach(() => {
  jest.clearAllMocks();
  registerRepo = createMockRepository();
  saleRepo = createMockRepository();
  paymentRepo = createMockRepository();
  configRepo = createMockRepository();

  (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: { name: string }) => {
    if (entity.name === 'CashRegister') return registerRepo;
    if (entity.name === 'Sale') return saleRepo;
    if (entity.name === 'CreditPayment') return paymentRepo;
    if (entity.name === 'BusinessConfig') return configRepo;
    return createMockRepository();
  });
});

describe('cash-register.service', () => {
  describe('open', () => {
    it('should open a cash register', async () => {
      registerRepo.findOne.mockResolvedValue(null);
      configRepo.findOne.mockResolvedValue(buildBusinessConfig());
      registerRepo.create.mockReturnValue(buildCashRegister({ initialAmount: 50000 }));
      registerRepo.save.mockImplementation((r: unknown) => Promise.resolve(r));

      const result = await cashRegisterService.open(1, { initialAmount: 50000 });
      expect(result.status).toBe('abierta');
    });

    it('should throw DUPLICATE_ENTRY when already open', async () => {
      registerRepo.findOne.mockResolvedValue(buildCashRegister());
      await expect(cashRegisterService.open(1, {})).rejects.toMatchObject({ code: 'DUPLICATE_ENTRY' });
    });

    it('should throw when requiresOpeningAmount and no amount provided', async () => {
      registerRepo.findOne.mockResolvedValue(null);
      configRepo.findOne.mockResolvedValue(buildBusinessConfig({ requiresOpeningAmount: true }));

      await expect(cashRegisterService.open(1, {})).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    });

    it('should allow opening without amount when not required', async () => {
      registerRepo.findOne.mockResolvedValue(null);
      configRepo.findOne.mockResolvedValue(buildBusinessConfig({ requiresOpeningAmount: false }));
      registerRepo.create.mockReturnValue(buildCashRegister({ initialAmount: null }));
      registerRepo.save.mockImplementation((r: unknown) => Promise.resolve(r));

      const result = await cashRegisterService.open(1, {});
      expect(result).toBeDefined();
    });
  });

  describe('close', () => {
    it('should calculate systemCloseAmount and difference correctly', async () => {
      const register = buildCashRegister({ id: 10, initialAmount: 100000 });
      registerRepo.findOne.mockResolvedValue(register);
      saleRepo._qb.getRawOne.mockResolvedValue({ total: '50000' });
      paymentRepo._qb.getRawOne.mockResolvedValue({ total: '20000' });
      registerRepo.save.mockImplementation((r: unknown) => Promise.resolve(r));

      const result = await cashRegisterService.close(1, { actualCloseAmount: 175000 });

      expect(result.systemCloseAmount).toBe(170000); // 100000 + 50000 + 20000
      expect(result.difference).toBe(5000); // 175000 - 170000
      expect(result.status).toBe('cerrada');
    });

    it('should handle null initialAmount as 0', async () => {
      const register = buildCashRegister({ id: 10, initialAmount: null });
      registerRepo.findOne.mockResolvedValue(register);
      saleRepo._qb.getRawOne.mockResolvedValue({ total: '10000' });
      paymentRepo._qb.getRawOne.mockResolvedValue({ total: '5000' });
      registerRepo.save.mockImplementation((r: unknown) => Promise.resolve(r));

      const result = await cashRegisterService.close(1, { actualCloseAmount: 15000 });

      expect(result.systemCloseAmount).toBe(15000);
      expect(result.difference).toBe(0);
    });

    it('should throw CASH_REGISTER_CLOSED when no open register', async () => {
      registerRepo.findOne.mockResolvedValue(null);
      await expect(cashRegisterService.close(1, { actualCloseAmount: 100 }))
        .rejects.toMatchObject({ code: 'CASH_REGISTER_CLOSED' });
    });

    it('should handle negative difference (deficit)', async () => {
      const register = buildCashRegister({ id: 10, initialAmount: 100000 });
      registerRepo.findOne.mockResolvedValue(register);
      saleRepo._qb.getRawOne.mockResolvedValue({ total: '50000' });
      paymentRepo._qb.getRawOne.mockResolvedValue({ total: '0' });
      registerRepo.save.mockImplementation((r: unknown) => Promise.resolve(r));

      const result = await cashRegisterService.close(1, { actualCloseAmount: 140000 });
      expect(result.difference).toBe(-10000);
    });
  });

  describe('findCurrent', () => {
    it('should return register and strip password', async () => {
      const register = buildCashRegister({ cashier: { id: 1, name: 'Test', passwordHash: 'secret' } });
      registerRepo.findOne.mockResolvedValue(register);
      const result = await cashRegisterService.findCurrent(1);
      expect(result).toBeDefined();
      expect((result as unknown as Record<string, unknown>).cashier).not.toHaveProperty('passwordHash');
    });

    it('should return null when no open register', async () => {
      registerRepo.findOne.mockResolvedValue(null);
      const result = await cashRegisterService.findCurrent(1);
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should throw NOT_FOUND when not found', async () => {
      registerRepo.findOne.mockResolvedValue(null);
      await expect(cashRegisterService.findById(99)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
