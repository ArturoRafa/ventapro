import { Request, Response, NextFunction } from 'express';

import * as subcategoryService from '../services/subcategory.service';
import { validateCreateSubcategoryDto, validateUpdateSubcategoryDto } from '../dtos/category.dto';

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const includeInactive = req.query.includeInactive === 'true';
    const subcategories = await subcategoryService.findAll(categoryId, includeInactive);
    res.json({ data: subcategories });
  } catch (error) {
    next(error);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sub = await subcategoryService.findById(Number(req.params.id));
    res.json({ data: sub });
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateCreateSubcategoryDto(req.body);
    const sub = await subcategoryService.create(dto);
    res.status(201).json({ data: sub });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateUpdateSubcategoryDto(req.body);
    const sub = await subcategoryService.update(Number(req.params.id), dto);
    res.json({ data: sub });
  } catch (error) {
    next(error);
  }
}

export async function toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sub = await subcategoryService.toggleStatus(Number(req.params.id));
    res.json({ data: sub });
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await subcategoryService.remove(Number(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
