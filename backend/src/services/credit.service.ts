import { AppDataSource } from '../config/database';
import { Credit } from '../entities/Credit';
import { CreditPayment } from '../entities/CreditPayment';
import { CashRegister } from '../entities/CashRegister';
import { CreateCreditPaymentDto } from '../dtos/credit.dto';
import { Errors } from '../utils/AppError';

const repo = () => AppDataSource.getRepository(Credit);

interface CreditFilters {
  page?: number;
  limit?: number;
  customerId?: number;
  status?: 'pending' | 'paid';
  from?: string;
  to?: string;
}

export async function findAll(
  filters: CreditFilters = {},
): Promise<{ data: Credit[]; meta: { total: number; page: number; limit: number } }> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const skip = (page - 1) * limit;

  const qb = repo()
    .createQueryBuilder('c')
    .leftJoinAndSelect('c.customer', 'customer')
    .orderBy('c.createdAt', 'DESC');

  if (filters.customerId) {
    qb.andWhere('c.customerId = :customerId', { customerId: filters.customerId });
  }
  if (filters.status) {
    qb.andWhere('c.status = :status', { status: filters.status });
  }
  if (filters.from) {
    qb.andWhere('c.createdAt >= :from', { from: filters.from });
  }
  if (filters.to) {
    const toNextDay = new Date(filters.to);
    toNextDay.setDate(toNextDay.getDate() + 1);
    qb.andWhere('c.createdAt < :toNextDay', { toNextDay: toNextDay.toISOString().split('T')[0] });
  }

  const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
  return { data, meta: { total, page, limit } };
}

export async function findById(id: number): Promise<Credit> {
  const credit = await repo().findOne({
    where: { id },
    relations: ['customer', 'sale', 'sale.details', 'payments', 'payments.cashRegister'],
  });
  if (!credit) throw Errors.notFound(`Credit ${id} not found`);
  return credit;
}

export async function createPayment(
  creditId: number,
  cashierId: number,
  dto: CreateCreditPaymentDto,
): Promise<Credit> {
  const runner = AppDataSource.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();

  try {
    // 1. Find credit
    const credit = await runner.manager.findOne(Credit, { where: { id: creditId } });
    if (!credit) throw Errors.notFound(`Credit ${creditId} not found`);

    // 2. Validate not already paid
    if (credit.status === 'paid') throw Errors.creditAlreadyPaid();

    // 3. Find open cash register for this cashier
    const register = await runner.manager.findOne(CashRegister, {
      where: { cashierId, status: 'abierta' },
    });
    if (!register) throw Errors.cashRegisterClosed();

    // 4. Validate amount does not exceed pending balance
    if (dto.amount > credit.pendingBalance) {
      throw Errors.paymentExceedsBalance(dto.amount, credit.pendingBalance);
    }

    // 5. Create CreditPayment
    const payment = runner.manager.create(CreditPayment, {
      creditId: credit.id,
      customerId: credit.customerId,
      cashRegisterId: register.id,
      amount: dto.amount,
      notes: dto.notes ?? null,
    });
    await runner.manager.save(payment);

    // 6. Decrement pendingBalance (atomic SQL: SET saldo_pendiente = saldo_pendiente - :amount)
    await runner.manager.decrement(Credit, { id: credit.id }, 'pendingBalance', dto.amount);

    // 7. Re-read from DB to check balance (avoids floating-point issues)
    const updated = await runner.manager.findOne(Credit, { where: { id: credit.id } });
    if (updated!.pendingBalance === 0) {
      await runner.manager.update(Credit, { id: credit.id }, { status: 'paid' });
    }

    // 8. Commit
    await runner.commitTransaction();
  } catch (error) {
    await runner.rollbackTransaction();
    throw error;
  } finally {
    await runner.release();
  }

  // Re-fetch with all relations after commit
  return findById(creditId);
}
