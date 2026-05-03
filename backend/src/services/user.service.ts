import bcrypt from 'bcryptjs';

import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Errors } from '../utils/AppError';
import type { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';

export interface UserSummary {
  id: number;
  name: string;
  role: string;
}

export interface UserAdmin {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'cashier';
  status: 'activo' | 'inactivo';
  createdAt: Date;
}

// Used internally (POS selectors, cash register)
export async function getAllActive(): Promise<UserSummary[]> {
  const repo = AppDataSource.getRepository(User);
  const users = await repo.find({
    where: { status: 'activo' },
    select: ['id', 'name', 'role'],
    order: { name: 'ASC' },
  });
  return users.map((u) => ({ id: u.id, name: u.name, role: u.role }));
}

// Full list for admin management (includes inactive, includes email)
export async function getAll(): Promise<UserAdmin[]> {
  const repo = AppDataSource.getRepository(User);
  const users = await repo.find({
    select: ['id', 'name', 'email', 'role', 'status', 'createdAt'],
    order: { name: 'ASC' },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
  }));
}

export async function create(dto: CreateUserDto): Promise<UserAdmin> {
  const repo = AppDataSource.getRepository(User);

  const existing = await repo.findOne({ where: { email: dto.email } });
  if (existing) throw Errors.conflict('Email already in use');

  const passwordHash = await bcrypt.hash(dto.password, 12);
  const user = repo.create({ name: dto.name, email: dto.email, passwordHash, role: dto.role });
  const saved = await repo.save(user);

  return { id: saved.id, name: saved.name, email: saved.email, role: saved.role, status: saved.status, createdAt: saved.createdAt };
}

export async function update(id: number, dto: UpdateUserDto): Promise<UserAdmin> {
  const repo = AppDataSource.getRepository(User);

  const user = await repo.findOne({ where: { id } });
  if (!user) throw Errors.notFound('User not found');

  if (dto.email && dto.email !== user.email) {
    const conflict = await repo.findOne({ where: { email: dto.email } });
    if (conflict) throw Errors.conflict('Email already in use');
  }

  if (dto.name) user.name = dto.name;
  if (dto.email) user.email = dto.email;
  if (dto.role) user.role = dto.role;
  if (dto.password) user.passwordHash = await bcrypt.hash(dto.password, 12);

  const saved = await repo.save(user);
  return { id: saved.id, name: saved.name, email: saved.email, role: saved.role, status: saved.status, createdAt: saved.createdAt };
}

export async function toggleStatus(id: number, requesterId: number): Promise<UserAdmin> {
  const repo = AppDataSource.getRepository(User);

  if (id === requesterId) throw Errors.validation('You cannot deactivate your own account');

  const user = await repo.findOne({ where: { id } });
  if (!user) throw Errors.notFound('User not found');

  user.status = user.status === 'activo' ? 'inactivo' : 'activo';
  const saved = await repo.save(user);
  return { id: saved.id, name: saved.name, email: saved.email, role: saved.role, status: saved.status, createdAt: saved.createdAt };
}
