import { Request, Response, NextFunction } from 'express';

import * as customerService from '../services/customer.service';
import { validateCreateCustomerDto, validateUpdateCustomerDto } from '../dtos/customer.dto';

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const statusParam = req.query.status as string | undefined;
    const result = await customerService.findAll({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      search: req.query.search as string | undefined,
      status: statusParam && ['activo', 'inactivo'].includes(statusParam) ? statusParam as 'activo' | 'inactivo' : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const customer = await customerService.findById(Number(req.params.id));
    res.json({ data: customer });
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateCreateCustomerDto(req.body);
    const customer = await customerService.create(dto);
    res.status(201).json({ data: customer });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateUpdateCustomerDto(req.body);
    const customer = await customerService.update(Number(req.params.id), dto);
    res.json({ data: customer });
  } catch (error) {
    next(error);
  }
}

export async function toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const customer = await customerService.toggleStatus(Number(req.params.id));
    res.json({ data: customer });
  } catch (error) {
    next(error);
  }
}
