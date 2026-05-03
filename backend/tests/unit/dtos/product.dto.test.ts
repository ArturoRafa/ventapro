import { validateCreateProductDto, validateUpdateProductDto, validateAdjustStockDto } from '@/dtos/product.dto';
import { AppError } from '@/utils/AppError';

describe('validateCreateProductDto', () => {
  const validBody = {
    code: ' PROD-001 ',
    name: ' Test Product ',
    subcategoryId: 1,
    type: 'inventory',
    price: 1000,
    stock: 50,
    minStock: 5,
  };

  it('should return trimmed code and name', () => {
    const result = validateCreateProductDto(validBody);
    expect(result.code).toBe('PROD-001');
    expect(result.name).toBe('Test Product');
    expect(result.subcategoryId).toBe(1);
    expect(result.type).toBe('inventory');
  });

  it('should throw when code is missing', () => {
    expect(() => validateCreateProductDto({ ...validBody, code: undefined })).toThrow(AppError);
  });

  it('should throw when name is missing', () => {
    expect(() => validateCreateProductDto({ ...validBody, name: undefined })).toThrow(AppError);
  });

  it('should throw when subcategoryId is missing', () => {
    expect(() => validateCreateProductDto({ ...validBody, subcategoryId: undefined })).toThrow(AppError);
  });

  it('should throw for invalid type', () => {
    expect(() => validateCreateProductDto({ ...validBody, type: 'other' })).toThrow(AppError);
  });

  it('should accept food type', () => {
    const result = validateCreateProductDto({ ...validBody, type: 'food' });
    expect(result.type).toBe('food');
  });

  it('should throw for negative price', () => {
    expect(() => validateCreateProductDto({ ...validBody, price: -1 })).toThrow(AppError);
  });

  it('should throw for negative stock', () => {
    expect(() => validateCreateProductDto({ ...validBody, stock: -1 })).toThrow(AppError);
  });

  it('should throw for negative minStock', () => {
    expect(() => validateCreateProductDto({ ...validBody, minStock: -1 })).toThrow(AppError);
  });

  it('should accept zero values for price, stock, minStock', () => {
    const result = validateCreateProductDto({ ...validBody, price: 0, stock: 0, minStock: 0 });
    expect(result.price).toBe(0);
    expect(result.stock).toBe(0);
    expect(result.minStock).toBe(0);
  });
});

describe('validateUpdateProductDto', () => {
  it('should return empty DTO for empty body', () => {
    const result = validateUpdateProductDto({});
    expect(result).toEqual({});
  });

  it('should throw when code is empty string', () => {
    expect(() => validateUpdateProductDto({ code: '  ' })).toThrow(AppError);
  });

  it('should trim valid code', () => {
    expect(validateUpdateProductDto({ code: ' ABC ' }).code).toBe('ABC');
  });

  it('should throw when name is empty string', () => {
    expect(() => validateUpdateProductDto({ name: '' })).toThrow(AppError);
  });

  it('should throw for non-number subcategoryId', () => {
    expect(() => validateUpdateProductDto({ subcategoryId: 'abc' })).toThrow(AppError);
  });

  it('should throw for invalid type', () => {
    expect(() => validateUpdateProductDto({ type: 'other' })).toThrow(AppError);
  });

  it('should throw for negative price', () => {
    expect(() => validateUpdateProductDto({ price: -5 })).toThrow(AppError);
  });

  it('should throw for negative stock', () => {
    expect(() => validateUpdateProductDto({ stock: -1 })).toThrow(AppError);
  });

  it('should throw for negative minStock', () => {
    expect(() => validateUpdateProductDto({ minStock: -1 })).toThrow(AppError);
  });

  it('should accept valid partial update', () => {
    const result = validateUpdateProductDto({ name: 'New Name', price: 2000 });
    expect(result.name).toBe('New Name');
    expect(result.price).toBe(2000);
    expect(result.code).toBeUndefined();
  });
});

describe('validateAdjustStockDto', () => {
  it('should return positive adjustment', () => {
    const result = validateAdjustStockDto({ adjustment: 10 });
    expect(result.adjustment).toBe(10);
  });

  it('should return negative adjustment', () => {
    const result = validateAdjustStockDto({ adjustment: -5 });
    expect(result.adjustment).toBe(-5);
  });

  it('should throw for zero adjustment', () => {
    expect(() => validateAdjustStockDto({ adjustment: 0 })).toThrow(AppError);
  });

  it('should throw for non-number adjustment', () => {
    expect(() => validateAdjustStockDto({ adjustment: 'abc' })).toThrow(AppError);
  });

  it('should trim string reason', () => {
    const result = validateAdjustStockDto({ adjustment: 5, reason: '  restock  ' });
    expect(result.reason).toBe('restock');
  });

  it('should set reason to undefined for non-string', () => {
    const result = validateAdjustStockDto({ adjustment: 5, reason: 123 });
    expect(result.reason).toBeUndefined();
  });
});
