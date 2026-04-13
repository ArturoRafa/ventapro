import { Errors } from '../utils/AppError';

export interface CreateCreditPaymentDto {
  amount: number;
  notes?: string;
}

export function validateCreateCreditPaymentDto(
  body: Record<string, unknown>,
): CreateCreditPaymentDto {
  if (typeof body.amount !== 'number' || body.amount <= 0) {
    throw Errors.validation('Amount must be a number greater than 0');
  }

  let notes: string | undefined;
  if (body.notes !== undefined && body.notes !== null) {
    if (typeof body.notes !== 'string') {
      throw Errors.validation('Notes must be a string');
    }
    const trimmed = body.notes.trim();
    if (trimmed.length > 0) {
      notes = trimmed;
    }
  }

  return { amount: body.amount, notes };
}
