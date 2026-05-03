jest.mock('@/config/database', () => ({
  AppDataSource: { getRepository: jest.fn() },
}));

import { AppDataSource } from '@/config/database';
import * as customerService from '@/services/customer.service';
import { createMockRepository } from '../../helpers/mock-repository';
import { buildCustomer } from '../../helpers/fixtures';

let customerRepo: ReturnType<typeof createMockRepository>;

beforeEach(() => {
  jest.clearAllMocks();
  customerRepo = createMockRepository();
  (AppDataSource.getRepository as jest.Mock).mockReturnValue(customerRepo);
});

describe('customer.service', () => {
  describe('findAll', () => {
    it('should default to active status filter', async () => {
      customerRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);
      await customerService.findAll();
      expect(customerRepo._qb.andWhere).toHaveBeenCalledWith('c.status = :status', { status: 'activo' });
    });

    it('should apply explicit status filter', async () => {
      customerRepo._qb.getManyAndCount.mockResolvedValue([[], 0]);
      await customerService.findAll({ status: 'inactivo' });
      expect(customerRepo._qb.andWhere).toHaveBeenCalledWith('c.status = :status', { status: 'inactivo' });
    });
  });

  describe('findById', () => {
    it('should return customer when found', async () => {
      customerRepo.findOne.mockResolvedValue(buildCustomer());
      const result = await customerService.findById(1);
      expect(result.id).toBe(1);
    });

    it('should throw NOT_FOUND when not found', async () => {
      customerRepo.findOne.mockResolvedValue(null);
      await expect(customerService.findById(99)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  describe('create', () => {
    it('should create and save customer', async () => {
      const dto = { name: 'John', phone: '123' };
      customerRepo.create.mockReturnValue(dto);
      customerRepo.save.mockResolvedValue({ id: 1, ...dto });

      const result = await customerService.create(dto);
      expect(result.id).toBe(1);
      expect(customerRepo.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should update customer fields', async () => {
      const customer = buildCustomer();
      customerRepo.findOne.mockResolvedValue(customer);
      customerRepo.save.mockImplementation((c: unknown) => Promise.resolve(c));

      const result = await customerService.update(1, { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('toggleStatus', () => {
    it('should toggle active to inactive', async () => {
      customerRepo.findOne.mockResolvedValue(buildCustomer({ status: 'activo' }));
      customerRepo.save.mockImplementation((c: unknown) => Promise.resolve(c));

      const result = await customerService.toggleStatus(1);
      expect(result.status).toBe('inactivo');
    });

    it('should toggle inactive to active', async () => {
      customerRepo.findOne.mockResolvedValue(buildCustomer({ status: 'inactivo' }));
      customerRepo.save.mockImplementation((c: unknown) => Promise.resolve(c));

      const result = await customerService.toggleStatus(1);
      expect(result.status).toBe('activo');
    });
  });
});
