import { validateCreateSaleDto } from '@/dtos/sale.dto';
import { AppError } from '@/utils/AppError';

describe('validateCreateSaleDto', () => {
  const validBody = {
    items: [{ productId: 1, quantity: 2 }],
    paymentMethod: 'cash',
  };

  it('should return valid DTO with defaults (status=paid)', () => {
    const result = validateCreateSaleDto(validBody);
    expect(result.status).toBe('paid');
    expect(result.items).toHaveLength(1);
    expect(result.paymentMethod).toBe('cash');
    expect(result.customerId).toBeUndefined();
  });

  it('should throw when items is not an array', () => {
    expect(() => validateCreateSaleDto({ ...validBody, items: 'not-array' })).toThrow(AppError);
  });

  it('should throw when items is empty', () => {
    expect(() => validateCreateSaleDto({ ...validBody, items: [] })).toThrow(AppError);
  });

  it('should throw when item is not an object', () => {
    expect(() => validateCreateSaleDto({ ...validBody, items: ['bad'] })).toThrow(AppError);
  });

  it('should throw when productId is missing or <= 0', () => {
    expect(() => validateCreateSaleDto({ ...validBody, items: [{ productId: 0, quantity: 1 }] })).toThrow(AppError);
    expect(() => validateCreateSaleDto({ ...validBody, items: [{ quantity: 1 }] })).toThrow(AppError);
  });

  it('should throw when quantity is not a positive integer', () => {
    expect(() => validateCreateSaleDto({ ...validBody, items: [{ productId: 1, quantity: 1.5 }] })).toThrow(AppError);
    expect(() => validateCreateSaleDto({ ...validBody, items: [{ productId: 1, quantity: 0 }] })).toThrow(AppError);
  });

  it('should throw for invalid paymentMethod', () => {
    expect(() => validateCreateSaleDto({ ...validBody, paymentMethod: 'bitcoin' })).toThrow(AppError);
  });

  it('should accept valid paymentMethods', () => {
    for (const method of ['cash', 'card', 'transfer']) {
      const result = validateCreateSaleDto({ ...validBody, paymentMethod: method });
      expect(result.paymentMethod).toBe(method);
    }
  });

  it('should throw for invalid status', () => {
    expect(() => validateCreateSaleDto({ ...validBody, status: 'cancelled' })).toThrow(AppError);
  });

  it('should accept status pending with customerId', () => {
    const result = validateCreateSaleDto({ ...validBody, status: 'pending', customerId: 1 });
    expect(result.status).toBe('pending');
    expect(result.customerId).toBe(1);
  });

  it('should throw when status is pending without customerId', () => {
    expect(() => validateCreateSaleDto({ ...validBody, status: 'pending' })).toThrow(AppError);
  });

  it('should throw when customerId is invalid', () => {
    expect(() => validateCreateSaleDto({ ...validBody, customerId: -1 })).toThrow(AppError);
    expect(() => validateCreateSaleDto({ ...validBody, customerId: 'abc' })).toThrow(AppError);
  });

  it('should treat null customerId as absent', () => {
    const result = validateCreateSaleDto({ ...validBody, customerId: null });
    expect(result.customerId).toBeUndefined();
  });

  it('should handle multiple valid items', () => {
    const result = validateCreateSaleDto({
      ...validBody,
      items: [
        { productId: 1, quantity: 2 },
        { productId: 3, quantity: 5 },
      ],
    });
    expect(result.items).toHaveLength(2);
  });
});
