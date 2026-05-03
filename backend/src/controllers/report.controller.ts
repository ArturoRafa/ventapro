import { Request, Response, NextFunction } from 'express';

import * as reportService from '../services/report.service';
import * as configService from '../services/config.service';
import { Errors } from '../utils/AppError';
import {
  validateReportDateRange,
  validateTopProductsFilters,
  validateCashRegisterReportFilters,
} from '../dtos/report.dto';

async function ensureReportsEnabled(): Promise<void> {
  const config = await configService.getConfig();
  if (!config.usesReports) {
    throw Errors.forbidden('Reports feature is disabled');
  }
}

export async function salesSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await ensureReportsEnabled();
    const filters = validateReportDateRange(req.query as Record<string, unknown>);
    const data = await reportService.salesSummary(filters);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function topProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await ensureReportsEnabled();
    const filters = validateTopProductsFilters(req.query as Record<string, unknown>);
    const data = await reportService.topProducts(filters);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function salesByCashier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await ensureReportsEnabled();
    const filters = validateReportDateRange(req.query as Record<string, unknown>);
    const data = await reportService.salesByCashier(filters);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function creditSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await ensureReportsEnabled();
    const data = await reportService.creditSummary();
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function cashRegisterSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await ensureReportsEnabled();
    const filters = validateCashRegisterReportFilters(req.query as Record<string, unknown>);
    const data = await reportService.cashRegisterSummary(filters);
    res.json({ data });
  } catch (error) {
    next(error);
  }
}
