import { Errors } from '../utils/AppError';

export interface CreateCustomerDto {
  name: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  phone?: string;
  alternatePhone?: string | null;
  address?: string | null;
}

export function validateCreateCustomerDto(body: Record<string, unknown>): CreateCustomerDto {
  if (!body.name || typeof body.name !== 'string') throw Errors.validation('Name is required');
  if (!body.phone || typeof body.phone !== 'string') throw Errors.validation('Phone is required');

  return {
    name: (body.name as string).trim(),
    phone: (body.phone as string).trim(),
    alternatePhone: typeof body.alternatePhone === 'string' ? body.alternatePhone.trim() : undefined,
    address: typeof body.address === 'string' ? body.address.trim() : undefined,
  };
}

export function validateUpdateCustomerDto(body: Record<string, unknown>): UpdateCustomerDto {
  const dto: UpdateCustomerDto = {};
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) throw Errors.validation('Name must be non-empty');
    dto.name = body.name.trim();
  }
  if (body.phone !== undefined) {
    if (typeof body.phone !== 'string' || !body.phone.trim()) throw Errors.validation('Phone must be non-empty');
    dto.phone = body.phone.trim();
  }
  if (body.alternatePhone !== undefined) {
    dto.alternatePhone = body.alternatePhone === null ? null : String(body.alternatePhone).trim();
  }
  if (body.address !== undefined) {
    dto.address = body.address === null ? null : String(body.address).trim();
  }
  return dto;
}
