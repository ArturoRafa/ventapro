import { Errors } from '../utils/AppError';

export interface CreateSaleItemDto {
  productId: number;
  quantity: number;
}

export interface CreateSaleDto {
  items: CreateSaleItemDto[];
  paymentMethod: 'cash' | 'card' | 'transfer';
  customerId?: number;
  status: 'paid' | 'pending';
}

export function validateCreateSaleDto(body: Record<string, unknown>): CreateSaleDto {
  // items — required array with at least 1 element
  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw Errors.validation('Items must be a non-empty array');
  }

  const items: CreateSaleItemDto[] = [];
  for (let i = 0; i < body.items.length; i++) {
    const item = body.items[i] as Record<string, unknown>;
    if (!item || typeof item !== 'object') {
      throw Errors.validation(`Item at index ${i} must be an object`);
    }
    if (typeof item.productId !== 'number' || item.productId <= 0) {
      throw Errors.validation(`Item at index ${i}: productId must be a number > 0`);
    }
    if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw Errors.validation(`Item at index ${i}: quantity must be an integer > 0`);
    }
    items.push({ productId: item.productId, quantity: item.quantity });
  }

  // paymentMethod — required enum
  const validMethods = ['cash', 'card', 'transfer'];
  if (typeof body.paymentMethod !== 'string' || !validMethods.includes(body.paymentMethod)) {
    throw Errors.validation('Payment method must be one of: cash, card, transfer');
  }

  // status — optional, defaults to 'paid'
  let status: 'paid' | 'pending' = 'paid';
  if (body.status !== undefined) {
    if (body.status !== 'paid' && body.status !== 'pending') {
      throw Errors.validation('Status must be paid or pending');
    }
    status = body.status;
  }

  // customerId — optional, required if credit sale
  let customerId: number | undefined;
  if (body.customerId !== undefined && body.customerId !== null) {
    if (typeof body.customerId !== 'number' || body.customerId <= 0) {
      throw Errors.validation('Customer ID must be a number > 0');
    }
    customerId = body.customerId;
  }

  if (status === 'pending' && !customerId) {
    throw Errors.validation('Customer is required for credit sales');
  }

  return {
    items,
    paymentMethod: body.paymentMethod as CreateSaleDto['paymentMethod'],
    customerId,
    status,
  };
}
