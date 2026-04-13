import { Request, Response, NextFunction } from 'express';

import * as creditService from '../services/credit.service';
import { validateCreateCreditPaymentDto } from '../dtos/credit.dto';

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const statusParam = req.query.status as string | undefined;

    const result = await creditService.findAll({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      customerId: req.query.customerId ? Number(req.query.customerId) : undefined,
      status:
        statusParam && ['pending', 'paid'].includes(statusParam)
          ? (statusParam as 'pending' | 'paid')
          : undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const credit = await creditService.findById(Number(req.params.id));
    res.json({ data: credit });
  } catch (error) {
    next(error);
  }
}

export async function createPayment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = validateCreateCreditPaymentDto(req.body);
    const credit = await creditService.createPayment(Number(req.params.id), req.user!.id, dto);
    res.status(201).json({ data: credit });
  } catch (error) {
    next(error);
  }
}
