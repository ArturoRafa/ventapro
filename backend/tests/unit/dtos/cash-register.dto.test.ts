import { validateOpenCashRegisterDto, validateCloseCashRegisterDto } from '@/dtos/cash-register.dto';
import { AppError } from '@/utils/AppError';

describe('validateOpenCashRegisterDto', () => {
  it('should return empty DTO when no initialAmount', () => {
    const result = validateOpenCashRegisterDto({});
    expect(result).toEqual({});
  });

  it('should return DTO with valid initialAmount', () => {
    const result = validateOpenCashRegisterDto({ initialAmount: 50000 });
    expect(result.initialAmount).toBe(50000);
  });

  it('should accept zero initialAmount', () => {
    const result = validateOpenCashRegisterDto({ initialAmount: 0 });
    expect(result.initialAmount).toBe(0);
  });

  it('should throw for negative initialAmount', () => {
    expect(() => validateOpenCashRegisterDto({ initialAmount: -100 })).toThrow(AppError);
  });

  it('should ignore null initialAmount', () => {
    const result = validateOpenCashRegisterDto({ initialAmount: null });
    expect(result).toEqual({});
  });
});

describe('validateCloseCashRegisterDto', () => {
  it('should return DTO with valid actualCloseAmount', () => {
    const result = validateCloseCashRegisterDto({ actualCloseAmount: 100000 });
    expect(result.actualCloseAmount).toBe(100000);
    expect(result.closingNotes).toBeUndefined();
  });

  it('should accept zero actualCloseAmount', () => {
    const result = validateCloseCashRegisterDto({ actualCloseAmount: 0 });
    expect(result.actualCloseAmount).toBe(0);
  });

  it('should throw when actualCloseAmount is missing', () => {
    expect(() => validateCloseCashRegisterDto({})).toThrow(AppError);
  });

  it('should throw for negative actualCloseAmount', () => {
    expect(() => validateCloseCashRegisterDto({ actualCloseAmount: -1 })).toThrow(AppError);
  });

  it('should include trimmed closingNotes', () => {
    const result = validateCloseCashRegisterDto({ actualCloseAmount: 100, closingNotes: '  some notes  ' });
    expect(result.closingNotes).toBe('some notes');
  });

  it('should omit empty closingNotes after trim', () => {
    const result = validateCloseCashRegisterDto({ actualCloseAmount: 100, closingNotes: '   ' });
    expect(result.closingNotes).toBeUndefined();
  });

  it('should throw for non-string closingNotes', () => {
    expect(() => validateCloseCashRegisterDto({ actualCloseAmount: 100, closingNotes: 123 })).toThrow(AppError);
  });
});
