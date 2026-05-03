export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Factory methods for common errors
export const Errors = {
  notFound: (message: string, details?: unknown): AppError =>
    new AppError(message, 'NOT_FOUND', 404, details),

  unauthorized: (message = 'Invalid or expired token'): AppError =>
    new AppError(message, 'UNAUTHORIZED', 401),

  forbidden: (message = 'Insufficient permissions'): AppError =>
    new AppError(message, 'FORBIDDEN', 403),

  invalidCredentials: (): AppError =>
    new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401),

  validation: (message: string, details?: unknown): AppError =>
    new AppError(message, 'VALIDATION_ERROR', 400, details),

  conflict: (message: string, details?: unknown): AppError =>
    new AppError(message, 'DUPLICATE_ENTRY', 409, details),

  insufficientStock: (productName: string, available: number, requested: number): AppError =>
    new AppError(
      `Insufficient stock for product '${productName}'. Available: ${available}, requested: ${requested}.`,
      'INSUFFICIENT_STOCK',
      422,
      { available, requested },
    ),

  inactiveProduct: (productName: string): AppError =>
    new AppError(`Product '${productName}' is inactive`, 'INACTIVE_PRODUCT', 422),

  cashRegisterClosed: (): AppError =>
    new AppError('No open cash register found', 'CASH_REGISTER_CLOSED', 422),

  creditAlreadyPaid: (): AppError =>
    new AppError('This credit has already been fully paid', 'CREDIT_ALREADY_PAID', 422),

  paymentExceedsBalance: (amount: number, balance: number): AppError =>
    new AppError(
      `Payment amount (${amount}) exceeds pending balance (${balance})`,
      'PAYMENT_EXCEEDS_BALANCE',
      422,
      { amount, balance },
    ),
};
