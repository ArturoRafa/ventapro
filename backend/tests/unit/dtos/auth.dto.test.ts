import { validateLoginDto } from '@/dtos/auth.dto';
import { AppError } from '@/utils/AppError';

describe('validateLoginDto', () => {
  it('should return valid DTO with lowercased trimmed email', () => {
    const result = validateLoginDto({ email: 'Test@Example.COM', password: 'pass123' });
    expect(result.email).toBe('test@example.com');
    expect(result.password).toBe('pass123');
  });

  it('should throw when email is missing', () => {
    expect(() => validateLoginDto({ password: 'pass' })).toThrow(AppError);
  });

  it('should throw when email is not a string', () => {
    expect(() => validateLoginDto({ email: 123, password: 'pass' })).toThrow(AppError);
  });

  it('should throw when password is missing', () => {
    expect(() => validateLoginDto({ email: 'test@test.com' })).toThrow(AppError);
  });

  it('should throw when password is not a string', () => {
    expect(() => validateLoginDto({ email: 'test@test.com', password: 123 })).toThrow(AppError);
  });

  it('should throw for invalid email format', () => {
    expect(() => validateLoginDto({ email: 'notanemail', password: 'pass' })).toThrow(AppError);
  });

  it('should throw for email without domain', () => {
    expect(() => validateLoginDto({ email: 'test@', password: 'pass' })).toThrow(AppError);
  });
});
