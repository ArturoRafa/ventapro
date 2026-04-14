import { Errors } from '../utils/AppError';

/* ── Interfaces ─────────────────────────────────────── */

export interface ReportDateRangeDto {
  from?: string;
  to?: string;
}

export interface TopProductsFilters extends ReportDateRangeDto {
  sortBy: 'quantity' | 'revenue';
  limit: number;
}

export interface CashRegisterReportFilters extends ReportDateRangeDto {
  cashierId?: number;
}

/* ── Validators ─────────────────────────────────────── */

function parseDateRange(query: Record<string, unknown>): ReportDateRangeDto {
  const dto: ReportDateRangeDto = {};

  if (query.from !== undefined) {
    if (typeof query.from !== 'string' || isNaN(Date.parse(query.from))) {
      throw Errors.validation('"from" must be a valid date string (ISO 8601)');
    }
    dto.from = query.from;
  }

  if (query.to !== undefined) {
    if (typeof query.to !== 'string' || isNaN(Date.parse(query.to))) {
      throw Errors.validation('"to" must be a valid date string (ISO 8601)');
    }
    dto.to = query.to;
  }

  if (dto.from && dto.to && new Date(dto.from) > new Date(dto.to)) {
    throw Errors.validation('"from" must be before or equal to "to"');
  }

  return dto;
}

export function validateReportDateRange(query: Record<string, unknown>): ReportDateRangeDto {
  return parseDateRange(query);
}

export function validateTopProductsFilters(query: Record<string, unknown>): TopProductsFilters {
  const dateRange = parseDateRange(query);

  let sortBy: 'quantity' | 'revenue' = 'quantity';
  if (query.sortBy !== undefined) {
    if (query.sortBy !== 'quantity' && query.sortBy !== 'revenue') {
      throw Errors.validation('"sortBy" must be "quantity" or "revenue"');
    }
    sortBy = query.sortBy;
  }

  let limit = 10;
  if (query.limit !== undefined) {
    limit = Math.floor(Number(query.limit));
    if (isNaN(limit) || limit < 1) {
      throw Errors.validation('"limit" must be a positive integer');
    }
    limit = Math.min(50, limit);
  }

  return { ...dateRange, sortBy, limit };
}

export function validateCashRegisterReportFilters(query: Record<string, unknown>): CashRegisterReportFilters {
  const dateRange = parseDateRange(query);
  const dto: CashRegisterReportFilters = { ...dateRange };

  if (query.cashierId !== undefined) {
    const cashierId = Number(query.cashierId);
    if (isNaN(cashierId) || cashierId < 1) {
      throw Errors.validation('"cashierId" must be a positive number');
    }
    dto.cashierId = cashierId;
  }

  return dto;
}
