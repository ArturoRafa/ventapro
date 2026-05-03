import { AppDataSource } from '../config/database';
import { CashRegister } from '../entities/CashRegister';
import { Sale } from '../entities/Sale';
import { CreditPayment } from '../entities/CreditPayment';
import { BusinessConfig } from '../entities/BusinessConfig';
import { OpenCashRegisterDto, CloseCashRegisterDto } from '../dtos/cash-register.dto';
import { Errors } from '../utils/AppError';

const repo = () => AppDataSource.getRepository(CashRegister);
const saleRepo = () => AppDataSource.getRepository(Sale);
const paymentRepo = () => AppDataSource.getRepository(CreditPayment);
const configRepo = () => AppDataSource.getRepository(BusinessConfig);

interface CashRegisterFilters {
  page?: number;
  limit?: number;
  cashierId?: number;
  status?: 'abierta' | 'cerrada';
  from?: string;
  to?: string;
}

export async function open(cashierId: number, dto: OpenCashRegisterDto): Promise<CashRegister> {
  const existing = await repo().findOne({
    where: { cashierId, status: 'abierta' },
  });
  if (existing) {
    throw Errors.conflict('User already has an open cash register');
  }

  const config = await configRepo().findOne({ where: { id: 1 } });
  if (config?.requiresOpeningAmount && (dto.initialAmount === undefined || dto.initialAmount === null)) {
    throw Errors.validation('Opening amount is required by business configuration');
  }

  const register = repo().create({
    cashierId,
    initialAmount: dto.initialAmount ?? null,
    status: 'abierta',
  });

  return repo().save(register);
}

export async function close(cashierId: number, dto: CloseCashRegisterDto): Promise<CashRegister> {
  const register = await repo().findOne({
    where: { cashierId, status: 'abierta' },
  });
  if (!register) {
    throw Errors.cashRegisterClosed();
  }

  const cashSalesResult = await saleRepo()
    .createQueryBuilder('s')
    .select('COALESCE(SUM(s.total), 0)', 'total')
    .where('s.cashRegisterId = :id', { id: register.id })
    .andWhere('s.paymentMethod = :method', { method: 'cash' })
    .andWhere('s.status = :status', { status: 'paid' })
    .getRawOne();

  const paymentsResult = await paymentRepo()
    .createQueryBuilder('cp')
    .select('COALESCE(SUM(cp.amount), 0)', 'total')
    .where('cp.cashRegisterId = :id', { id: register.id })
    .getRawOne();

  const initialAmount = register.initialAmount ?? 0;
  const cashSales = parseFloat(cashSalesResult?.total ?? '0');
  const creditPayments = parseFloat(paymentsResult?.total ?? '0');

  const systemCloseAmount = initialAmount + cashSales + creditPayments;
  const difference = dto.actualCloseAmount - systemCloseAmount;

  register.actualCloseAmount = dto.actualCloseAmount;
  register.systemCloseAmount = systemCloseAmount;
  register.difference = difference;
  register.status = 'cerrada';
  register.closedAt = new Date();
  register.closingNotes = dto.closingNotes ?? null;

  return repo().save(register);
}

function stripCashierPassword(register: CashRegister): CashRegister {
  if (register.cashier) {
    delete (register.cashier as unknown as Record<string, unknown>).passwordHash;
  }
  return register;
}

export async function findCurrent(cashierId: number): Promise<CashRegister | null> {
  const register = await repo().findOne({
    where: { cashierId, status: 'abierta' },
    relations: ['cashier'],
  });
  return register ? stripCashierPassword(register) : null;
}

export async function findAll(
  filters: CashRegisterFilters = {},
): Promise<{ data: CashRegister[]; meta: { total: number; page: number; limit: number } }> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const skip = (page - 1) * limit;

  const qb = repo()
    .createQueryBuilder('cr')
    .leftJoinAndSelect('cr.cashier', 'cashier')
    .orderBy('cr.openedAt', 'DESC');

  if (filters.cashierId) {
    qb.andWhere('cr.cashierId = :cashierId', { cashierId: filters.cashierId });
  }
  if (filters.status) {
    qb.andWhere('cr.status = :status', { status: filters.status });
  }
  if (filters.from) {
    qb.andWhere('cr.openedAt >= :from', { from: filters.from });
  }
  if (filters.to) {
    const toNextDay = new Date(filters.to);
    toNextDay.setDate(toNextDay.getDate() + 1);
    qb.andWhere('cr.openedAt < :toNextDay', { toNextDay: toNextDay.toISOString().split('T')[0] });
  }

  const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
  data.forEach(stripCashierPassword);
  return { data, meta: { total, page, limit } };
}

export async function findById(id: number): Promise<CashRegister> {
  const register = await repo().findOne({
    where: { id },
    relations: ['cashier'],
  });
  if (!register) throw Errors.notFound(`Cash register ${id} not found`);
  return stripCashierPassword(register);
}
