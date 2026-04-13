import { Request, Response, NextFunction } from 'express';

import * as saleService from '../services/sale.service';
import { validateCreateSaleDto } from '../dtos/sale.dto';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateCreateSaleDto(req.body);
    const sale = await saleService.create(req.user!.id, dto);
    res.status(201).json({ data: sale });
  } catch (error) {
    next(error);
  }
}

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const paymentMethodParam = req.query.paymentMethod as string | undefined;
    const statusParam = req.query.status as string | undefined;

    const result = await saleService.findAll({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      cashRegisterId: req.query.cashRegisterId ? Number(req.query.cashRegisterId) : undefined,
      cashierId: req.query.cashierId ? Number(req.query.cashierId) : undefined,
      paymentMethod:
        paymentMethodParam && ['cash', 'card', 'transfer'].includes(paymentMethodParam)
          ? (paymentMethodParam as 'cash' | 'card' | 'transfer')
          : undefined,
      status:
        statusParam && ['paid', 'pending'].includes(statusParam)
          ? (statusParam as 'paid' | 'pending')
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
    const sale = await saleService.findById(Number(req.params.id));
    res.json({ data: sale });
  } catch (error) {
    next(error);
  }
}
