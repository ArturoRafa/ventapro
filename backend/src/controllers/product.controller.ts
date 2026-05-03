import { Request, Response, NextFunction } from 'express';

import * as productService from '../services/product.service';
import { validateCreateProductDto, validateUpdateProductDto } from '../dtos/product.dto';

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const typeParam = req.query.type as string | undefined;
    const statusParam = req.query.status as string | undefined;
    const result = await productService.findAll({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      subcategoryId: req.query.subcategoryId ? Number(req.query.subcategoryId) : undefined,
      type: typeParam && ['inventory', 'food'].includes(typeParam) ? typeParam as 'inventory' | 'food' : undefined,
      status: statusParam && ['activo', 'inactivo'].includes(statusParam) ? statusParam as 'activo' | 'inactivo' : undefined,
      search: req.query.search as string | undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productService.findById(Number(req.params.id));
    res.json({ data: product });
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateCreateProductDto(req.body);
    const product = await productService.create(dto);
    res.status(201).json({ data: product });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateUpdateProductDto(req.body);
    const product = await productService.update(Number(req.params.id), dto);
    res.json({ data: product });
  } catch (error) {
    next(error);
  }
}

export async function toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productService.toggleStatus(Number(req.params.id));
    res.json({ data: product });
  } catch (error) {
    next(error);
  }
}

export async function getLowStock(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const products = await productService.getLowStockProducts();
    res.json({ data: products });
  } catch (error) {
    next(error);
  }
}
