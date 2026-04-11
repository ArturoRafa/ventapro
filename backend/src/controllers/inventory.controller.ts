import { Request, Response, NextFunction } from 'express';

import * as inventoryService from '../services/inventory.service';
import { validateAdjustStockDto } from '../dtos/product.dto';

export async function getStockView(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await inventoryService.getStockView({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      search: req.query.search as string | undefined,
      lowStockOnly: req.query.lowStockOnly === 'true',
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateAdjustStockDto(req.body);
    const product = await inventoryService.adjustStock(Number(req.params.id), dto);
    res.json({ data: product });
  } catch (error) {
    next(error);
  }
}
