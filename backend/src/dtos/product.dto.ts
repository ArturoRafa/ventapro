import { Errors } from '../utils/AppError';

export interface CreateProductDto {
  code: string;
  name: string;
  subcategoryId: number;
  type: 'inventory' | 'food';
  price: number;
  stock: number;
  minStock: number;
}

export interface UpdateProductDto {
  code?: string;
  name?: string;
  subcategoryId?: number;
  type?: 'inventory' | 'food';
  price?: number;
  stock?: number;
  minStock?: number;
}

export interface AdjustStockDto {
  adjustment: number;
  reason?: string;
}

export function validateCreateProductDto(body: Record<string, unknown>): CreateProductDto {
  if (!body.code || typeof body.code !== 'string') throw Errors.validation('Code is required');
  if (!body.name || typeof body.name !== 'string') throw Errors.validation('Name is required');
  if (!body.subcategoryId || typeof body.subcategoryId !== 'number') throw Errors.validation('Subcategory ID is required');
  if (!body.type || (body.type !== 'inventory' && body.type !== 'food')) throw Errors.validation('Type must be inventory or food');
  if (typeof body.price !== 'number' || body.price < 0) throw Errors.validation('Price must be >= 0');
  if (typeof body.stock !== 'number' || body.stock < 0) throw Errors.validation('Stock must be >= 0');
  if (typeof body.minStock !== 'number' || body.minStock < 0) throw Errors.validation('Min stock must be >= 0');

  return {
    code: (body.code as string).trim(),
    name: (body.name as string).trim(),
    subcategoryId: body.subcategoryId as number,
    type: body.type as 'inventory' | 'food',
    price: body.price as number,
    stock: body.stock as number,
    minStock: body.minStock as number,
  };
}

export function validateUpdateProductDto(body: Record<string, unknown>): UpdateProductDto {
  const dto: UpdateProductDto = {};
  if (body.code !== undefined) {
    if (typeof body.code !== 'string' || !body.code.trim()) throw Errors.validation('Code must be a non-empty string');
    dto.code = body.code.trim();
  }
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) throw Errors.validation('Name must be a non-empty string');
    dto.name = body.name.trim();
  }
  if (body.subcategoryId !== undefined) {
    if (typeof body.subcategoryId !== 'number') throw Errors.validation('Subcategory ID must be a number');
    dto.subcategoryId = body.subcategoryId;
  }
  if (body.type !== undefined) {
    if (body.type !== 'inventory' && body.type !== 'food') throw Errors.validation('Type must be inventory or food');
    dto.type = body.type;
  }
  if (body.price !== undefined) {
    if (typeof body.price !== 'number' || body.price < 0) throw Errors.validation('Price must be >= 0');
    dto.price = body.price;
  }
  if (body.stock !== undefined) {
    if (typeof body.stock !== 'number' || body.stock < 0) throw Errors.validation('Stock must be >= 0');
    dto.stock = body.stock;
  }
  if (body.minStock !== undefined) {
    if (typeof body.minStock !== 'number' || body.minStock < 0) throw Errors.validation('Min stock must be >= 0');
    dto.minStock = body.minStock;
  }
  return dto;
}

export function validateAdjustStockDto(body: Record<string, unknown>): AdjustStockDto {
  if (typeof body.adjustment !== 'number' || body.adjustment === 0) {
    throw Errors.validation('Adjustment must be a non-zero number');
  }
  return {
    adjustment: body.adjustment,
    reason: typeof body.reason === 'string' ? body.reason.trim() : undefined,
  };
}
