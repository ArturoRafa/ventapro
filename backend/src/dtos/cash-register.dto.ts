import { Errors } from '../utils/AppError';

export interface OpenCashRegisterDto {
  initialAmount?: number | null;
}

export interface CloseCashRegisterDto {
  actualCloseAmount: number;
  closingNotes?: string;
}

export function validateOpenCashRegisterDto(body: Record<string, unknown>): OpenCashRegisterDto {
  const dto: OpenCashRegisterDto = {};

  if (body.initialAmount !== undefined && body.initialAmount !== null) {
    if (typeof body.initialAmount !== 'number' || body.initialAmount < 0) {
      throw Errors.validation('Initial amount must be a number >= 0');
    }
    dto.initialAmount = body.initialAmount;
  }

  return dto;
}

export function validateCloseCashRegisterDto(body: Record<string, unknown>): CloseCashRegisterDto {
  if (typeof body.actualCloseAmount !== 'number' || body.actualCloseAmount < 0) {
    throw Errors.validation('Actual close amount is required and must be >= 0');
  }

  const dto: CloseCashRegisterDto = {
    actualCloseAmount: body.actualCloseAmount,
  };

  if (body.closingNotes !== undefined) {
    if (typeof body.closingNotes !== 'string') {
      throw Errors.validation('Closing notes must be a string');
    }
    dto.closingNotes = body.closingNotes.trim() || undefined;
  }

  return dto;
}
