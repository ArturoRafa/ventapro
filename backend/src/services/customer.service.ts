import { AppDataSource } from '../config/database';
import { Customer } from '../entities/Customer';
import { CreateCustomerDto, UpdateCustomerDto } from '../dtos/customer.dto';
import { Errors } from '../utils/AppError';

const repo = () => AppDataSource.getRepository(Customer);

interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'activo' | 'inactivo';
}

export async function findAll(filters: CustomerFilters = {}): Promise<{ data: Customer[]; meta: { total: number; page: number; limit: number } }> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const qb = repo()
    .createQueryBuilder('c')
    .orderBy('c.name', 'ASC');

  if (filters.status) {
    qb.andWhere('c.status = :status', { status: filters.status });
  } else {
    qb.andWhere('c.status = :status', { status: 'activo' });
  }
  if (filters.search) {
    qb.andWhere('(c.name ILIKE :search OR c.phone ILIKE :search)', { search: `%${filters.search}%` });
  }

  const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
  return { data, meta: { total, page, limit } };
}

export async function findById(id: number): Promise<Customer> {
  const customer = await repo().findOne({ where: { id } });
  if (!customer) throw Errors.notFound(`Customer ${id} not found`);
  return customer;
}

export async function create(dto: CreateCustomerDto): Promise<Customer> {
  const customer = repo().create(dto);
  return repo().save(customer);
}

export async function update(id: number, dto: UpdateCustomerDto): Promise<Customer> {
  const customer = await findById(id);
  Object.assign(customer, dto);
  return repo().save(customer);
}

export async function toggleStatus(id: number): Promise<Customer> {
  const customer = await findById(id);
  customer.status = customer.status === 'activo' ? 'inactivo' : 'activo';
  return repo().save(customer);
}
