import { Request, Response, NextFunction } from 'express';

import * as categoryService from '../services/category.service';
import { validateCreateCategoryDto, validateUpdateCategoryDto } from '../dtos/category.dto';

export async function findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const categories = await categoryService.findAll(includeInactive);
    res.json({ data: categories });
  } catch (error) {
    next(error);
  }
}

export async function findById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await categoryService.findById(Number(req.params.id));
    res.json({ data: category });
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateCreateCategoryDto(req.body);
    const category = await categoryService.create(dto);
    res.status(201).json({ data: category });
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = validateUpdateCategoryDto(req.body);
    const category = await categoryService.update(Number(req.params.id), dto);
    res.json({ data: category });
  } catch (error) {
    next(error);
  }
}

export async function toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await categoryService.toggleStatus(Number(req.params.id));
    res.json({ data: category });
  } catch (error) {
    next(error);
  }
}
