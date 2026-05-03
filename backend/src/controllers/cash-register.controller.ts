import { Request, Response, NextFunction } from 'express';

import * as cashRegisterService from '../services/cash-register.service';
import {
  validateOpenCashRegisterDto,
  validateCloseCashRegisterDto,
} from '../dtos/cash-register.dto';

export async function open(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateOpenCashRegisterDto(req.body);
    const register = await cashRegisterService.open(req.user!.id, dto);
    res.status(201).json({ data: register });
  } catch (error) {
    next(error);
  }
}

export async function close(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateCloseCashRegisterDto(req.body);
    const register = await cashRegisterService.close(req.user!.id, dto);
    res.json({ data: register });
  } catch (error) {
    next(error);
  }
}

export async function findCurrent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const register = await cashRegisterService.findCurrent(req.user!.id);
    res.json({ data: register });
  } catch (error) {
    next(error);
  }
}

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const statusParam = req.query.status as string | undefined;
    const result = await cashRegisterService.findAll({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      cashierId: req.query.cashierId ? Number(req.query.cashierId) : undefined,
      status:
        statusParam && ['abierta', 'cerrada'].includes(statusParam)
          ? (statusParam as 'abierta' | 'cerrada')
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
    const register = await cashRegisterService.findById(Number(req.params.id));
    res.json({ data: register });
  } catch (error) {
    next(error);
  }
}
