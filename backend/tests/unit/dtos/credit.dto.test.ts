import { validateCreateCreditPaymentDto } from '@/dtos/credit.dto';
import { AppError } from '@/utils/AppError';

describe('validateCreateCreditPaymentDto', () => {
  it('should return valid DTO with amount', () => {
    const result = validateCreateCreditPaymentDto({ amount: 1000 });
    expect(result.amount).toBe(1000);
    expect(result.notes).toBeUndefined();
  });

  it('should throw when amount is not a number', () => {
    expect(() => validateCreateCreditPaymentDto({ amount: 'abc' })).toThrow(AppError);
  });

  it('should throw when amount is <= 0', () => {
    expect(() => validateCreateCreditPaymentDto({ amount: 0 })).toThrow(AppError);
    expect(() => validateCreateCreditPaymentDto({ amount: -100 })).toThrow(AppError);
  });

  it('should include trimmed notes when provided', () => {
    const result = validateCreateCreditPaymentDto({ amount: 500, notes: '  partial payment  ' });
    expect(result.notes).toBe('partial payment');
  });

  it('should omit notes when empty after trim', () => {
    const result = validateCreateCreditPaymentDto({ amount: 500, notes: '   ' });
    expect(result.notes).toBeUndefined();
  });

  it('should throw when notes is not a string', () => {
    expect(() => validateCreateCreditPaymentDto({ amount: 500, notes: 123 })).toThrow(AppError);
  });

  it('should ignore null notes', () => {
    const result = validateCreateCreditPaymentDto({ amount: 500, notes: null });
    expect(result.notes).toBeUndefined();
  });
});
