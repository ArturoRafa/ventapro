import { validateCreateCustomerDto, validateUpdateCustomerDto } from '@/dtos/customer.dto';
import { AppError } from '@/utils/AppError';

describe('validateCreateCustomerDto', () => {
  it('should return valid DTO with trimmed fields', () => {
    const result = validateCreateCustomerDto({
      name: ' John Doe ',
      phone: ' 3001234567 ',
      alternatePhone: ' 3009876543 ',
      address: ' Calle 123 ',
    });
    expect(result.name).toBe('John Doe');
    expect(result.phone).toBe('3001234567');
    expect(result.alternatePhone).toBe('3009876543');
    expect(result.address).toBe('Calle 123');
  });

  it('should throw when name is missing', () => {
    expect(() => validateCreateCustomerDto({ phone: '123' })).toThrow(AppError);
  });

  it('should throw when phone is missing', () => {
    expect(() => validateCreateCustomerDto({ name: 'John' })).toThrow(AppError);
  });

  it('should set optional fields to undefined when not string', () => {
    const result = validateCreateCustomerDto({ name: 'John', phone: '123' });
    expect(result.alternatePhone).toBeUndefined();
    expect(result.address).toBeUndefined();
  });
});

describe('validateUpdateCustomerDto', () => {
  it('should return empty DTO for empty body', () => {
    const result = validateUpdateCustomerDto({});
    expect(result).toEqual({});
  });

  it('should throw when name is empty string', () => {
    expect(() => validateUpdateCustomerDto({ name: '  ' })).toThrow(AppError);
  });

  it('should throw when phone is empty string', () => {
    expect(() => validateUpdateCustomerDto({ phone: '' })).toThrow(AppError);
  });

  it('should trim valid name and phone', () => {
    const result = validateUpdateCustomerDto({ name: ' Jane ', phone: ' 999 ' });
    expect(result.name).toBe('Jane');
    expect(result.phone).toBe('999');
  });

  it('should set alternatePhone to null when null', () => {
    const result = validateUpdateCustomerDto({ alternatePhone: null });
    expect(result.alternatePhone).toBeNull();
  });

  it('should set address to null when null', () => {
    const result = validateUpdateCustomerDto({ address: null });
    expect(result.address).toBeNull();
  });

  it('should stringify and trim non-null alternatePhone', () => {
    const result = validateUpdateCustomerDto({ alternatePhone: 12345 });
    expect(result.alternatePhone).toBe('12345');
  });
});
