import { Errors } from '../utils/AppError';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'cashier';
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'cashier';
}

const VALID_ROLES = ['admin', 'cashier'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCreateUserDto(body: Record<string, unknown>): CreateUserDto {
  if (!body.name || typeof body.name !== 'string' || !body.name.trim())
    throw Errors.validation('Name is required');
  if (!body.email || typeof body.email !== 'string' || !EMAIL_RE.test(body.email))
    throw Errors.validation('Valid email is required');
  if (!body.password || typeof body.password !== 'string' || body.password.length < 8)
    throw Errors.validation('Password must be at least 8 characters');
  if (!body.role || !VALID_ROLES.includes(body.role as string))
    throw Errors.validation('Role must be admin or cashier');

  return {
    name: (body.name as string).trim(),
    email: (body.email as string).toLowerCase().trim(),
    password: body.password as string,
    role: body.role as 'admin' | 'cashier',
  };
}

export function validateUpdateUserDto(body: Record<string, unknown>): UpdateUserDto {
  const dto: UpdateUserDto = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim())
      throw Errors.validation('Name must be non-empty');
    dto.name = body.name.trim();
  }
  if (body.email !== undefined) {
    if (typeof body.email !== 'string' || !EMAIL_RE.test(body.email))
      throw Errors.validation('Valid email is required');
    dto.email = (body.email as string).toLowerCase().trim();
  }
  if (body.password !== undefined) {
    if (typeof body.password !== 'string' || body.password.length < 8)
      throw Errors.validation('Password must be at least 8 characters');
    dto.password = body.password as string;
  }
  if (body.role !== undefined) {
    if (!VALID_ROLES.includes(body.role as string))
      throw Errors.validation('Role must be admin or cashier');
    dto.role = body.role as 'admin' | 'cashier';
  }

  return dto;
}
