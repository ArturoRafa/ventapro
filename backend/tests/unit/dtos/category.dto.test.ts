import {
  validateCreateCategoryDto,
  validateUpdateCategoryDto,
  validateCreateSubcategoryDto,
  validateUpdateSubcategoryDto,
} from '@/dtos/category.dto';
import { AppError } from '@/utils/AppError';

describe('validateCreateCategoryDto', () => {
  it('should return DTO with trimmed name and optional order', () => {
    const result = validateCreateCategoryDto({ name: ' Beverages ', order: 2 });
    expect(result.name).toBe('Beverages');
    expect(result.order).toBe(2);
  });

  it('should throw when name is missing', () => {
    expect(() => validateCreateCategoryDto({})).toThrow(AppError);
  });

  it('should set order to undefined when not a number', () => {
    const result = validateCreateCategoryDto({ name: 'Food' });
    expect(result.order).toBeUndefined();
  });
});

describe('validateUpdateCategoryDto', () => {
  it('should return empty DTO for empty body', () => {
    expect(validateUpdateCategoryDto({})).toEqual({});
  });

  it('should throw when name is empty string', () => {
    expect(() => validateUpdateCategoryDto({ name: '  ' })).toThrow(AppError);
  });

  it('should throw when order is not a number', () => {
    expect(() => validateUpdateCategoryDto({ order: 'abc' })).toThrow(AppError);
  });

  it('should accept valid name and order', () => {
    const result = validateUpdateCategoryDto({ name: ' Drinks ', order: 1 });
    expect(result.name).toBe('Drinks');
    expect(result.order).toBe(1);
  });
});

describe('validateCreateSubcategoryDto', () => {
  it('should return valid DTO', () => {
    const result = validateCreateSubcategoryDto({ name: ' Coffee ', categoryId: 1, order: 0 });
    expect(result.name).toBe('Coffee');
    expect(result.categoryId).toBe(1);
    expect(result.order).toBe(0);
  });

  it('should throw when name is missing', () => {
    expect(() => validateCreateSubcategoryDto({ categoryId: 1 })).toThrow(AppError);
  });

  it('should throw when categoryId is missing', () => {
    expect(() => validateCreateSubcategoryDto({ name: 'Sub' })).toThrow(AppError);
  });

  it('should set order to undefined when not number', () => {
    const result = validateCreateSubcategoryDto({ name: 'Sub', categoryId: 1 });
    expect(result.order).toBeUndefined();
  });
});

describe('validateUpdateSubcategoryDto', () => {
  it('should return empty DTO for empty body', () => {
    expect(validateUpdateSubcategoryDto({})).toEqual({});
  });

  it('should throw when name is empty string', () => {
    expect(() => validateUpdateSubcategoryDto({ name: '' })).toThrow(AppError);
  });

  it('should throw when order is not a number', () => {
    expect(() => validateUpdateSubcategoryDto({ order: 'abc' })).toThrow(AppError);
  });

  it('should throw when categoryId is not a number', () => {
    expect(() => validateUpdateSubcategoryDto({ categoryId: 'abc' })).toThrow(AppError);
  });

  it('should accept valid partial update', () => {
    const result = validateUpdateSubcategoryDto({ name: ' Tea ', order: 3 });
    expect(result.name).toBe('Tea');
    expect(result.order).toBe(3);
  });
});
