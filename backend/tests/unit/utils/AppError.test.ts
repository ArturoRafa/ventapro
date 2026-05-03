import { AppError, Errors } from '@/utils/AppError';

describe('AppError', () => {
  it('should set message, code, status, and details', () => {
    const err = new AppError('test message', 'TEST_CODE', 418, { foo: 'bar' });
    expect(err.message).toBe('test message');
    expect(err.code).toBe('TEST_CODE');
    expect(err.status).toBe(418);
    expect(err.details).toEqual({ foo: 'bar' });
  });

  it('should be an instance of Error and AppError', () => {
    const err = new AppError('msg', 'CODE', 400);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it('should have undefined details when not provided', () => {
    const err = new AppError('msg', 'CODE', 400);
    expect(err.details).toBeUndefined();
  });
});

describe('Errors factory', () => {
  it('notFound returns 404 with correct code', () => {
    const err = Errors.notFound('Item not found', { id: 1 });
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Item not found');
    expect(err.details).toEqual({ id: 1 });
  });

  it('unauthorized returns 401 with default message', () => {
    const err = Errors.unauthorized();
    expect(err.status).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toBe('Invalid or expired token');
  });

  it('unauthorized accepts custom message', () => {
    const err = Errors.unauthorized('Custom msg');
    expect(err.message).toBe('Custom msg');
  });

  it('forbidden returns 403 with default message', () => {
    const err = Errors.forbidden();
    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.message).toBe('Insufficient permissions');
  });

  it('invalidCredentials returns 401', () => {
    const err = Errors.invalidCredentials();
    expect(err.status).toBe(401);
    expect(err.code).toBe('INVALID_CREDENTIALS');
    expect(err.message).toBe('Invalid email or password');
  });

  it('validation returns 400 with details', () => {
    const err = Errors.validation('Bad input', { field: 'email' });
    expect(err.status).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toEqual({ field: 'email' });
  });

  it('conflict returns 409', () => {
    const err = Errors.conflict('Already exists');
    expect(err.status).toBe(409);
    expect(err.code).toBe('DUPLICATE_ENTRY');
  });

  it('insufficientStock returns 422 with interpolated message and details', () => {
    const err = Errors.insufficientStock('Coffee', 5, 10);
    expect(err.status).toBe(422);
    expect(err.code).toBe('INSUFFICIENT_STOCK');
    expect(err.message).toContain('Coffee');
    expect(err.message).toContain('5');
    expect(err.message).toContain('10');
    expect(err.details).toEqual({ available: 5, requested: 10 });
  });

  it('inactiveProduct returns 422', () => {
    const err = Errors.inactiveProduct('Cake');
    expect(err.status).toBe(422);
    expect(err.code).toBe('INACTIVE_PRODUCT');
    expect(err.message).toContain('Cake');
  });

  it('cashRegisterClosed returns 422', () => {
    const err = Errors.cashRegisterClosed();
    expect(err.status).toBe(422);
    expect(err.code).toBe('CASH_REGISTER_CLOSED');
  });

  it('creditAlreadyPaid returns 422', () => {
    const err = Errors.creditAlreadyPaid();
    expect(err.status).toBe(422);
    expect(err.code).toBe('CREDIT_ALREADY_PAID');
  });

  it('paymentExceedsBalance returns 422 with details', () => {
    const err = Errors.paymentExceedsBalance(3000, 2000);
    expect(err.status).toBe(422);
    expect(err.code).toBe('PAYMENT_EXCEEDS_BALANCE');
    expect(err.message).toContain('3000');
    expect(err.message).toContain('2000');
    expect(err.details).toEqual({ amount: 3000, balance: 2000 });
  });
});
