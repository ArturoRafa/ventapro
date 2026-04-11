import { Errors } from '../utils/AppError';

export interface CreateCategoryDto {
  name: string;
  order?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  order?: number;
}

export interface CreateSubcategoryDto {
  categoryId: number;
  name: string;
  order?: number;
}

export interface UpdateSubcategoryDto {
  name?: string;
  order?: number;
  categoryId?: number;
}

export function validateCreateCategoryDto(body: Record<string, unknown>): CreateCategoryDto {
  if (!body.name || typeof body.name !== 'string') {
    throw Errors.validation('Name is required');
  }
  return {
    name: body.name.trim(),
    order: typeof body.order === 'number' ? body.order : undefined,
  };
}

export function validateUpdateCategoryDto(body: Record<string, unknown>): UpdateCategoryDto {
  const dto: UpdateCategoryDto = {};
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      throw Errors.validation('Name must be a non-empty string');
    }
    dto.name = body.name.trim();
  }
  if (body.order !== undefined) {
    if (typeof body.order !== 'number') {
      throw Errors.validation('Order must be a number');
    }
    dto.order = body.order;
  }
  return dto;
}

export function validateCreateSubcategoryDto(body: Record<string, unknown>): CreateSubcategoryDto {
  if (!body.name || typeof body.name !== 'string') {
    throw Errors.validation('Name is required');
  }
  if (!body.categoryId || typeof body.categoryId !== 'number') {
    throw Errors.validation('Category ID is required');
  }
  return {
    categoryId: body.categoryId,
    name: body.name.trim(),
    order: typeof body.order === 'number' ? body.order : undefined,
  };
}

export function validateUpdateSubcategoryDto(body: Record<string, unknown>): UpdateSubcategoryDto {
  const dto: UpdateSubcategoryDto = {};
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      throw Errors.validation('Name must be a non-empty string');
    }
    dto.name = body.name.trim();
  }
  if (body.order !== undefined) {
    if (typeof body.order !== 'number') throw Errors.validation('Order must be a number');
    dto.order = body.order;
  }
  if (body.categoryId !== undefined) {
    if (typeof body.categoryId !== 'number') throw Errors.validation('Category ID must be a number');
    dto.categoryId = body.categoryId;
  }
  return dto;
}
