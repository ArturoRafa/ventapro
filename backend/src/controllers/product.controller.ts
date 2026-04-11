import { Request, Response, NextFunction } from 'express';

import * as productService from '../services/product.service';
import { validateCreateProductDto, validateUpdateProductDto } from '../dtos/product.dto';

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await productService.findAll({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      subcategoryId: req.query.subcategoryId ? Number(req.query.subcategoryId) : undefined,
      type: req.query.type as 'inventory' | 'food' | undefined,
      status: req.query.status as 'activo' | 'inactivo' | undefined,
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
